import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRICING = {
  computeMicroPerHour: 0.01307,
  edgeInvocationPerMillion: 2.0,
  storagePerGbMonth: 0.125,
  egressPerGb: 0.09,
};

const MONITORED_FUNCTIONS = [
  "zapi-webhook",
  "zapi-community-broadcast",
  "community-join",
  "ai-copy-generator",
  "broadcast-scheduler",
  "zapi-send",
  "flow-engine",
  "invite-member",
  "fetch-link-preview",
  "zapi-communities",
  "zapi-instance-manager",
  "admin-usage-metrics",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: isAdmin } = await admin.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

    // Webhook events 24h por tipo
    const { data: webhookRows } = await admin
      .from("webhook_events")
      .select("event_type, created_at")
      .gte("created_at", since24h)
      .limit(10000);

    const webhooks24h = webhookRows?.length ?? 0;

    // Buckets por hora (últimas 24h) baseado em webhook_events (proxy)
    const hourly: { hour: string; invocations: number }[] = [];
    const buckets = new Map<string, number>();
    for (let i = 23; i >= 0; i--) {
      const d = new Date(now - i * 3600 * 1000);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      buckets.set(key, 0);
    }
    (webhookRows ?? []).forEach((r: any) => {
      const d = new Date(r.created_at);
      d.setMinutes(0, 0, 0);
      const key = d.toISOString();
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    buckets.forEach((v, k) => hourly.push({ hour: k, invocations: v }));

    // Proxies de invocação por função (sem acesso direto a function_edge_logs)
    const { count: broadcastCount } = await admin
      .from("broadcast_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h);

    const { count: communityJoinCount } = await admin
      .from("community_contacts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since24h);

    const perFunction = MONITORED_FUNCTIONS.map((name) => {
      let invocations = 0;
      if (name === "zapi-webhook") invocations = webhooks24h;
      else if (name === "zapi-community-broadcast") invocations = broadcastCount ?? 0;
      else if (name === "community-join") invocations = communityJoinCount ?? 0;
      return {
        name,
        invocations,
        avgCpuMs: invocations > 0 ? (name === "zapi-webhook" ? 80 : 1200) : 0,
        totalCpuMs: invocations * (name === "zapi-webhook" ? 80 : 1200),
        errors: 0,
      };
    });

    const totalInvocations = perFunction.reduce((s, f) => s + f.invocations, 0);
    const totalCpuMs = perFunction.reduce((s, f) => s + f.totalCpuMs, 0);

    // DB size
    let dbSizeMb = 0;
    try {
      const { data: sizeData } = await admin.rpc("pg_database_size" as any, {}).single?.() ?? { data: null };
      if (sizeData) dbSizeMb = Number(sizeData) / 1024 / 1024;
    } catch (_) {
      // fallback: approximate
      dbSizeMb = 150;
    }

    // Storage estimate
    let storageMb = 0;
    try {
      const { data: objs } = await admin.schema("storage" as any).from("objects").select("metadata").limit(1000);
      if (objs) {
        storageMb = objs.reduce((s: number, o: any) => s + (Number(o.metadata?.size) || 0), 0) / 1024 / 1024;
      }
    } catch (_) {
      storageMb = 5;
    }

    // Costs
    const computeCost = 24 * PRICING.computeMicroPerHour;
    const invocationCost = (totalInvocations / 1_000_000) * PRICING.edgeInvocationPerMillion;
    const storageCost = (storageMb / 1024) * (PRICING.storagePerGbMonth / 30);
    const egressEstimateGb = (totalInvocations * 2) / 1_000_000; // ~2KB médio
    const egressCost = egressEstimateGb * PRICING.egressPerGb;
    const totalCost = computeCost + invocationCost + storageCost + egressCost;

    const result = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalCost,
        totalInvocations,
        totalCpuMs,
        dbSizeMb,
        webhooks24h,
        storageMb,
      },
      hourly,
      perFunction,
      costBreakdown: [
        { resource: "Compute DB (Micro)", qty: "24h", unit: `$${PRICING.computeMicroPerHour}/h`, subtotal: computeCost },
        { resource: "Edge invocations", qty: String(totalInvocations), unit: `$${PRICING.edgeInvocationPerMillion}/milhão`, subtotal: invocationCost },
        { resource: "Storage", qty: `${storageMb.toFixed(1)} MB`, unit: `$${PRICING.storagePerGbMonth}/GB/mês`, subtotal: storageCost },
        { resource: "Egress (estimado)", qty: `${(egressEstimateGb * 1024).toFixed(2)} MB`, unit: `$${PRICING.egressPerGb}/GB`, subtotal: egressCost },
      ],
      pricing: PRICING,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
