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

    const body = await req.json();
    const { action, ...params } = body;

    let zapiResponse: Response;

    switch (action) {
      case "list": {
        const page = params.page || 1;
        const pageSize = params.pageSize || 20;
        zapiResponse = await fetch(
          `${baseUrl}/communities?page=${page}&pageSize=${pageSize}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );
        break;
      }

      case "create": {
        zapiResponse = await fetch(`${baseUrl}/communities`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(clientToken ? { "Client-Token": clientToken } : {}),
          },
          body: JSON.stringify({
            name: params.name,
            ...(params.description ? { description: params.description } : {}),
          }),
        });
        break;
      }

      case "metadata": {
        zapiResponse = await fetch(
          `${baseUrl}/communities-metadata/${params.communityId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );
        break;
      }

      case "add-participant": {
        zapiResponse = await fetch(`${baseUrl}/add-participant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(clientToken ? { "Client-Token": clientToken } : {}),
          },
          body: JSON.stringify({
            communityId: params.communityId,
            phones: params.phones,
            autoInvite: params.autoInvite ?? true,
          }),
        });
        break;
      }

      case "remove-participant": {
        zapiResponse = await fetch(`${baseUrl}/remove-participant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(clientToken ? { "Client-Token": clientToken } : {}),
          },
          body: JSON.stringify({
            communityId: params.communityId,
            phones: params.phones,
          }),
        });
        break;
      }

      case "group-metadata": {
        if (!params.groupPhone) {
          return new Response(JSON.stringify({ error: "groupPhone is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        zapiResponse = await fetch(`${baseUrl}/group-metadata/${params.groupPhone}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(clientToken ? { "Client-Token": clientToken } : {}),
          },
        });
        break;
      }

      case "deactivate": {
        zapiResponse = await fetch(
          `${baseUrl}/communities/${params.communityId}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );
        break;
      }

      case "invite-link": {
        // Use communities-metadata which returns invitationLink
        zapiResponse = await fetch(
          `${baseUrl}/communities-metadata/${params.communityId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );
        // Extract just the invite link from metadata
        const metaData = await zapiResponse.json();
        console.log(`Communities invite-link metadata response:`, JSON.stringify(metaData));
        return new Response(
          JSON.stringify({ invitationLink: metaData?.invitationLink || null }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      case "redefine-invite-link": {
        // Use the community's announcement group phone for redefine
        // First get metadata to find the announcement group
        const metaResp = await fetch(
          `${baseUrl}/communities-metadata/${params.communityId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );
        const metaInfo = await metaResp.json();
        const announcementGroup = metaInfo?.subGroups?.find((g: any) => g.isGroupAnnouncement);
        const groupPhone = announcementGroup?.phone || `${params.communityId}@g.us`;
        
        zapiResponse = await fetch(
          `${baseUrl}/redefine-invitation-link/${groupPhone}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );
        break;
      }

      case "sync-participants": {
        if (!params.communityId) {
          return new Response(JSON.stringify({ error: "communityId is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const communityName = params.communityName || "";

        // 1. Fetch all contacts from Z-API to build phone→name map
        const contactsMap = new Map<string, string>();
        let contactsPage = 1;
        const contactsPageSize = 500;
        while (true) {
          try {
            const cRes = await fetch(
              `${baseUrl}/contacts?page=${contactsPage}&pageSize=${contactsPageSize}`,
              {
                method: "GET",
                headers: {
                  "Content-Type": "application/json",
                  ...(clientToken ? { "Client-Token": clientToken } : {}),
                },
              }
            );
            if (!cRes.ok) break;
            const cData = await cRes.json();
            const items = Array.isArray(cData) ? cData : (cData.contacts || cData.data || []);
            if (items.length === 0) break;
            for (const c of items) {
              if (c.phone) {
                const cName = c.name || c.short || c.notify || null;
                if (cName) contactsMap.set(c.phone, cName);
              }
            }
            if (items.length < contactsPageSize) break;
            contactsPage++;
          } catch {
            break;
          }
        }
        console.log(`Contacts map built with ${contactsMap.size} entries`);

        // 2. Get community metadata to find subgroups
        const metaSyncRes = await fetch(
          `${baseUrl}/communities-metadata/${params.communityId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(clientToken ? { "Client-Token": clientToken } : {}),
            },
          }
        );

        if (!metaSyncRes.ok) {
          return new Response(JSON.stringify({ error: "Failed to fetch community metadata" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const metaSyncData = await metaSyncRes.json();
        const subGroupsList = metaSyncData.subGroups || [];

        let totalNew = 0;
        let totalExisting = 0;
        let totalErrors = 0;

        // 3. For each subgroup, fetch group-metadata (participants)
        for (const sg of subGroupsList) {
          try {
            const grpRes = await fetch(`${baseUrl}/group-metadata/${sg.phone}`, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                ...(clientToken ? { "Client-Token": clientToken } : {}),
              },
            });

            if (!grpRes.ok) {
              totalErrors++;
              continue;
            }

            const grpData = await grpRes.json();
            const participants = grpData.participants || [];

            if (participants.length === 0) continue;

            // 4. Upsert each participant, using contactsMap for names
            const rows = participants.map((p: { phone: string }) => ({
              phone: p.phone,
              name: contactsMap.get(p.phone) || null,
              community_id: params.communityId,
              community_name: communityName || metaSyncData.name || metaSyncData.communityName || null,
              group_phone: sg.phone,
              group_name: sg.name || null,
            }));

            const { data: upsertData, error: upsertErr } = await supabase
              .from("community_contacts")
              .upsert(rows, { onConflict: "phone,community_id,group_phone", ignoreDuplicates: false })
              .select("id");

            if (upsertErr) {
              console.error(`Upsert error for group ${sg.phone}:`, upsertErr);
              totalErrors++;
            } else {
              totalNew += upsertData?.length || 0;
            }
          } catch (err) {
            console.error(`Error syncing group ${sg.phone}:`, err);
            totalErrors++;
          }
        }

        return new Response(
          JSON.stringify({
            success: true,
            totalNew,
            totalExisting,
            totalErrors,
            subGroupsProcessed: subGroupsList.length,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const responseData = await zapiResponse.json();
    console.log(`Communities ${action} response:`, JSON.stringify(responseData));

    return new Response(JSON.stringify(responseData), {
      status: zapiResponse.ok ? 200 : zapiResponse.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Communities error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
