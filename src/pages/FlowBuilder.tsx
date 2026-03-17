import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ReactFlow, Controls, MiniMap, Background, BackgroundVariant,
  useNodesState, useEdgesState, addEdge, type Connection, type Edge, type Node,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { flowNodeTypes, nodeLabels } from '@/components/flow/FlowNodeTypes';
import NodePalette from '@/components/flow/NodePalette';
import NodeProperties from '@/components/flow/NodeProperties';
import FlowToolbar from '@/components/flow/FlowToolbar';
import { useAuth } from '@/contexts/AuthContext';

function FlowBuilderInner() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  const [flowData, setFlowData] = useState<any>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load flow
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: flow } = await supabase.from('conversation_flows').select('*').eq('id', id).single();
      if (!flow) { toast.error('Fluxo não encontrado'); return; }
      setFlowData(flow);

      const { data: dbNodes } = await supabase.from('flow_nodes').select('*').eq('flow_id', id);
      const { data: dbEdges } = await supabase.from('flow_edges').select('*').eq('flow_id', id);

      const rfNodes: Node[] = (dbNodes || []).map((n: any) => ({
        id: n.id,
        type: 'flowNode',
        position: { x: n.position_x, y: n.position_y },
        data: { nodeType: n.type, label: n.title || nodeLabels[n.type] || n.type, config: n.config || {}, subtitle: '' },
      }));

      const rfEdges: Edge[] = (dbEdges || []).map((e: any) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        sourceHandle: e.source_handle || undefined,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
        data: { condition_type: e.condition_type, condition_value: e.condition_value },
      }));

      setNodes(rfNodes);
      setEdges(rfEdges);
      setLoading(false);
    };
    load();
  }, [id]);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'smoothstep', animated: true, style: { stroke: 'hsl(var(--primary))' } }, eds));
  }, [setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow-type');
    if (!type || !reactFlowInstance) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode: Node = {
      id: `temp_${Date.now()}`,
      type: 'flowNode',
      position,
      data: {
        nodeType: type,
        label: nodeLabels[type] || type,
        config: type === 'question_options' ? { options: [{ label: 'Opção 1', value: 'opcao_1' }] } : {},
        subtitle: '',
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [reactFlowInstance, setNodes]);

  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes((nds) => nds.map((n) => n.id === nodeId ? { ...n, data } : n));
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => prev ? { ...prev, data } : null);
    }
  }, [setNodes, selectedNode]);

  const save = async () => {
    if (!id || !flowData) return;
    setSaving(true);
    try {
      // Update flow metadata
      await supabase.from('conversation_flows').update({
        nome: flowData.nome,
        descricao: flowData.descricao,
        trigger_type: flowData.trigger_type,
        canal: flowData.canal,
        setor: flowData.setor,
        updated_by: user?.id,
      }).eq('id', id);

      // Delete old nodes and edges
      await supabase.from('flow_edges').delete().eq('flow_id', id);
      await supabase.from('flow_nodes').delete().eq('flow_id', id);

      // Insert nodes, mapping temp IDs to real ones
      const idMap: Record<string, string> = {};
      for (const node of nodes) {
        const { data: inserted } = await supabase.from('flow_nodes').insert({
          flow_id: id,
          type: (node.data as any).nodeType as any,
          title: (node.data as any).label || '',
          config: (node.data as any).config || {},
          position_x: node.position.x,
          position_y: node.position.y,
        }).select('id').single();
        if (inserted) idMap[node.id] = inserted.id;
      }

      // Insert edges
      for (const edge of edges) {
        const sourceId = idMap[edge.source] || edge.source;
        const targetId = idMap[edge.target] || edge.target;
        await supabase.from('flow_edges').insert({
          flow_id: id,
          source_node_id: sourceId,
          target_node_id: targetId,
          source_handle: edge.sourceHandle || null,
          condition_type: (edge.data as any)?.condition_type || null,
          condition_value: (edge.data as any)?.condition_value || null,
        });
      }

      // Reload to get real IDs
      const { data: dbNodes } = await supabase.from('flow_nodes').select('*').eq('flow_id', id);
      const { data: dbEdges } = await supabase.from('flow_edges').select('*').eq('flow_id', id);

      setNodes((dbNodes || []).map((n: any) => ({
        id: n.id,
        type: 'flowNode',
        position: { x: n.position_x, y: n.position_y },
        data: { nodeType: n.type, label: n.title || nodeLabels[n.type], config: n.config || {}, subtitle: '' },
      })));

      setEdges((dbEdges || []).map((e: any) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        sourceHandle: e.source_handle || undefined,
        type: 'smoothstep',
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
        data: { condition_type: e.condition_type, condition_value: e.condition_value },
      })));

      setSelectedNode(null);
      toast.success('Fluxo salvo!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar');
    }
    setSaving(false);
  };

  const publish = async () => {
    await save();
    if (!id) return;

    // Save version snapshot
    const { data: versions } = await supabase.from('flow_versions').select('version_number').eq('flow_id', id).order('version_number', { ascending: false }).limit(1);
    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    await supabase.from('flow_versions').insert({
      flow_id: id,
      version_number: nextVersion,
      snapshot: { nodes: nodes.map(n => ({ ...n })), edges: edges.map(e => ({ ...e })) } as any,
      created_by: user?.id,
    });

    await supabase.from('conversation_flows').update({
      status: 'active' as any,
      ativo: true,
      published_at: new Date().toISOString(),
    }).eq('id', id);

    setFlowData((prev: any) => ({ ...prev, status: 'active', ativo: true }));
    toast.success(`Fluxo publicado (v${nextVersion})!`);
  };

  const toggleActive = async () => {
    if (!id || !flowData) return;
    const newAtivo = !flowData.ativo;
    const newStatus = newAtivo ? 'active' : 'inactive';
    await supabase.from('conversation_flows').update({ ativo: newAtivo, status: newStatus as any }).eq('id', id);
    setFlowData((prev: any) => ({ ...prev, ativo: newAtivo, status: newStatus }));
    toast.success(newAtivo ? 'Fluxo ativado' : 'Fluxo desativado');
  };

  const duplicate = async () => {
    if (!id || !flowData) return;
    const { data: newFlow } = await supabase.from('conversation_flows').insert({
      nome: `${flowData.nome} (cópia)`,
      descricao: flowData.descricao,
      status: 'draft' as any,
      trigger_type: flowData.trigger_type,
    }).select('id').single();
    if (!newFlow) return;

    // Copy current canvas nodes/edges
    const idMap: Record<string, string> = {};
    for (const node of nodes) {
      const { data: n } = await supabase.from('flow_nodes').insert({
        flow_id: newFlow.id,
        type: (node.data as any).nodeType as any,
        title: (node.data as any).label || '',
        config: (node.data as any).config || {},
        position_x: node.position.x,
        position_y: node.position.y,
      }).select('id').single();
      if (n) idMap[node.id] = n.id;
    }
    for (const edge of edges) {
      const src = idMap[edge.source] || edge.source;
      const tgt = idMap[edge.target] || edge.target;
      await supabase.from('flow_edges').insert({
        flow_id: newFlow.id,
        source_node_id: src,
        target_node_id: tgt,
        source_handle: edge.sourceHandle || null,
      });
    }

    toast.success('Fluxo duplicado!');
  };

  const testFlow = () => {
    toast.info('Modo de teste: em desenvolvimento. Salve e ative o fluxo para testá-lo em uma conversa.');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -m-4 md:-m-6">
      <FlowToolbar
        name={flowData?.nome || ''}
        status={flowData?.status || 'draft'}
        ativo={flowData?.ativo || false}
        onNameChange={(name) => setFlowData((prev: any) => ({ ...prev, nome: name }))}
        onSave={save}
        onPublish={publish}
        onToggleActive={toggleActive}
        onDuplicate={duplicate}
        onTest={testFlow}
        saving={saving}
      />

      <div className="flex flex-1 overflow-hidden">
        <NodePalette />

        <div ref={reactFlowWrapper} className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onInit={setReactFlowInstance}
            nodeTypes={flowNodeTypes}
            fitView
            snapToGrid
            snapGrid={[16, 16]}
            deleteKeyCode={['Backspace', 'Delete']}
            className="bg-muted/30"
          >
            <Controls className="!bg-card !border-border !shadow-sm" />
            <MiniMap className="!bg-card !border-border" />
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--border))" />
          </ReactFlow>
        </div>

        {selectedNode && (
          <NodeProperties
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        )}
      </div>
    </div>
  );
}

export default function FlowBuilder() {
  return (
    <ReactFlowProvider>
      <FlowBuilderInner />
    </ReactFlowProvider>
  );
}
