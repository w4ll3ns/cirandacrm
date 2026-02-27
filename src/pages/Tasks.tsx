import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, AlertTriangle, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { TIPO_TAREFA_LABELS } from '@/types';
import type { StatusTarefa, PrioridadeTarefa } from '@/types';
import { toast } from 'sonner';
import NewTaskForm from '@/components/NewTaskForm';

type FilterStatus = StatusTarefa | 'todas';

export default function Tasks() {
  const { usuario } = useAuth();
  const { tarefas, updateTarefa, responsaveis } = useData();
  const isMobile = useIsMobile();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('todas');
  const [showNewTask, setShowNewTask] = useState(false);

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

  const prioLabel = (p: PrioridadeTarefa) => p === 'alta' ? 'Alta' : p === 'media' ? 'Média' : 'Baixa';

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'todas', label: 'Todas' },
    { key: 'pendente', label: 'Pendentes' },
    { key: 'atrasada', label: 'Atrasadas' },
    { key: 'concluida', label: 'Concluídas' },
  ];

  const statusIcon = (s: StatusTarefa) => {
    if (s === 'concluida') return <CheckCircle2 className="w-5 h-5 text-success" />;
    if (s === 'atrasada') return <AlertTriangle className="w-5 h-5 text-destructive" />;
    return <Circle className="w-5 h-5 text-muted-foreground/40" />;
  };

  // Desktop table view
  if (!isMobile) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold">Tarefas</h1>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
              {filters.map(({ key, label }) => (
                <button key={key} onClick={() => setStatusFilter(key)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${statusFilter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => setShowNewTask(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90">
              <Plus className="w-4 h-4" /> Nova Tarefa
            </button>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="w-12 px-4 py-3"></th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Título</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Tipo</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Prioridade</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Responsável</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">Nenhuma tarefa encontrada</td></tr>
              )}
              {filtered.map(t => {
                const resp = t.responsavel_id ? responsaveis.find(r => r.id === t.responsavel_id) : null;
                const isDone = t.status === 'concluida';
                return (
                  <tr key={t.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3"><button onClick={() => toggleDone(t.id, t.status)}>{statusIcon(t.status)}</button></td>
                    <td className={`px-4 py-3 text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{TIPO_TAREFA_LABELS[t.tipo]}</td>
                    <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prioColor(t.prioridade)}`}>{prioLabel(t.prioridade)}</span></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{resp?.nome?.split(' ')[0] || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(t.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-3">
                      {t.status === 'atrasada' && <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Atrasada</span>}
                      {t.status === 'concluida' && <span className="text-[10px] bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">Concluída</span>}
                      {t.status === 'pendente' && <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-medium">Pendente</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <NewTaskForm open={showNewTask} onClose={() => setShowNewTask(false)} />
      </div>
    );
  }

  // Mobile list
  return (
    <div className="flex flex-col h-full">
      <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1 bg-card border-b border-border">
        {filters.map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {label}
          </button>
        ))}
      </div>
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
          return (
            <div key={t.id} className="px-4 py-3 border-b border-border flex items-start gap-3">
              <button onClick={() => toggleDone(t.id, t.status)} className="mt-0.5 shrink-0">{statusIcon(t.status)}</button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${prioColor(t.prioridade)}`}>{prioLabel(t.prioridade)}</span>
                  <span className="text-[10px] text-muted-foreground">{TIPO_TAREFA_LABELS[t.tipo]}</span>
                  {resp && <span className="text-[10px] text-muted-foreground">· {resp.nome.split(' ')[0]}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(t.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => setShowNewTask(true)} className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30">
        <Plus className="w-6 h-6" />
      </button>
      <NewTaskForm open={showNewTask} onClose={() => setShowNewTask(false)} />
    </div>
  );
}
