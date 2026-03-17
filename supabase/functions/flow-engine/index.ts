import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FlowNode {
  id: string;
  flow_id: string;
  type: string;
  title: string;
  config: Record<string, any>;
  position_x: number;
  position_y: number;
}

interface FlowEdge {
  id: string;
  flow_id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string | null;
  condition_type: string | null;
  condition_value: string | null;
  priority_order: number;
}

interface FlowSession {
  id: string;
  conversation_id: string;
  flow_id: string;
  current_node_id: string | null;
  status: string;
  context: Record<string, any>;
  last_input: string | null;
}

function replaceVariables(text: string, ctx: Record<string, any>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] || `{{${key}}}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "Missing env" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { conversation_id, input_text, phone, external_message_id, mode = "live" } = await req.json();

    if (!conversation_id) {
      return new Response(JSON.stringify({ error: "Missing conversation_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check for existing active session
    let { data: session } = await supabase
      .from("conversation_flow_sessions")
      .select("*")
      .eq("conversation_id", conversation_id)
      .eq("status", "running")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If no session, try to find a matching flow to start
    if (!session) {
      // Get conversation details for matching
      const { data: conv } = await supabase
        .from("conversations")
        .select("*, responsaveis(nome, telefone)")
        .eq("id", conversation_id)
        .single();

      if (!conv) {
        return new Response(JSON.stringify({ processed: false, reason: "conversation_not_found" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find active flows matching criteria
      const query = supabase
        .from("conversation_flows")
        .select("*")
        .eq("ativo", true)
        .eq("status", "active");

      const { data: flows } = await query;
      if (!flows || flows.length === 0) {
        return new Response(JSON.stringify({ processed: false, reason: "no_active_flows" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Match flow by trigger
      let matchedFlow = null;
      for (const flow of flows) {
        const trigger = flow.trigger_type;
        const config = flow.trigger_config || {};

        // Canal filter
        if (flow.canal && flow.canal !== conv.canal) continue;
        // Setor filter
        if (flow.setor && flow.setor !== conv.setor) continue;

        if (trigger === "new_conversation") {
          matchedFlow = flow;
          break;
        } else if (trigger === "first_message") {
          matchedFlow = flow;
          break;
        } else if (trigger === "keyword" && input_text) {
          const keywords: string[] = config.keywords || [];
          if (keywords.some((k: string) => input_text.toLowerCase().includes(k.toLowerCase()))) {
            matchedFlow = flow;
            break;
          }
        } else if (trigger === "no_assignee" && !conv.assigned_user_id) {
          matchedFlow = flow;
          break;
        }
      }

      if (!matchedFlow) {
        return new Response(JSON.stringify({ processed: false, reason: "no_matching_flow" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Find start node
      const { data: startNode } = await supabase
        .from("flow_nodes")
        .select("*")
        .eq("flow_id", matchedFlow.id)
        .eq("type", "start")
        .limit(1)
        .maybeSingle();

      if (!startNode) {
        return new Response(JSON.stringify({ processed: false, reason: "no_start_node" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Create session
      const contactName = (conv.responsaveis as any)?.nome || "";
      const { data: newSession, error: sessErr } = await supabase
        .from("conversation_flow_sessions")
        .insert({
          conversation_id,
          flow_id: matchedFlow.id,
          current_node_id: startNode.id,
          status: "running",
          context: {
            nome_contato: contactName,
            telefone: phone || conv.telefone || "",
            setor: conv.setor || "",
            canal: conv.canal || "",
            variables: {},
          },
        })
        .select("*")
        .single();

      if (sessErr || !newSession) {
        console.error("Failed to create session:", sessErr);
        return new Response(JSON.stringify({ processed: false, reason: "session_create_failed" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      session = newSession;

      // Log session start
      await supabase.from("flow_execution_logs").insert({
        session_id: session.id,
        flow_id: matchedFlow.id,
        node_id: startNode.id,
        action: "session_started",
        payload: { trigger: matchedFlow.trigger_type },
      });
    }

    // Now process: advance from current node
    let currentNodeId = session.current_node_id;
    let ctx: Record<string, any> = session.context || {};
    let processedSteps = 0;
    const MAX_STEPS = 20; // Safety limit

    // If session is waiting for input, process the input first
    if (ctx._waiting_for_input && input_text) {
      const waitingNodeId = ctx._waiting_node_id;

      // Load the waiting node
      const { data: waitingNode } = await supabase
        .from("flow_nodes")
        .select("*")
        .eq("id", waitingNodeId)
        .single();

      if (waitingNode) {
        if (waitingNode.type === "question_options") {
          const options: any[] = waitingNode.config.options || [];
          const maxRetries = waitingNode.config.max_retries || 3;
          const retryCount = ctx._retry_count || 0;

          // Find matching option
          const inputLower = input_text.trim().toLowerCase();
          const matched = options.find((opt: any, idx: number) => {
            const num = String(idx + 1);
            return inputLower === num || inputLower === (opt.value || "").toLowerCase() || inputLower === (opt.label || "").toLowerCase();
          });

          if (matched) {
            ctx.variables = ctx.variables || {};
            ctx.variables[`option_${waitingNode.id}`] = matched.value || matched.label;
            delete ctx._waiting_for_input;
            delete ctx._waiting_node_id;
            delete ctx._retry_count;

            // Find edge for this option
            const { data: edges } = await supabase
              .from("flow_edges")
              .select("*")
              .eq("source_node_id", waitingNodeId)
              .eq("flow_id", session.flow_id)
              .order("priority_order");

            const matchedEdge = edges?.find(e => e.source_handle === (matched.value || matched.label)) || edges?.[0];
            currentNodeId = matchedEdge?.target_node_id || null;

            await supabase.from("flow_execution_logs").insert({
              session_id: session.id, flow_id: session.flow_id, node_id: waitingNodeId,
              action: "option_selected", payload: { input: input_text, selected: matched.value || matched.label },
            });
          } else if (retryCount >= maxRetries) {
            // Max retries, transfer to human
            delete ctx._waiting_for_input;
            delete ctx._waiting_node_id;
            await finishSession(supabase, session, "transferred", ctx);
            await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone,
              waitingNode.config.max_retries_message || "Vou transferir você para um atendente. Aguarde um momento.",
              mode
            );
            return new Response(JSON.stringify({ processed: true, action: "transferred_max_retries" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          } else {
            ctx._retry_count = retryCount + 1;
            await supabase.from("conversation_flow_sessions").update({ context: ctx }).eq("id", session.id);
            const errorMsg = waitingNode.config.invalid_message || "Opção inválida. Tente novamente.";
            await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, errorMsg, mode);
            return new Response(JSON.stringify({ processed: true, action: "retry_options" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        } else if (waitingNode.type === "capture_input") {
          const varName = waitingNode.config.variable_name || "input";
          const expectedType = waitingNode.config.expected_type || "text";
          let valid = true;

          // Basic validation
          if (expectedType === "email" && !input_text.includes("@")) valid = false;
          if (expectedType === "number" && isNaN(Number(input_text))) valid = false;
          if (expectedType === "cpf" && input_text.replace(/\D/g, "").length !== 11) valid = false;
          if (expectedType === "telefone" && input_text.replace(/\D/g, "").length < 10) valid = false;

          if (!valid) {
            const errorMsg = waitingNode.config.error_message || "Formato inválido. Tente novamente.";
            await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, errorMsg, mode);
            return new Response(JSON.stringify({ processed: true, action: "retry_capture" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          ctx.variables = ctx.variables || {};
          ctx.variables[varName] = input_text;
          delete ctx._waiting_for_input;
          delete ctx._waiting_node_id;

          // Follow default edge
          const { data: edges } = await supabase.from("flow_edges").select("*")
            .eq("source_node_id", waitingNodeId).eq("flow_id", session.flow_id).order("priority_order");
          currentNodeId = edges?.[0]?.target_node_id || null;

          await supabase.from("flow_execution_logs").insert({
            session_id: session.id, flow_id: session.flow_id, node_id: waitingNodeId,
            action: "input_captured", payload: { variable: varName, value: input_text },
          });
        }
      }
    } else if (ctx._waiting_for_input) {
      // Still waiting but no input, skip
      return new Response(JSON.stringify({ processed: true, action: "waiting_for_input" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } else {
      // Not waiting, advance from start node to first real node
      const { data: edges } = await supabase.from("flow_edges").select("*")
        .eq("source_node_id", currentNodeId).eq("flow_id", session.flow_id).order("priority_order");
      if (edges && edges.length > 0) {
        currentNodeId = edges[0].target_node_id;
      }
    }

    // Process nodes in sequence until we hit a wait or end
    while (currentNodeId && processedSteps < MAX_STEPS) {
      processedSteps++;

      const { data: node } = await supabase.from("flow_nodes").select("*").eq("id", currentNodeId).single();
      if (!node) break;

      await supabase.from("flow_execution_logs").insert({
        session_id: session.id, flow_id: session.flow_id, node_id: node.id,
        action: `execute_${node.type}`, payload: { step: processedSteps },
      });

      if (node.type === "send_message") {
        const text = replaceVariables(node.config.message || "", ctx);
        await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, text, mode);

        // Follow edge
        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");
        currentNodeId = edges?.[0]?.target_node_id || null;

      } else if (node.type === "question_options") {
        const options: any[] = node.config.options || [];
        let text = node.config.question || "";
        options.forEach((opt: any, i: number) => {
          text += `\n${i + 1}. ${opt.label}`;
        });
        text = replaceVariables(text, ctx);
        await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, text, mode);

        // Wait for input
        ctx._waiting_for_input = true;
        ctx._waiting_node_id = node.id;
        ctx._retry_count = 0;
        await supabase.from("conversation_flow_sessions").update({
          current_node_id: node.id,
          context: ctx,
        }).eq("id", session.id);

        return new Response(JSON.stringify({ processed: true, action: "waiting_option" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } else if (node.type === "capture_input") {
        const prompt = node.config.prompt || "Por favor, informe:";
        await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, replaceVariables(prompt, ctx), mode);

        ctx._waiting_for_input = true;
        ctx._waiting_node_id = node.id;
        await supabase.from("conversation_flow_sessions").update({
          current_node_id: node.id,
          context: ctx,
        }).eq("id", session.id);

        return new Response(JSON.stringify({ processed: true, action: "waiting_capture" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } else if (node.type === "condition") {
        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");

        let nextNodeId: string | null = null;
        const condVar = node.config.variable || "";
        const condValue = ctx.variables?.[condVar] || ctx[condVar] || "";

        for (const edge of (edges || [])) {
          if (!edge.condition_type || edge.condition_type === "default") {
            if (!nextNodeId) nextNodeId = edge.target_node_id; // fallback
            continue;
          }
          const cv = edge.condition_value || "";
          let match = false;
          switch (edge.condition_type) {
            case "equals": match = String(condValue).toLowerCase() === cv.toLowerCase(); break;
            case "not_equals": match = String(condValue).toLowerCase() !== cv.toLowerCase(); break;
            case "contains": match = String(condValue).toLowerCase().includes(cv.toLowerCase()); break;
            case "empty": match = !condValue; break;
            case "not_empty": match = !!condValue; break;
            case "greater_than": match = Number(condValue) > Number(cv); break;
            case "less_than": match = Number(condValue) < Number(cv); break;
          }
          if (match) { nextNodeId = edge.target_node_id; break; }
        }
        currentNodeId = nextNodeId;

      } else if (node.type === "route_sector") {
        const sector = node.config.sector || "comercial";
        await supabase.from("conversations").update({ setor: sector }).eq("id", conversation_id);
        ctx.setor = sector;

        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");
        currentNodeId = edges?.[0]?.target_node_id || null;

      } else if (node.type === "assign_agent") {
        const agentId = node.config.agent_id || null;
        if (agentId) {
          await supabase.from("conversations").update({ assigned_user_id: agentId }).eq("id", conversation_id);
        }

        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");
        currentNodeId = edges?.[0]?.target_node_id || null;

      } else if (node.type === "transfer_human") {
        const msg = node.config.message || "Transferindo para um atendente. Aguarde um momento.";
        await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, replaceVariables(msg, ctx), mode);
        await supabase.from("conversations").update({ status: "aguardando" }).eq("id", conversation_id);
        await finishSession(supabase, session, "transferred", ctx);
        return new Response(JSON.stringify({ processed: true, action: "transferred" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      } else if (node.type === "update_field") {
        const field = node.config.field || "";
        const value = node.config.value || "";
        if (field && ["status", "setor"].includes(field)) {
          await supabase.from("conversations").update({ [field]: value }).eq("id", conversation_id);
        }

        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");
        currentNodeId = edges?.[0]?.target_node_id || null;

      } else if (node.type === "create_task") {
        await supabase.from("tasks").insert({
          titulo: replaceVariables(node.config.title || "Tarefa do fluxo", ctx),
          descricao: replaceVariables(node.config.description || "", ctx),
          prioridade: node.config.priority || "media",
          responsavel_interno_id: node.config.assignee_id || null,
          due_date: node.config.due_days ? new Date(Date.now() + Number(node.config.due_days) * 86400000).toISOString() : null,
        });

        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");
        currentNodeId = edges?.[0]?.target_node_id || null;

      } else if (node.type === "end") {
        const finalMsg = node.config.message;
        if (finalMsg) {
          await sendMessage(supabase, SUPABASE_URL, SERVICE_KEY, conversation_id, phone, replaceVariables(finalMsg, ctx), mode);
        }
        const closeConv = node.config.close_conversation !== false;
        if (closeConv) {
          await supabase.from("conversations").update({ status: "resolvida" }).eq("id", conversation_id);
        }
        await finishSession(supabase, session, "finished", ctx);
        return new Response(JSON.stringify({ processed: true, action: "finished" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } else {
        // Unknown node type, follow default edge
        const { data: edges } = await supabase.from("flow_edges").select("*")
          .eq("source_node_id", node.id).eq("flow_id", session.flow_id).order("priority_order");
        currentNodeId = edges?.[0]?.target_node_id || null;
      }
    }

    // If we ran out of nodes, finish session
    if (!currentNodeId) {
      await finishSession(supabase, session, "finished", ctx);
      return new Response(JSON.stringify({ processed: true, action: "finished_no_more_nodes" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Update session
    await supabase.from("conversation_flow_sessions").update({
      current_node_id: currentNodeId,
      context: ctx,
      last_input: input_text || null,
    }).eq("id", session.id);

    return new Response(JSON.stringify({ processed: true, action: "advanced", steps: processedSteps }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("Flow engine error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

async function finishSession(supabase: any, session: FlowSession, status: string, ctx: Record<string, any>) {
  await supabase.from("conversation_flow_sessions").update({
    status,
    context: ctx,
    finished_at: new Date().toISOString(),
  }).eq("id", session.id);

  await supabase.from("flow_execution_logs").insert({
    session_id: session.id,
    flow_id: session.flow_id,
    node_id: session.current_node_id,
    action: `session_${status}`,
    payload: {},
  });
}

async function sendMessage(
  supabase: any,
  _supabaseUrl: string,
  _serviceKey: string,
  conversationId: string,
  phone: string | undefined,
  text: string,
  mode: string
) {
  // Save message to DB
  const { data: msgData } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    direction: "outbound",
    sender_type: "sistema",
    content_text: text,
    type: "text",
    status: mode === "test" ? "sent" : "pending",
    sent_at: new Date().toISOString(),
  }).select("id").single();

  // In test mode, don't actually send via Z-API
  if (mode === "test") return;

  if (!phone) return;

  try {
    // Get active Z-API instance directly
    const { data: instance } = await supabase
      .from("zapi_instances")
      .select("*")
      .eq("connected", true)
      .limit(1)
      .maybeSingle();

    if (!instance || !instance.client_token) {
      console.log("Flow engine: No active Z-API instance or missing client_token");
      return;
    }

    const baseUrl = `https://api.z-api.io/instances/${instance.instance_id}/token/${instance.token}`;
    const zapiResponse = await fetch(`${baseUrl}/send-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Client-Token": instance.client_token,
      },
      body: JSON.stringify({ phone, message: text }),
    });

    const zapiData = await zapiResponse.json();
    console.log("Flow engine Z-API response:", JSON.stringify(zapiData));

    if (zapiResponse.ok && !zapiData.error && msgData?.id) {
      const externalId = zapiData.zapiMessageId || zapiData.messageId || null;
      await supabase.from("messages").update({
        status: "sent",
        external_message_id: externalId,
      }).eq("id", msgData.id);
    } else if (msgData?.id) {
      await supabase.from("messages").update({ status: "failed" }).eq("id", msgData.id);
    }
  } catch (e) {
    console.error("Flow engine Z-API send error:", e);
    if (msgData?.id) {
      await supabase.from("messages").update({ status: "failed" }).eq("id", msgData.id);
    }
  }
}
