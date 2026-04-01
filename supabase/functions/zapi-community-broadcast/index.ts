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
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get active Z-API instance
    const { data: instance } = await supabase
      .from("zapi_instances")
      .select("*")
      .eq("connected", true)
      .limit(1)
      .maybeSingle();

    if (!instance) {
      return new Response(JSON.stringify({ error: "No active Z-API instance" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const clientToken = instance.client_token;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(clientToken ? { "Client-Token": clientToken } : {}),
    };

    const body = await req.json();
    const { type, message, media_url, caption, link_url, link_title, link_description, link_image, group_phones, mention_all } = body;

    // Capability matrix: defines what each type supports
    const CAPS: Record<string, { inlineText: boolean; nativeMention: boolean }> = {
      text:  { inlineText: true,  nativeMention: true  },
      gif:   { inlineText: true,  nativeMention: true  },
      image: { inlineText: true,  nativeMention: false },
      video: { inlineText: true,  nativeMention: false },
      link:  { inlineText: true,  nativeMention: false },
      audio: { inlineText: false, nativeMention: false },
    };

    if (!type || !group_phones || !Array.isArray(group_phones) || group_phones.length === 0) {
      return new Response(JSON.stringify({ error: "type and group_phones are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Helper: fetch group participants for mention
    async function fetchGroupParticipants(phone: string): Promise<string[]> {
      try {
        const resp = await fetch(`${baseUrl}/group-metadata/${phone}`, { method: "GET", headers });
        if (!resp.ok) {
          console.log(`Failed to fetch metadata for ${phone}: HTTP ${resp.status}`);
          return [];
        }
        const data = await resp.json();
        const participants = data?.participants || [];
        return participants.map((p: { phone?: string }) => p.phone).filter(Boolean);
      } catch (err) {
        console.error(`Error fetching participants for ${phone}:`, err);
        return [];
      }
    }

    const cap = CAPS[type];
    if (!cap) {
      return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const useMention = !!mention_all && cap.nativeMention;
    if (mention_all && !cap.nativeMention) {
      console.log(`mention_all requested for type '${type}' but not supported natively — ignoring to prevent duplicate messages`);
    }

    const results: { groupPhone: string; status: string; error?: string }[] = [];

    for (let i = 0; i < group_phones.length; i++) {
      const phone = group_phones[i];
      try {
        // Fetch participants only if this type supports native mention
        let mentionedPhones: string[] | undefined;
        if (useMention) {
          mentionedPhones = await fetchGroupParticipants(phone);
          console.log(`Fetched ${mentionedPhones?.length || 0} participants for mention in ${phone}`);
        }

        let endpoint: string;
        let payload: Record<string, unknown>;

        switch (type) {
          case "text":
            endpoint = `${baseUrl}/send-text`;
            payload = {
              phone,
              message: message || "",
              ...(mentionedPhones?.length ? { mentioned: mentionedPhones } : {}),
            };
            break;
          case "image":
            endpoint = `${baseUrl}/send-image`;
            payload = { phone, image: media_url, caption: caption || message || "" };
            break;
          case "audio":
            endpoint = `${baseUrl}/send-audio`;
            payload = { phone, audio: media_url };
            break;
          case "video":
            endpoint = `${baseUrl}/send-video`;
            payload = { phone, video: media_url, caption: caption || message || "" };
            break;
          case "gif":
            endpoint = `${baseUrl}/send-gif`;
            payload = {
              phone,
              gif: media_url,
              caption: caption || message || "",
              ...(mentionedPhones?.length ? { mentioned: mentionedPhones } : {}),
            };
            break;
          case "link":
            endpoint = `${baseUrl}/send-link`;
            payload = {
              phone,
              message: message || "",
              linkUrl: link_url || "",
              title: link_title || "",
              linkDescription: link_description || "",
              image: link_image || "",
            };
            break;
          default:
            results.push({ groupPhone: phone, status: "error", error: `Unknown type: ${type}` });
            continue;
        }

        console.log(`Sending ${type} to ${phone}...`);
        const resp = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const respData = await resp.json();
        console.log(`Response for ${phone}:`, JSON.stringify(respData));

        if (resp.ok) {
          results.push({ groupPhone: phone, status: "sent" });
        } else {
          results.push({
            groupPhone: phone,
            status: "error",
            error: respData?.error || respData?.message || `HTTP ${resp.status}`,
          });
        }

        // No follow-up text — capability matrix ensures only native mention types are used
      } catch (err) {
        console.error(`Error sending to ${phone}:`, err);
        results.push({
          groupPhone: phone,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }

      // Random delay between sends (15-25s) to avoid blocking
      if (i < group_phones.length - 1) {
        await randomDelay();
      }
    }

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
