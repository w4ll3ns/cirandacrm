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
    const payload = await req.json();
    console.log("Webhook payload:", JSON.stringify(payload));

    // Log the webhook event
    await supabase.from("webhook_events").insert({
      provider: "zapi",
      event_type: payload.event || "message",
      external_event_id: payload.messageId || null,
      payload,
    });

    // Only process incoming messages
    if (!payload.text && !payload.image && !payload.audio && !payload.document) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract phone number (Z-API sends in format 5511999999999@c.us)
    const rawPhone = payload.phone || payload.from || "";
    const phone = rawPhone.replace("@c.us", "").replace("@s.whatsapp.net", "");
    if (!phone) {
      return new Response(JSON.stringify({ error: "No phone number" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicate by external_message_id
    if (payload.messageId) {
      const { data: existing } = await supabase
        .from("messages")
        .select("id")
        .eq("external_message_id", payload.messageId)
        .maybeSingle();
      if (existing) {
        return new Response(JSON.stringify({ ok: true, deduplicated: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Find or create responsavel by phone
    let { data: responsavel } = await supabase
      .from("responsaveis")
      .select("id")
      .or(`telefone.eq.${phone},whatsapp.eq.${phone}`)
      .maybeSingle();

    if (!responsavel) {
      const { data: newResp } = await supabase
        .from("responsaveis")
        .insert({
          nome: payload.senderName || `WhatsApp ${phone}`,
          telefone: phone,
          whatsapp: phone,
          origem: "whatsapp",
        })
        .select("id")
        .single();
      responsavel = newResp;
    }

    if (!responsavel) {
      return new Response(JSON.stringify({ error: "Failed to find/create contact" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("responsavel_id", responsavel.id)
      .in("status", ["nao_lida", "aguardando", "em_atendimento"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from("conversations")
        .insert({
          responsavel_id: responsavel.id,
          status: "nao_lida",
          canal: "whatsapp",
          telefone: phone,
        })
        .select("id")
        .single();
      conversation = newConv;
    }

    if (!conversation) {
      return new Response(JSON.stringify({ error: "Failed to find/create conversation" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine message type
    let msgType = "text";
    let contentText = payload.text?.message || payload.text || null;
    let mediaUrl = null;
    let mediaMime = null;
    let mediaFilename = null;

    if (payload.image) {
      msgType = "image";
      mediaUrl = payload.image.imageUrl || payload.image.url || null;
      mediaMime = payload.image.mimetype || "image/jpeg";
      contentText = payload.image.caption || null;
    } else if (payload.audio) {
      msgType = "audio";
      mediaUrl = payload.audio.audioUrl || payload.audio.url || null;
      mediaMime = payload.audio.mimetype || "audio/ogg";
    } else if (payload.document) {
      msgType = "document";
      mediaUrl = payload.document.documentUrl || payload.document.url || null;
      mediaMime = payload.document.mimetype || "application/octet-stream";
      mediaFilename = payload.document.fileName || null;
    }

    if (typeof contentText === "object" && contentText !== null) {
      contentText = JSON.stringify(contentText);
    }

    // Insert message
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      direction: "inbound",
      sender_type: "responsavel",
      content_text: contentText,
      type: msgType,
      status: "delivered",
      sent_at: new Date().toISOString(),
      external_message_id: payload.messageId || null,
      media_url: mediaUrl,
      media_mime_type: mediaMime,
      media_filename: mediaFilename,
    });

    // Update conversation timestamp + status
    await supabase
      .from("conversations")
      .update({
        ultima_mensagem_em: new Date().toISOString(),
        status: "nao_lida",
      })
      .eq("id", conversation.id);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
