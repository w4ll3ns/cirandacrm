import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, Filter } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { TIPO_TAREFA_LABELS } from '@/types';
import type { StatusTarefa, PrioridadeTarefa } from '@/types';
import { toast } from 'sonner';

type FilterStatus = StatusTarefa | 'todas';

export default function Tasks() {
  const { usuario } = useAuth();
  const { tarefas, updateTarefa, responsaveis } = useData();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todas');

  const filtered = useMemo(() => {
    let list = tarefas.filter(t =>
      usuario?.perfil === 'admin' || t.responsavel_interno_id === usuario?.id
    );
    if (statusFilter !== 'todas') list = list.filter(t => t.status === statusFilter);
    return list.sort((a, b) => {
      const prioOrder = { alta: 0, media: 1, baixa: 2 };
      const statusOrder = { atrasada: 0, pendente: 1, concluida: 2 };
      return (statusOrder[a.status] - statusOrder[b.status]) || (prioOrder[a.prioridade] - prioOrder[b.prioridade]);
    });
  }, [tarefas, statusFilter, usuario]);

  const toggleDone = (id: string, currentStatus: StatusTarefa) => {
    const newStatus = currentStatus === 'concluida' ? 'pendente' : 'concluida';
    updateTarefa(id, { status: newStatus });
    toast.success(newStatus === 'concluida' ? 'Tarefa concluída ✓' : 'Tarefa reaberta');
  };

  const prioColor = (p: PrioridadeTarefa) => {
    if (p === 'alta') return 'bg-secondary/10 text-secondary';
    if (p === 'media') return 'bg-accent/20 text-accent-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'atrasada', label: 'Atrasadas' },
    { key: 'concluida', label: 'Concluídas' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1 bg-card border-b border-border">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma tarefa encontrada</p>
          </div>
        )}
        {filtered.map(t => {
          const resp = t.responsavel_id ? responsaveis.find(r => r.id === t.responsavel_id) : null;
          const isDone = t.status === 'concluida';
          const isLate = t.status === 'atrasada';

          return (
            <div
              key={t.id}
              className="px-4 py-3 border-b border-border flex items-start gap-3"
            >
              <button
                onClick={() => toggleDone(t.id, t.status)}
                className="mt-0.5 shrink-0"
              >
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : isLate ? (
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground/40" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prioColor(t.prioridade)}`}>
                    {t.prioridade === 'alta' ? 'Alta' : t.prioridade === 'media' ? 'Média' : 'Baixa'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{TIPO_TAREFA_LABELS[t.tipo]}</span>
                  {resp && <span className="text-[10px] text-muted-foreground">· {resp.nome.split(' ')[0]}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(t.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
