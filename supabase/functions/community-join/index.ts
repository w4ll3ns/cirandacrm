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
    const { slug } = await req.json();
    if (!slug || typeof slug !== "string") {
      return new Response(JSON.stringify({ error: "Slug é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load active campaign
    const { data: campaign, error: campErr } = await supabase
      .from("community_campaigns")
      .select("*")
      .eq("slug", slug)
      .eq("ativa", true)
      .maybeSingle();

    if (campErr || !campaign) {
      return new Response(JSON.stringify({ error: "Campanha não encontrada ou inativa" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load groups ordered by sort_order
    const { data: groups, error: grpErr } = await supabase
      .from("campaign_groups")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("sort_order", { ascending: true });

    if (grpErr || !groups || groups.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum grupo configurado nesta campanha" }), {
        status: 404,
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
      return new Response(JSON.stringify({ error: "Nenhuma instância Z-API ativa" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const clientToken = instance.client_token;

    // Check each group for available spots
    for (const group of groups) {
      try {
        const metaRes = await fetch(
          `${baseUrl}/communities-metadata/${group.community_id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );

        if (!metaRes.ok) continue;

        const meta = await metaRes.json();
        const subGroups = meta.subGroups || [];

        // Find the matching subgroup by phone
        const targetSub = subGroups.find(
          (sg: { phone: string }) => sg.phone === group.group_phone
        );

        if (!targetSub) continue;

        // Get participant count for this subgroup
        const groupInfoRes = await fetch(
          `${baseUrl}/group-metadata/${targetSub.phone}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );

        if (!groupInfoRes.ok) continue;

        const groupInfo = await groupInfoRes.json();
        const currentParticipants = groupInfo.participants?.length || 0;

        if (currentParticipants < group.max_participants) {
          // Has space! Get invitation link
          const inviteLink = groupInfo.invitationLink || meta.invitationLink;

          if (inviteLink) {
            return new Response(
              JSON.stringify({
                success: true,
                invitationLink: inviteLink,
                groupName: group.group_name,
                currentParticipants,
                maxParticipants: group.max_participants,
              }),
              {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      } catch {
        // Skip this group and try next
        continue;
      }
    }

    // No group with available spots
    return new Response(
      JSON.stringify({ error: "Todos os grupos estão lotados no momento. Tente novamente mais tarde." }),
      {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Erro interno" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
