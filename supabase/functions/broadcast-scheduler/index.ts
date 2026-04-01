import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function randomDelay(min = 15000, max = 25000): Promise<void> {
  const ms = min + Math.random() * (max - min);
  console.log(`Waiting ${Math.round(ms / 1000)}s before next send...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Missing env vars" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Fetch pending broadcasts that are due
    const { data: pendingBroadcasts, error: fetchError } = await supabase
      .from("scheduled_broadcasts")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(5);

    if (fetchError) {
      console.error("Error fetching scheduled broadcasts:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingBroadcasts || pendingBroadcasts.length === 0) {
      return new Response(JSON.stringify({ message: "No pending broadcasts" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingBroadcasts.length} pending broadcast(s)`);

    // Get active Z-API instance
    const { data: instance } = await supabase
      .from("zapi_instances")
      .select("*")
      .eq("connected", true)
      .limit(1)
      .maybeSingle();

    if (!instance) {
      // Mark all as error - no instance
      for (const broadcast of pendingBroadcasts) {
        await supabase
          .from("scheduled_broadcasts")
          .update({ status: "error", error_message: "No active Z-API instance" })
          .eq("id", broadcast.id);
      }
      return new Response(JSON.stringify({ error: "No active Z-API instance" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const clientToken = instance.client_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(clientToken ? { "Client-Token": clientToken } : {}),
    };

    // Capability matrix: defines what each type supports
    const CAPS: Record<string, { inlineText: boolean; nativeMention: boolean }> = {
      text:  { inlineText: true,  nativeMention: true  },
      gif:   { inlineText: true,  nativeMention: true  },
      image: { inlineText: true,  nativeMention: false },
      video: { inlineText: true,  nativeMention: false },
      link:  { inlineText: true,  nativeMention: false },
      audio: { inlineText: false, nativeMention: false },
    };

    // Helper: fetch group participants for mention
    async function fetchGroupParticipants(phone: string): Promise<string[]> {
      try {
        const resp = await fetch(`${baseUrl}/group-metadata/${phone}`, { method: "GET", headers });
        if (!resp.ok) return [];
        const data = await resp.json();
        return (data?.participants || []).map((p: { phone?: string }) => p.phone).filter(Boolean);
      } catch {
        return [];
      }
    }

    // Process each broadcast
    for (const broadcast of pendingBroadcasts) {
      // Mark as processing
      await supabase
        .from("scheduled_broadcasts")
        .update({ status: "processing" })
        .eq("id", broadcast.id);

      console.log(`Processing broadcast ${broadcast.id} (type: ${broadcast.type})`);

      const cap = CAPS[broadcast.type] || { inlineText: false, nativeMention: false };
      const useMention = !!broadcast.mention_all && cap.nativeMention;
      if (broadcast.mention_all && !cap.nativeMention) {
        console.log(`mention_all requested for type '${broadcast.type}' but not supported natively — ignoring to prevent duplicate messages`);
      }

      const results: { groupPhone: string; status: string; error?: string }[] = [];
      const groupPhones: string[] = broadcast.group_phones || [];

      for (let i = 0; i < groupPhones.length; i++) {
        const phone = groupPhones[i];
        try {
          let mentionedPhones: string[] | undefined;
          if (useMention) {
            mentionedPhones = await fetchGroupParticipants(phone);
          }

          let endpoint: string;
          let payload: Record<string, unknown>;

          switch (broadcast.type) {
            case "text":
              endpoint = `${baseUrl}/send-text`;
              payload = {
                phone,
                message: broadcast.message || "",
                ...(mentionedPhones?.length ? { mentioned: mentionedPhones } : {}),
              };
              break;
            case "image":
              endpoint = `${baseUrl}/send-image`;
              payload = { phone, image: broadcast.media_url, caption: broadcast.caption || broadcast.message || "" };
              break;
            case "audio":
              endpoint = `${baseUrl}/send-audio`;
              payload = { phone, audio: broadcast.media_url };
              break;
            case "video":
              endpoint = `${baseUrl}/send-video`;
              payload = { phone, video: broadcast.media_url, caption: broadcast.caption || broadcast.message || "" };
              break;
            case "gif":
              endpoint = `${baseUrl}/send-gif`;
              payload = {
                phone,
                gif: broadcast.media_url,
                caption: broadcast.caption || broadcast.message || "",
                ...(mentionedPhones?.length ? { mentioned: mentionedPhones } : {}),
              };
              break;
            case "link":
              endpoint = `${baseUrl}/send-link`;
              payload = {
                phone,
                message: broadcast.message || "",
                linkUrl: broadcast.link_url || "",
                title: broadcast.link_title || "",
                linkDescription: broadcast.link_description || "",
                image: broadcast.link_image || "",
              };
              break;
            default:
              results.push({ groupPhone: phone, status: "error", error: `Unknown type: ${broadcast.type}` });
              continue;
          }

          const resp = await fetch(endpoint, { method: "POST", headers, body: JSON.stringify(payload) });
          const respData = await resp.json();

          if (resp.ok) {
            results.push({ groupPhone: phone, status: "sent" });
          } else {
            results.push({ groupPhone: phone, status: "error", error: respData?.error || respData?.message || `HTTP ${resp.status}` });
          }

          // No follow-up text — capability matrix ensures only native mention types are used
        } catch (err) {
          results.push({ groupPhone: phone, status: "error", error: err instanceof Error ? err.message : "Unknown error" });
        }

        // Random delay between sends
        if (i < groupPhones.length - 1) {
          await randomDelay();
        }
      }

      const sentCount = results.filter((r) => r.status === "sent").length;
      const errorCount = results.filter((r) => r.status === "error").length;

      // Update broadcast with results
      await supabase
        .from("scheduled_broadcasts")
        .update({
          status: errorCount === results.length ? "error" : "sent",
          results,
          sent_count: sentCount,
          error_count: errorCount,
        })
        .eq("id", broadcast.id);

      // Also save to broadcast_logs for history
      await supabase.from("broadcast_logs").insert({
        user_id: broadcast.user_id,
        type: broadcast.type,
        message: broadcast.message,
        media_url: broadcast.media_url,
        caption: broadcast.caption,
        link_url: broadcast.link_url,
        link_title: broadcast.link_title,
        link_description: broadcast.link_description,
        link_image: broadcast.link_image,
        group_phones: broadcast.group_phones,
        results,
        sent_count: sentCount,
        error_count: errorCount,
      });

      console.log(`Broadcast ${broadcast.id} completed: ${sentCount} sent, ${errorCount} errors`);
    }

    return new Response(JSON.stringify({ processed: pendingBroadcasts.length }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Scheduler error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
