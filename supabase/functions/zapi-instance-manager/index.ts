import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZAPI_BASE = "https://api.z-api.io";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    if (!action || !["qrcode", "status", "disconnect", "restart"].includes(action)) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { instanceId } = await req.json();
    if (!instanceId) {
      return new Response(JSON.stringify({ error: "instanceId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch instance credentials from DB
    const { data: inst, error: dbErr } = await supabase
      .from("zapi_instances")
      .select("instance_id, token, client_token")
      .eq("id", instanceId)
      .single();

    if (dbErr || !inst) {
      return new Response(JSON.stringify({ error: "Instance not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!inst.client_token) {
      return new Response(JSON.stringify({ error: "Client Token not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const basePath = `${ZAPI_BASE}/instances/${inst.instance_id}/token/${inst.token}`;
    const headers: Record<string, string> = {
      "Client-Token": inst.client_token,
    };

    let zapiUrl: string;
    let method = "GET";

    switch (action) {
      case "qrcode":
        zapiUrl = `${basePath}/qr-code/image`;
        break;
      case "status":
        zapiUrl = `${basePath}/status`;
        break;
      case "disconnect":
        zapiUrl = `${basePath}/disconnect`;
        break;
      case "restart":
        zapiUrl = `${basePath}/restart`;
        break;
      default:
        zapiUrl = "";
    }

    console.log(`[zapi-instance-manager] action=${action} instanceId=${instanceId}`);

    const zapiRes = await fetch(zapiUrl, { method, headers });
    const zapiData = await zapiRes.json();

    console.log(`[zapi-instance-manager] Z-API response:`, JSON.stringify(zapiData));

    // If status check shows connected, update DB
    if (action === "status" && zapiData.connected === true) {
      await supabase
        .from("zapi_instances")
        .update({
          connected: true,
          status: "connected",
          phone_number: zapiData.smartPhoneConnected || zapiData.phoneConnected || null,
        })
        .eq("id", instanceId);
    } else if (action === "status" && zapiData.connected === false) {
      await supabase
        .from("zapi_instances")
        .update({ connected: false, status: "disconnected" })
        .eq("id", instanceId);
    }

    // If disconnect, update DB
    if (action === "disconnect") {
      await supabase
        .from("zapi_instances")
        .update({ connected: false, status: "disconnected", phone_number: null })
        .eq("id", instanceId);
    }

    return new Response(JSON.stringify(zapiData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[zapi-instance-manager] Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
