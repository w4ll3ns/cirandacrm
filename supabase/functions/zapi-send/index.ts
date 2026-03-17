import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()! : "pdf";
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
    const {
      conversation_id, message, phone, retry_message_id,
      type = "text", media_url, media_filename, media_mime_type,
    } = body;

    if (!conversation_id) {
      return new Response(JSON.stringify({ error: "Missing conversation_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "text" && !message) {
      return new Response(JSON.stringify({ error: "Missing message" }), {
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

    // Build message record fields
    const msgFields: Record<string, any> = {
      conversation_id,
      direction: "outbound",
      sender_type: "usuario",
      content_text: message || null,
      type,
      sent_at: new Date().toISOString(),
      media_url: media_url || null,
      media_mime_type: media_mime_type || null,
      media_filename: media_filename || null,
    };

    if (!instance) {
      // No Z-API — save locally
      let msgId: string;
      if (retry_message_id) {
        await supabase.from("messages").update({ status: "pending", sent_at: new Date().toISOString() }).eq("id", retry_message_id);
        msgId = retry_message_id;
      } else {
        const { data: msgData, error: msgError } = await supabase.from("messages").insert({ ...msgFields, status: "pending" }).select("id").single();
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

    if (!instance.client_token) {
      let msgId: string;
      if (retry_message_id) {
        await supabase.from("messages").update({ status: "failed", sent_at: new Date().toISOString() }).eq("id", retry_message_id);
        msgId = retry_message_id;
      } else {
        const { data: msgData, error: msgError } = await supabase.from("messages").insert({ ...msgFields, status: "failed" }).select("id").single();
        if (msgError) throw msgError;
        msgId = msgData.id;
      }

      return new Response(JSON.stringify({
        error: "Client Token não configurado na instância Z-API.",
        error_code: "client_token_missing",
        message_id: msgId,
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetPhone = phone || body.target_phone;
    if (!targetPhone) {
      return new Response(JSON.stringify({ error: "No target phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build Z-API request based on type
    const baseUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    let zapiUrl: string;
    let zapiBody: Record<string, any>;

    switch (type) {
      case "image":
        zapiUrl = `${baseUrl}/send-image`;
        zapiBody = { phone: targetPhone, image: media_url, caption: message || "" };
        break;
      case "audio":
        zapiUrl = `${baseUrl}/send-audio`;
        zapiBody = { phone: targetPhone, audio: media_url };
        break;
      case "document": {
        const ext = media_filename ? getExtension(media_filename) : "pdf";
        zapiUrl = `${baseUrl}/send-document/${ext}`;
        zapiBody = { phone: targetPhone, document: media_url, fileName: media_filename || `arquivo.${ext}` };
        break;
      }
      case "video":
        zapiUrl = `${baseUrl}/send-video`;
        zapiBody = { phone: targetPhone, video: media_url, caption: message || "" };
        break;
      default:
        zapiUrl = `${baseUrl}/send-text`;
        zapiBody = { phone: targetPhone, message };
    }

    const zapiResponse = await fetch(zapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Client-Token": instance.client_token },
      body: JSON.stringify(zapiBody),
    });

    const zapiData = await zapiResponse.json();
    console.log("Z-API response:", JSON.stringify(zapiData));

    if (zapiData.error) {
      let msgId: string;
      if (retry_message_id) {
        await supabase.from("messages").update({ status: "failed", sent_at: new Date().toISOString() }).eq("id", retry_message_id);
        msgId = retry_message_id;
      } else {
        const { data: msgData, error: msgError } = await supabase.from("messages").insert({ ...msgFields, status: "failed" }).select("id").single();
        if (msgError) throw msgError;
        msgId = msgData.id;
      }

      return new Response(JSON.stringify({
        error: `Erro Z-API: ${zapiData.error}`,
        error_code: "zapi_error",
        message_id: msgId,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = zapiResponse.ok ? "sent" : "failed";
    const externalId = zapiData.zapiMessageId || zapiData.messageId || null;

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
        ...msgFields,
        status,
        external_message_id: externalId,
      }).select("id").single();
      if (msgError) throw msgError;
      msgId = msgData.id;
    }

    await supabase.from("conversations").update({
      ultima_mensagem_em: new Date().toISOString(),
      assigned_user_id: user.id,
      status: "em_atendimento",
    }).eq("id", conversation_id);

    if (!zapiResponse.ok) {
      await supabase.from("message_queue").insert({
        message_id: msgId,
        queue_type: "send",
        status: "pending",
        payload: { phone: targetPhone, message, conversation_id, type, media_url, media_filename },
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
