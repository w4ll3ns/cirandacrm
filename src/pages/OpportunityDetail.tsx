import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Calendar, ChevronRight } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ETAPA_LABELS, ETAPAS_ORDER, TEMPERATURA_LABELS, ORIGEM_LABELS, TIPO_TAREFA_LABELS } from '@/types';
import type { EtapaPipeline } from '@/types';
import { toast } from 'sonner';
import { useState } from 'react';

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { oportunidades, responsaveis, alunos, tarefas, conversas, updateOportunidade } = useData();
  const [showMoveSheet, setShowMoveSheet] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [motivoPerda, setMotivoPerda] = useState('');

  const opp = oportunidades.find(o => o.id === id);
  if (!opp) return <div className="p-4 text-center text-muted-foreground">Oportunidade não encontrada</div>;

  const resp = responsaveis.find(r => r.id === opp.responsavel_id);
  const aluno = alunos.find(a => a.id === opp.aluno_id);
  const relTarefas = tarefas.filter(t => t.oportunidade_id === opp.id);
  const relConversas = conversas.filter(c => c.responsavel_id === opp.responsavel_id);

  const handleMove = (etapa: EtapaPipeline) => {
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
    updateOportunidade(opp.id, { etapa: 'perdido', status: 'perdida', motivo_perda: motivoPerda || 'Sem motivo informado' });
    toast.success('Oportunidade marcada como perdida');
    setShowLostDialog(false);
  };

  const mainContent = (
    <>
      {/* Responsável info */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Responsável</h3>
        <p className="font-semibold text-sm">{resp?.nome}</p>
        <p className="text-sm text-muted-foreground">📱 {resp?.whatsapp}</p>
        <p className="text-sm text-muted-foreground">Origem: {resp ? ORIGEM_LABELS[resp.origem] : '-'}</p>
        {aluno && <p className="text-sm text-muted-foreground mt-1">Série: {aluno.serie_turma_interesse}</p>}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => toast.success('Abrindo WhatsApp...')}
          className="bg-success text-success-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:opacity-90"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </button>
        <button
          onClick={() => setShowMoveSheet(true)}
          className="bg-secondary text-secondary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:opacity-90"
        >
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
          <button
            key={c.id}
            onClick={() => navigate(`/app/conversas/${c.id}`)}
            className="w-full flex items-center gap-2 py-1.5 text-sm text-left hover:text-primary"
          >
            <MessageCircle className="w-3.5 h-3.5 text-success shrink-0" />
            <span className="truncate">Conversa WhatsApp</span>
            <span className="text-xs text-muted-foreground ml-auto shrink-0">
              {new Date(c.ultima_mensagem_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </span>
          </button>
        ))}
        {relConversas.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conversa</p>}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
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

      {/* Move sheet */}
      {showMoveSheet && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center" onClick={() => setShowMoveSheet(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative w-full md:max-w-md bg-card rounded-t-2xl md:rounded-2xl p-4 max-h-[60vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Mover para</h3>
            <div className="space-y-1">
              {ETAPAS_ORDER.map(etapa => (
                <button
                  key={etapa}
                  onClick={() => handleMove(etapa)}
                  disabled={etapa === opp.etapa}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    etapa === opp.etapa ? 'bg-primary/10 text-primary' : 'active:bg-muted hover:bg-muted'
                  } ${etapa === 'matricula_fechada' ? 'text-success font-semibold' : ''} ${etapa === 'perdido' ? 'text-destructive' : ''}`}
                >
                  {ETAPA_LABELS[etapa]}
                  {etapa === opp.etapa && ' (atual)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lost dialog */}
      {showLostDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLostDialog(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Motivo da perda</h3>
            <textarea
              value={motivoPerda}
              onChange={e => setMotivoPerda(e.target.value)}
              placeholder="Por que a oportunidade foi perdida?"
              className="w-full bg-muted rounded-lg p-3 text-sm border-0 focus:ring-2 focus:ring-primary resize-none h-24"
            />
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
