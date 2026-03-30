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
    const { type, message, media_url, caption, link_url, link_title, link_description, link_image, group_phones } = body;

    if (!type || !group_phones || !Array.isArray(group_phones) || group_phones.length === 0) {
      return new Response(JSON.stringify({ error: "type and group_phones are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { groupPhone: string; status: string; error?: string }[] = [];

    for (let i = 0; i < group_phones.length; i++) {
      const phone = group_phones[i];
      try {
        let endpoint: string;
        let payload: Record<string, unknown>;

        switch (type) {
          case "text":
            endpoint = `${baseUrl}/send-text`;
            payload = { phone, message: message || "" };
            break;
          case "image":
            endpoint = `${baseUrl}/send-image`;
            payload = { phone, image: media_url, caption: caption || message || "" };
            break;
          case "audio":
            endpoint = `${baseUrl}/send-audio`;
            payload = { phone, audio: media_url };
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
