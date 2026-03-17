import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    // Validate auth
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

    const body = await req.json();
    const { conversation_id, message, phone, retry_message_id } = body;

    if (!conversation_id || !message) {
      return new Response(JSON.stringify({ error: "Missing conversation_id or message" }), {
        status: 400,
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
      // No Z-API instance configured — just save the message locally
      let msgId: string;
      if (retry_message_id) {
        await supabase.from("messages").update({ status: "pending", sent_at: new Date().toISOString() }).eq("id", retry_message_id);
        msgId = retry_message_id;
      } else {
        const { data: msgData, error: msgError } = await supabase.from("messages").insert({
          conversation_id,
          direction: "outbound",
          sender_type: "usuario",
          content_text: message,
          type: "text",
          status: "pending",
          sent_at: new Date().toISOString(),
        }).select("id").single();
        if (msgError) throw msgError;
        msgId = msgData.id;
      }

      await supabase.from("conversations").update({
        ultima_mensagem_em: new Date().toISOString(),
        assigned_user_id: user.id,
      }).eq("id", conversation_id);

      return new Response(JSON.stringify({ ok: true, sent_via: "local", message_id: msgId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Z-API
    const targetPhone = phone || body.target_phone;
    if (!targetPhone) {
      return new Response(JSON.stringify({ error: "No target phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const zapiUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}/send-text`;
    const zapiResponse = await fetch(zapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": instance.client_token || "" },
      body: JSON.stringify({ phone: targetPhone, message }),
    });

    const zapiData = await zapiResponse.json();
    console.log("Z-API response:", JSON.stringify(zapiData));

    const status = zapiResponse.ok ? "sent" : "failed";
    const externalId = zapiData.zapiMessageId || zapiData.messageId || null;

    // Save or update message
    let msgId: string;
    if (retry_message_id) {
      await supabase.from("messages").update({
        status,
        sent_at: new Date().toISOString(),
        external_message_id: externalId,
      }).eq("id", retry_message_id);
      msgId = retry_message_id;
    } else {
      const { data: msgData, error: msgError } = await supabase.from("messages").insert({
        conversation_id,
        direction: "outbound",
        sender_type: "usuario",
        content_text: message,
        type: "text",
        status,
        sent_at: new Date().toISOString(),
        external_message_id: externalId,
      }).select("id").single();
      if (msgError) throw msgError;
      msgId = msgData.id;
    }

    // Update conversation
    await supabase.from("conversations").update({
      ultima_mensagem_em: new Date().toISOString(),
      assigned_user_id: user.id,
      status: "em_atendimento",
    }).eq("id", conversation_id);

    // If failed, queue for retry
    if (!zapiResponse.ok) {
      await supabase.from("message_queue").insert({
        message_id: msgData.id,
        queue_type: "send",
        status: "pending",
        payload: { phone: targetPhone, message, conversation_id },
        last_error: JSON.stringify(zapiData),
      });
    }

    return new Response(JSON.stringify({ ok: true, sent_via: "zapi", status, zapi: zapiData }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
