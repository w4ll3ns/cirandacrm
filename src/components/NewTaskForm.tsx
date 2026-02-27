import { useState } from 'react';
import { X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { TIPO_TAREFA_LABELS } from '@/types';
import type { TipoTarefa, PrioridadeTarefa } from '@/types';
import { toast } from 'sonner';
import { usuarios } from '@/data/mock';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultOportunidadeId?: string;
  defaultResponsavelId?: string;
}

export default function NewTaskForm({ open, onClose, defaultOportunidadeId, defaultResponsavelId }: Props) {
  const { addTarefa, oportunidades, responsaveis } = useData();
  const { usuario } = useAuth();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoTarefa>('followup');
  const [prioridade, setPrioridade] = useState<PrioridadeTarefa>('media');
  const [dataHora, setDataHora] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [responsavelInternoId, setResponsavelInternoId] = useState(usuario?.id || 'usr_001');
  const [oportunidadeId, setOportunidadeId] = useState(defaultOportunidadeId || '');
  const [responsavelId, setResponsavelId] = useState(defaultResponsavelId || '');

  if (!open) return null;

  const handleSubmit = () => {
    if (!titulo.trim()) {
      toast.error('Informe o título da tarefa');
      return;
    }

    const now = new Date().toISOString();
    addTarefa({
      id: `tar_new_${Date.now()}`,
      titulo: titulo.trim(),
      tipo,
      prioridade,
      data_hora: new Date(dataHora).toISOString(),
      status: 'pendente',
      responsavel_interno_id: responsavelInternoId,
      responsavel_id: responsavelId || undefined,
      oportunidade_id: oportunidadeId || undefined,
      criado_em: now,
      atualizado_em: now,
    });

    toast.success('Tarefa criada com sucesso! ✓');
    setTitulo('');
    onClose();
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
              <select value={tipo} onChange={e => setTipo(e.target.value as TipoTarefa)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                {Object.entries(TIPO_TAREFA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Prioridade</label>
              <select value={prioridade} onChange={e => setPrioridade(e.target.value as PrioridadeTarefa)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Data e Hora</label>
            <input type="datetime-local" value={dataHora} onChange={e => setDataHora(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Responsável Interno</label>
            <select value={responsavelInternoId} onChange={e => setResponsavelInternoId(e.target.value)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
            </select>
          </div>

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
              {oportunidades.slice(0, 30).map(o => <option key={o.id} value={o.id}>{o.id}</option>)}
            </select>
          </div>

          <button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold active:scale-[0.98] transition-transform hover:opacity-90 mt-2">
            Criar Tarefa
          </button>
        </div>
      </div>
    </div>
  );
}
