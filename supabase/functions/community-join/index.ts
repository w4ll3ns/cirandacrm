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
    const zapiHeaders = {
      "Content-Type": "application/json",
      ...(clientToken ? { "Client-Token": clientToken } : {}),
    };

    // Check each group for available spots
    for (const group of groups) {
      try {
        const metaRes = await fetch(
          `${baseUrl}/communities-metadata/${group.community_id}`,
          { method: "GET", headers: zapiHeaders }
        );

        if (!metaRes.ok) continue;

        const meta = await metaRes.json();
        const subGroups = meta.subGroups || [];

        const targetSub = subGroups.find(
          (sg: { phone: string }) => sg.phone === group.group_phone
        );

        if (!targetSub) continue;

        const groupInfoRes = await fetch(
          `${baseUrl}/group-metadata/${targetSub.phone}`,
          { method: "GET", headers: zapiHeaders }
        );

        if (!groupInfoRes.ok) continue;

        const groupInfo = await groupInfoRes.json();
        const currentParticipants = groupInfo.participants?.length || 0;

        if (currentParticipants < group.max_participants) {
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
        continue;
      }
    }

    // All groups full — check auto_create_community flag
    if (campaign.auto_create_community) {
      try {
        // Extract sequential number from last community name
        const lastGroup = groups[groups.length - 1];
        const lastCommunityName = lastGroup.community_name;
        const seqMatch = lastCommunityName.match(/#(\d+)/);
        const lastSeq = seqMatch ? parseInt(seqMatch[1], 10) : 1;
        const nextSeq = lastSeq + 1;

        // Build new community name preserving the base pattern
        const baseName = lastCommunityName.replace(/#\d+/, "").trimEnd();
        const newCommunityName = `${baseName}#${nextSeq}`;

        console.log(`Auto-creating community: "${newCommunityName}" (seq ${nextSeq})`);

        // 1. Create community via Z-API
        const createRes = await fetch(`${baseUrl}/communities`, {
          method: "POST",
          headers: zapiHeaders,
          body: JSON.stringify({ name: newCommunityName }),
        });

        if (!createRes.ok) {
          const errBody = await createRes.text();
          console.error("Failed to create community:", errBody);
          throw new Error("Falha ao criar comunidade automaticamente");
        }

        const createData = await createRes.json();
        const newCommunityId = createData.id || createData.communityId;
        console.log(`Community created: ${newCommunityId}`, JSON.stringify(createData));

        // 2. Apply community settings (admins only can add groups)
        try {
          const settingsRes = await fetch(`${baseUrl}/communities/settings`, {
            method: "POST",
            headers: zapiHeaders,
            body: JSON.stringify({
              communityId: newCommunityId,
              whoCanAddNewGroups: "admins",
            }),
          });
          const settingsData = await settingsRes.json();
          console.log("Community settings applied:", JSON.stringify(settingsData));
        } catch (settErr) {
          console.error("Failed to apply community settings:", settErr);
          // Non-critical, continue
        }

        // 3. Wait a moment and fetch metadata to get subgroup and invite link
        await new Promise((r) => setTimeout(r, 2000));

        const metaRes = await fetch(
          `${baseUrl}/communities-metadata/${newCommunityId}`,
          { method: "GET", headers: zapiHeaders }
        );

        if (!metaRes.ok) {
          throw new Error("Falha ao buscar metadata da nova comunidade");
        }

        const metaData = await metaRes.json();
        console.log("New community metadata:", JSON.stringify(metaData));

        const subGroups = metaData.subGroups || [];
        const announcementGroup = subGroups.find((sg: { isGroupAnnouncement?: boolean }) => sg.isGroupAnnouncement);
        const targetSubGroup = announcementGroup || subGroups[0];

        if (!targetSubGroup) {
          throw new Error("Nenhum subgrupo encontrado na nova comunidade");
        }

        // 4. Insert new group into campaign_groups
        const maxSort = Math.max(...groups.map((g: { sort_order: number }) => g.sort_order), 0);
        const inheritedMax = groups[0].max_participants;

        const { error: insertErr } = await supabase.from("campaign_groups").insert({
          campaign_id: campaign.id,
          community_id: newCommunityId,
          community_name: newCommunityName,
          group_phone: targetSubGroup.phone,
          group_name: targetSubGroup.name || newCommunityName,
          max_participants: inheritedMax,
          sort_order: maxSort + 1,
        });

        if (insertErr) {
          console.error("Failed to insert campaign_group:", insertErr);
        }

        // 5. Get invite link
        const inviteLink = metaData.invitationLink || null;

        if (inviteLink) {
          return new Response(
            JSON.stringify({
              success: true,
              invitationLink: inviteLink,
              groupName: targetSubGroup.name || newCommunityName,
              currentParticipants: 0,
              maxParticipants: inheritedMax,
              autoCreated: true,
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // If no invite link yet, try group-metadata
        const grpMetaRes = await fetch(
          `${baseUrl}/group-metadata/${targetSubGroup.phone}`,
          { method: "GET", headers: zapiHeaders }
        );
        if (grpMetaRes.ok) {
          const grpMeta = await grpMetaRes.json();
          if (grpMeta.invitationLink) {
            return new Response(
              JSON.stringify({
                success: true,
                invitationLink: grpMeta.invitationLink,
                groupName: targetSubGroup.name || newCommunityName,
                currentParticipants: 0,
                maxParticipants: inheritedMax,
                autoCreated: true,
              }),
              {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }
      } catch (autoErr) {
        console.error("Auto-create community error:", autoErr);
        // Fall through to 409
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
