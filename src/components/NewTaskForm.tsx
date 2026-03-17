import { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TIPO_TAREFA_LABELS } from '@/types';
import type { TaskPriority } from '@/types';
import { toast } from 'sonner';
import { useProfiles } from '@/hooks/useProfiles';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultOportunidadeId?: string;
  defaultResponsavelId?: string;
}

export default function NewTaskForm({ open, onClose, defaultOportunidadeId, defaultResponsavelId }: Props) {
  const { addTarefa, oportunidades, responsaveis } = useData();
  const { usuario } = useAuth();
  const { profiles } = useProfiles();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('followup');
  const [prioridade, setPrioridade] = useState<TaskPriority>('media');
  const [dataHora, setDataHora] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const isAdmin = usuario?.perfil === 'admin';
  const [responsavelInternoId, setResponsavelInternoId] = useState(usuario?.id || '');
  const [oportunidadeId, setOportunidadeId] = useState(defaultOportunidadeId || '');
  const [responsavelId, setResponsavelId] = useState(defaultResponsavelId || '');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!titulo.trim()) {
      toast.error('Informe o título da tarefa');
      return;
    }

    setSubmitting(true);
    try {
      await addTarefa({
        titulo: titulo.trim(),
        tipo,
        prioridade,
        due_date: new Date(dataHora).toISOString(),
        responsavel_interno_id: responsavelInternoId || usuario?.id || null,
        responsavel_id: responsavelId || null,
        oportunidade_id: oportunidadeId || null,
      });

      toast.success('Tarefa criada com sucesso! ✓');
      setTitulo('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-foreground/40" />
      <div className="relative bg-card rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Nova Tarefa</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Título</label>
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Agendar visita com Ana" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(TIPO_TAREFA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</label>
              <select value={prioridade} onChange={e => setPrioridade(e.target.value as TaskPriority)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data e Hora</label>
            <input type="datetime-local" value={dataHora} onChange={e => setDataHora(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          {isAdmin && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável Interno</label>
              <select value={responsavelInternoId} onChange={e => setResponsavelInternoId(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {profiles.filter(p => p.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vincular Responsável (opcional)</label>
            <select value={responsavelId} onChange={e => setResponsavelId(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Nenhum</option>
              {responsaveis.slice(0, 30).map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vincular Oportunidade (opcional)</label>
            <select value={oportunidadeId} onChange={e => setOportunidadeId(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Nenhuma</option>
              {oportunidades.slice(0, 30).map(o => <option key={o.id} value={o.id}>{o.id.slice(0, 8)}</option>)}
            </select>
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform hover:opacity-90 mt-2 disabled:opacity-50">
            {submitting ? 'Criando...' : 'Criar Tarefa'}
          </button>
        </div>
      </div>
    </div>
  );
}
