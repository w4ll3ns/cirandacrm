import { useState } from 'react';
import { ArrowUp, ArrowDown, Plus, Trash2, Trophy, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { usePipelineStages } from '@/hooks/usePipelineStages';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PipelineConfig() {
  const { allStages, refetch, loading } = usePipelineStages();
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const sorted = [...allStages].sort((a, b) => a.sort_order - b.sort_order);

  const updateStage = async (id: string, updates: Record<string, any>) => {
    setSaving(true);
    const { error } = await supabase.from('pipeline_stages').update(updates).eq('id', id);
    if (error) toast.error('Erro ao atualizar etapa');
    else await refetch();
    setSaving(false);
  };

  const swapOrder = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sorted.length) return;
    setSaving(true);
    const a = sorted[idx];
    const b = sorted[target];
    await Promise.all([
      supabase.from('pipeline_stages').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('pipeline_stages').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    await refetch();
    setSaving(false);
  };

  const addStage = async () => {
    if (!newKey.trim() || !newLabel.trim()) { toast.error('Preencha chave e nome'); return; }
    const slug = newKey.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setSaving(true);
    const maxOrder = sorted.length > 0 ? Math.max(...sorted.map(s => s.sort_order)) + 1 : 0;
    const { error } = await supabase.from('pipeline_stages').insert({ key: slug, label: newLabel.trim(), sort_order: maxOrder });
    if (error) toast.error(error.message.includes('duplicate') ? 'Chave já existe' : 'Erro ao adicionar');
    else { setNewKey(''); setNewLabel(''); await refetch(); toast.success('Etapa adicionada'); }
    setSaving(false);
  };

  const deleteStage = async (id: string, key: string) => {
    if (!confirm(`Excluir etapa "${key}"? Oportunidades nesta etapa não serão afetadas.`)) return;
    setSaving(true);
    const { error } = await supabase.from('pipeline_stages').delete().eq('id', id);
    if (error) toast.error('Erro ao excluir');
    else { await refetch(); toast.success('Etapa excluída'); }
    setSaving(false);
  };

  if (loading) return <div className="animate-pulse h-20 bg-muted rounded-lg" />;

  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Etapas do Pipeline</h3>

      <div className="space-y-2 mb-4">
        {sorted.map((stage, idx) => (
          <div key={stage.id} className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${stage.active ? 'bg-card border-border' : 'bg-muted/50 border-border/50 opacity-60'}`}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => swapOrder(idx, -1)} disabled={idx === 0 || saving} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button onClick={() => swapOrder(idx, 1)} disabled={idx === sorted.length - 1 || saving} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
            </div>

            <div className="flex-1 min-w-0">
              <input
                defaultValue={stage.label}
                onBlur={e => { if (e.target.value !== stage.label) updateStage(stage.id, { label: e.target.value }); }}
                className="text-sm font-medium bg-transparent border-0 focus:outline-none focus:ring-1 focus:ring-primary rounded px-1 w-full"
              />
              <p className="text-[10px] text-muted-foreground px-1">{stage.key}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => updateStage(stage.id, { is_final_win: !stage.is_final_win, is_final_loss: false })}
                className={`p-1 rounded ${stage.is_final_win ? 'text-success bg-success/10' : 'text-muted-foreground hover:text-success'}`}
                title="Marcar como ganho">
                <Trophy className="w-4 h-4" />
              </button>
              <button onClick={() => updateStage(stage.id, { is_final_loss: !stage.is_final_loss, is_final_win: false })}
                className={`p-1 rounded ${stage.is_final_loss ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-destructive'}`}
                title="Marcar como perdido">
                <XCircle className="w-4 h-4" />
              </button>
              <Switch checked={stage.active} onCheckedChange={v => updateStage(stage.id, { active: v })} />
              <button onClick={() => deleteStage(stage.id, stage.key)} className="p-1 text-muted-foreground hover:text-destructive" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground">Chave (slug)</label>
          <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="ex: entrevista" className="h-9 text-sm" />
        </div>
        <div className="flex-1">
          <label className="text-[10px] text-muted-foreground">Nome exibido</label>
          <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="ex: Entrevista" className="h-9 text-sm" />
        </div>
        <button onClick={addStage} disabled={saving} className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-semibold flex items-center gap-1 hover:opacity-90 disabled:opacity-50">
          <Plus className="w-4 h-4" /> Adicionar
        </button>
      </div>
    </div>
  );
}
