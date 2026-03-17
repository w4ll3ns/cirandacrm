import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Copy, Trash2, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Flow {
  id: string;
  nome: string;
  descricao: string | null;
  status: string;
  ativo: boolean;
  trigger_type: string;
  canal: string | null;
  setor: string | null;
  updated_at: string;
}

const statusBadge: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  draft: { label: 'Rascunho', variant: 'outline' },
  active: { label: 'Ativo', variant: 'default' },
  inactive: { label: 'Inativo', variant: 'secondary' },
};

const triggerLabels: Record<string, string> = {
  new_conversation: 'Nova conversa',
  first_message: 'Primeira mensagem',
  keyword: 'Palavra-chave',
  no_assignee: 'Sem atendente',
  business_hours: 'Horário comercial',
  specific_sector: 'Setor específico',
};

export default function FlowList() {
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchFlows = async () => {
    const { data } = await supabase.from('conversation_flows').select('*').order('updated_at', { ascending: false });
    setFlows((data || []) as Flow[]);
    setLoading(false);
  };

  useEffect(() => { fetchFlows(); }, []);

  const createFlow = async () => {
    const { data, error } = await supabase.from('conversation_flows').insert({
      nome: 'Novo Fluxo',
      status: 'draft' as any,
      trigger_type: 'new_conversation' as any,
    }).select('id').single();
    if (error) { toast.error('Erro ao criar fluxo'); return; }
    navigate(`/app/fluxos/${data.id}`);
  };

  const duplicateFlow = async (flow: Flow) => {
    const { data: newFlow, error } = await supabase.from('conversation_flows').insert({
      nome: `${flow.nome} (cópia)`,
      descricao: flow.descricao,
      status: 'draft' as any,
      trigger_type: flow.trigger_type as any,
      canal: flow.canal as any,
      setor: flow.setor as any,
    }).select('id').single();
    if (error) { toast.error('Erro ao duplicar'); return; }

    // Copy nodes
    const { data: nodes } = await supabase.from('flow_nodes').select('*').eq('flow_id', flow.id);
    if (nodes && nodes.length > 0) {
      const idMap: Record<string, string> = {};
      for (const node of nodes) {
        const { data: newNode } = await supabase.from('flow_nodes').insert({
          flow_id: newFlow.id,
          type: node.type,
          title: node.title,
          config: node.config,
          position_x: node.position_x,
          position_y: node.position_y,
        }).select('id').single();
        if (newNode) idMap[node.id] = newNode.id;
      }

      // Copy edges
      const { data: edges } = await supabase.from('flow_edges').select('*').eq('flow_id', flow.id);
      if (edges) {
        for (const edge of edges) {
          if (idMap[edge.source_node_id] && idMap[edge.target_node_id]) {
            await supabase.from('flow_edges').insert({
              flow_id: newFlow.id,
              source_node_id: idMap[edge.source_node_id],
              target_node_id: idMap[edge.target_node_id],
              source_handle: edge.source_handle,
              condition_type: edge.condition_type,
              condition_value: edge.condition_value,
              priority_order: edge.priority_order,
            });
          }
        }
      }
    }

    toast.success('Fluxo duplicado!');
    fetchFlows();
  };

  const toggleActive = async (flow: Flow) => {
    const newAtivo = !flow.ativo;
    const newStatus = newAtivo ? 'active' : 'inactive';
    await supabase.from('conversation_flows').update({ ativo: newAtivo, status: newStatus as any }).eq('id', flow.id);
    toast.success(newAtivo ? 'Fluxo ativado' : 'Fluxo desativado');
    fetchFlows();
  };

  const deleteFlow = async () => {
    if (!deleteId) return;
    await supabase.from('conversation_flows').delete().eq('id', deleteId);
    toast.success('Fluxo excluído');
    setDeleteId(null);
    fetchFlows();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Workflow className="w-5 h-5" />Fluxos de Conversa</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie fluxos automáticos de atendimento</p>
        </div>
        <Button onClick={createFlow} size="sm" className="gap-1"><Plus className="w-4 h-4" />Novo Fluxo</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : flows.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <Workflow className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Nenhum fluxo criado ainda</p>
          <Button onClick={createFlow} size="sm" variant="outline">Criar primeiro fluxo</Button>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Nome</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Gatilho</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Status</th>
                <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Ativo</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {flows.map(flow => {
                const si = statusBadge[flow.status] || statusBadge.draft;
                return (
                  <tr key={flow.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{flow.nome}</p>
                      {flow.descricao && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{flow.descricao}</p>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {triggerLabels[flow.trigger_type] || flow.trigger_type}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge variant={si.variant} className="text-[10px]">{si.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Switch checked={flow.ativo} onCheckedChange={() => toggleActive(flow)} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/app/fluxos/${flow.id}`)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateFlow(flow)}><Copy className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteId(flow.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir fluxo?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. Todos os nós, conexões e logs serão removidos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteFlow} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
