import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, ChevronRight, DollarSign, Clock } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ETAPA_LABELS, ETAPAS_ORDER, TEMPERATURA_LABELS, ORIGEM_LABELS, TIPO_TAREFA_LABELS } from '@/types';
import type { EtapaPipeline } from '@/types';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { oportunidades, responsaveis, alunos, tarefas, conversas, updateOportunidade } = useData();
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');

  const opp = oportunidades.find(o => o.id === id);

  const resp = opp ? responsaveis.find(r => r.id === opp.responsavel_id) : null;
  const aluno = opp ? alunos.find(a => a.id === opp.aluno_id) : null;
  const relTarefas = opp ? tarefas.filter(t => t.oportunidade_id === opp.id) : [];
  const relConversas = opp ? conversas.filter(c => c.responsavel_id === opp.responsavel_id) : [];

  const handleMove = (etapa: EtapaPipeline) => {
    if (!opp) return;
    if (etapa === 'matricula_fechada') {
      if (!confirm('Confirmar matrícula fechada?')) return;
      updateOportunidade(opp.id, { etapa, status: 'ganha' });
      toast.success('Matrícula fechada com sucesso! 🎉');
    } else if (etapa === 'perdido') {
      setShowLostDialog(true);
      setShowMoveSheet(false);
      return;
    } else {
      updateOportunidade(opp.id, { etapa });
      toast.success(`Movido para ${ETAPA_LABELS[etapa]}`);
    }
    setShowMoveSheet(false);
  };

  const handleLost = () => {
    if (!opp) return;
    updateOportunidade(opp.id, { etapa: 'perdido', status: 'perdida', motivo_perda: motivoPerda || 'Sem motivo informado' });
    toast.success('Oportunidade marcada como perdida');
    setShowLostDialog(false);
  };

  // Timeline events
  const timeline = useMemo(() => {
    if (!opp) return [];
    const events: { date: string; label: string; type: 'create' | 'move' | 'task' | 'conversation' }[] = [];
    events.push({ date: opp.criado_em, label: 'Oportunidade criada', type: 'create' });
    if (opp.atualizado_em !== opp.criado_em) {
      events.push({ date: opp.atualizado_em, label: `Movido para ${ETAPA_LABELS[opp.etapa]}`, type: 'move' });
    }
    relTarefas.forEach(t => {
      events.push({ date: t.criado_em, label: `Tarefa: ${t.titulo}`, type: 'task' });
    });
    relConversas.slice(0, 3).forEach(c => {
      events.push({ date: c.criado_em, label: 'Conversa WhatsApp iniciada', type: 'conversation' });
    });
    return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);
  }, [opp, relTarefas, relConversas]);

  const timelineColors = { create: 'bg-primary', move: 'bg-accent', task: 'bg-secondary', conversation: 'bg-success' };

  if (!opp) return <div className="p-4 text-center text-muted-foreground">Oportunidade não encontrada</div>;

  const mainContent = (
    <>
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Responsável</h3>
        <p className="font-semibold text-sm">{resp?.nome}</p>
        <p className="text-sm text-muted-foreground">📱 {resp?.whatsapp}</p>
        <p className="text-sm text-muted-foreground">Origem: {resp ? ORIGEM_LABELS[resp.origem] : '-'}</p>
        {aluno && <p className="text-sm text-muted-foreground mt-1">Série: {aluno.serie_turma_interesse}</p>}
      </div>

      {/* Value */}
      {opp.valor_estimado && (
        <div className="bg-success/10 rounded-xl p-4 border border-success/30 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-success" />
          <div>
            <p className="text-xs text-muted-foreground">Valor Estimado</p>
            <p className="text-lg font-bold text-success">R$ {opp.valor_estimado.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => toast.success('Abrindo WhatsApp...')} className="bg-success text-success-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:opacity-90">
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </button>
        <button onClick={() => setShowMoveSheet(true)} className="bg-secondary text-secondary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:opacity-90">
          <ChevronRight className="w-4 h-4" /> Mover Etapa
        </button>
      </div>

      {opp.notas && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Observações</h3>
          <p className="text-sm">{opp.notas}</p>
        </div>
      )}

      {opp.proximo_followup_em && (
        <div className="bg-accent/20 rounded-xl p-4 border border-accent/40">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-medium">Próximo follow-up: {new Date(opp.proximo_followup_em).toLocaleDateString('pt-BR')}</span>
          </div>
        </div>
      )}

      {opp.status === 'perdida' && (
        <div className="bg-destructive/10 rounded-xl p-4 border border-destructive/30">
          <h3 className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wider">Motivo da Perda</h3>
          <p className="text-sm">{opp.motivo_perda}</p>
        </div>
      )}
    </>
  );

  const sideContent = (
    <>
      {/* Timeline */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Histórico
        </h3>
        <div className="space-y-3">
          {timeline.map((ev, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2.5 h-2.5 rounded-full ${timelineColors[ev.type]} shrink-0 mt-1`} />
                {i < timeline.length - 1 && <div className="w-px flex-1 bg-border" />}
              </div>
              <div className="pb-3">
                <p className="text-sm">{ev.label}</p>
                <p className="text-[10px] text-muted-foreground">{new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Related tasks */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tarefas ({relTarefas.length})</h3>
        {relTarefas.slice(0, 5).map(t => (
          <div key={t.id} className="flex items-center gap-2 py-1.5 text-sm">
            <div className={`w-2 h-2 rounded-full ${t.status === 'concluida' ? 'bg-success' : t.status === 'atrasada' ? 'bg-destructive' : 'bg-accent'}`} />
            <span className="truncate">{t.titulo}</span>
          </div>
        ))}
        {relTarefas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa</p>}
      </div>

      {/* Related conversations */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Conversas ({relConversas.length})</h3>
        {relConversas.slice(0, 3).map(c => (
          <button key={c.id} onClick={() => navigate(`/app/conversas/${c.id}`)} className="w-full flex items-center gap-2 py-1.5 text-sm text-left hover:text-primary">
            <MessageCircle className="w-3.5 h-3.5 text-success shrink-0" />
            <span className="truncate">Conversa WhatsApp</span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">{new Date(c.ultima_mensagem_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
          </button>
        ))}
        {relConversas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conversa</p>}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted">
      {isMobile ? (
        <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{aluno?.nome}</p>
            <p className="text-xs opacity-80">{ETAPA_LABELS[opp.etapa]} · {TEMPERATURA_LABELS[opp.temperatura]}</p>
          </div>
        </div>
      ) : (
        <div className="px-6 pt-6 pb-2 max-w-5xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-card text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-lg font-bold">{aluno?.nome}</h1>
            <p className="text-sm text-muted-foreground">{ETAPA_LABELS[opp.etapa]} · {TEMPERATURA_LABELS[opp.temperatura]}</p>
          </div>
        </div>
      )}

      <div className={`p-4 space-y-4 ${!isMobile ? 'max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:space-y-0' : ''}`}>
        <div className="space-y-4">{mainContent}</div>
        <div className="space-y-4">{sideContent}</div>
      </div>

      {showMoveSheet && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowMoveSheet(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative w-full md:max-w-md bg-card rounded-t-2xl md:rounded-2xl p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Mover para</h3>
            <div className="space-y-1">
              {ETAPAS_ORDER.map(etapa => (
                <button key={etapa} onClick={() => handleMove(etapa)} disabled={etapa === opp.etapa}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${etapa === opp.etapa ? 'bg-primary/10 text-primary' : 'active:bg-muted hover:bg-muted'} ${etapa === 'matricula_fechada' ? 'text-success font-semibold' : ''} ${etapa === 'perdido' ? 'text-destructive' : ''}`}>
                  {ETAPA_LABELS[etapa]}{etapa === opp.etapa && ' (atual)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {showLostDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLostDialog(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Motivo da perda</h3>
            <textarea value={motivoPerda} onChange={e => setMotivoPerda(e.target.value)} placeholder="Por que a oportunidade foi perdida?" className="w-full bg-muted rounded-lg p-3 text-sm border-0 focus:ring-2 focus:ring-primary resize-none h-24" />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowLostDialog(false)} className="flex-1 py-2 text-sm font-medium text-muted-foreground">Cancelar</button>
              <button onClick={handleLost} className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
