import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Eye, Clock, AlertTriangle, Trophy, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ETAPA_LABELS, TIPO_TAREFA_LABELS } from '@/types';

type Periodo = 'hoje' | '7dias' | 'mes';

export default function Home() {
  const { usuario } = useAuth();
  const { oportunidades, tarefas, conversas } = useData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [periodo, setPeriodo] = useState<Periodo>('hoje');

  const isOwn = (internoId: string) => usuario?.perfil === 'admin' || internoId === usuario?.id;

  const kpis = useMemo(() => {
    const now = new Date();
    const filterDate = (dateStr: string) => {
      const dt = new Date(dateStr);
      if (periodo === 'hoje') return dt.toDateString() === now.toDateString();
      if (periodo === '7dias') return (now.getTime() - dt.getTime()) <= 7 * 86400000;
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    };

    const myOpps = oportunidades.filter(o => isOwn(o.responsavel_interno_id));
    const myTasks = tarefas.filter(t => isOwn(t.responsavel_interno_id));

    return {
      novosLeads: myOpps.filter(o => o.etapa === 'novo_lead' && filterDate(o.criado_em)).length,
      emContato: myOpps.filter(o => o.etapa === 'primeiro_contato').length,
      visitasAgendadas: myOpps.filter(o => o.etapa === 'visita_agendada').length,
      followupsAtrasados: myTasks.filter(t => t.status === 'atrasada').length,
      matriculasMes: myOpps.filter(o => o.etapa === 'matricula_fechada' && filterDate(o.atualizado_em)).length,
      naoLidas: conversas.filter(c => c.status === 'nao_lida' && isOwn(c.responsavel_interno_id)).length,
    };
  }, [periodo, oportunidades, tarefas, conversas, usuario]);

  const tarefasPrioritarias = useMemo(() => {
    return tarefas
      .filter(t => isOwn(t.responsavel_interno_id) && t.status !== 'concluida')
      .sort((a, b) => {
        const prioOrder = { alta: 0, media: 1, baixa: 2 };
        return prioOrder[a.prioridade] - prioOrder[b.prioridade];
      })
      .slice(0, isMobile ? 5 : 8);
  }, [tarefas, usuario, isMobile]);

  const kpiCards = [
    { label: 'Novos Leads', value: kpis.novosLeads, icon: Users, color: 'text-primary' },
    { label: 'Visitas Agendadas', value: kpis.visitasAgendadas, icon: Eye, color: 'text-primary' },
    { label: 'Follow-ups Atrasados', value: kpis.followupsAtrasados, icon: AlertTriangle, color: 'text-secondary' },
    { label: 'Matrículas no Mês', value: kpis.matriculasMes, icon: Trophy, color: 'text-success' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto">
      {/* Period filter */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {([['hoje', 'Hoje'], ['7dias', '7 dias'], ['mes', 'Mês']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setPeriodo(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                periodo === key ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {!isMobile && (
          <button
            onClick={() => navigate('/app/pipeline')}
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Novo Lead
          </button>
        )}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {kpiCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl p-4 md:p-5 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} />
              <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl md:text-3xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Desktop: 2-column layout for unread + tasks */}
      <div className={`${isMobile ? 'space-y-5' : 'grid grid-cols-3 gap-6'}`}>
        {/* Main column */}
        <div className={`${isMobile ? '' : 'col-span-2'} space-y-5`}>
          {/* Unread conversations */}
          {kpis.naoLidas > 0 && (
            <button
              onClick={() => navigate('/app/conversas')}
              className="w-full bg-secondary/10 border border-secondary/30 rounded-xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform hover:bg-secondary/15"
            >
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{kpis.naoLidas} conversa{kpis.naoLidas > 1 ? 's' : ''} não lida{kpis.naoLidas > 1 ? 's' : ''}</p>
                <p className="text-xs text-muted-foreground">Clique para ver</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Tasks column */}
        <div className={isMobile ? '' : ''}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm md:text-base">Tarefas Prioritárias</h2>
            <button onClick={() => navigate('/app/tarefas')} className="text-primary text-xs font-medium">Ver todas</button>
          </div>
          <div className="space-y-2">
            {tarefasPrioritarias.map(t => (
              <div
                key={t.id}
                className="bg-card rounded-xl p-3 border border-border flex items-center gap-3"
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  t.prioridade === 'alta' ? 'bg-secondary' : t.prioridade === 'media' ? 'bg-accent' : 'bg-muted-foreground/30'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.titulo}</p>
                  <p className="text-xs text-muted-foreground">{TIPO_TAREFA_LABELS[t.tipo]}</p>
                </div>
                {t.status === 'atrasada' && (
                  <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">Atrasada</span>
                )}
              </div>
            ))}
            {tarefasPrioritarias.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhuma tarefa pendente 🎉</p>
            )}
          </div>
        </div>
      </div>

      {/* FAB - mobile only */}
      {isMobile && (
        <button
          onClick={() => navigate('/app/pipeline')}
          className="fixed bottom-20 right-4 w-14 h-14 bg-secondary text-secondary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
