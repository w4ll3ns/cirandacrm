import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ORIGEM_LABELS, ETAPA_LABELS } from '@/types';
import { toast } from 'sonner';

export default function ContactDetail() {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { responsaveis, alunos, oportunidades, conversas, tarefas } = useData();

  const headerClass = isMobile
    ? 'bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3'
    : 'px-6 pt-6 pb-2 max-w-5xl mx-auto flex items-center gap-3';

  const backBtn = isMobile
    ? <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
    : <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-card text-muted-foreground"><ArrowLeft className="w-5 h-5" /></button>;

  if (type === 'resp') {
    const resp = responsaveis.find(r => r.id === id);
    if (!resp) return <div className="p-4 text-muted-foreground text-center">Não encontrado</div>;

    const relAlunos = alunos.filter(a => a.responsavel_id === resp.id);
    const relOpps = oportunidades.filter(o => o.responsavel_id === resp.id);
    const relConvs = conversas.filter(c => c.responsavel_id === resp.id);

    return (
      <div className="min-h-screen bg-muted">
        <div className={headerClass}>
          {backBtn}
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${!isMobile ? 'text-lg text-foreground' : ''}`}>{resp.nome}</p>
            <p className={`text-xs ${isMobile ? 'opacity-80' : 'text-muted-foreground'}`}>Responsável</p>
          </div>
        </div>
        <div className={`p-4 space-y-4 ${!isMobile ? 'max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:space-y-0' : ''}`}>
          <div className="space-y-4">
            <div className="bg-card rounded-xl p-4 border border-border space-y-2">
              <p className="text-sm"><span className="text-muted-foreground">WhatsApp:</span> {resp.whatsapp}</p>
              {resp.email && <p className="text-sm"><span className="text-muted-foreground">E-mail:</span> {resp.email}</p>}
              <p className="text-sm"><span className="text-muted-foreground">Origem:</span> {ORIGEM_LABELS[resp.origem]}</p>
              {resp.tags.length > 0 && <div className="flex gap-1 flex-wrap">{resp.tags.map(t => <span key={t} className="bg-accent/20 text-accent-foreground text-[10px] px-2 py-0.5 rounded-full">{t}</span>)}</div>}
            </div>
            <button onClick={() => toast.success('Abrindo WhatsApp...')} className="w-full bg-success text-success-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-95 transition-transform hover:opacity-90">
              <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
            </button>
          </div>
          <div className="space-y-4">
            {relAlunos.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Alunos ({relAlunos.length})</h3>
                {relAlunos.map(a => (
                  <button key={a.id} onClick={() => navigate(`/app/contatos/aluno/${a.id}`)} className="w-full text-left py-2 text-sm flex items-center gap-2 hover:text-primary">
                    <span className="font-medium">{a.nome}</span>
                    <span className="text-xs text-muted-foreground">· {a.serie_turma_interesse}</span>
                  </button>
                ))}
              </div>
            )}
            {relOpps.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Oportunidades ({relOpps.length})</h3>
                {relOpps.map(o => (
                  <button key={o.id} onClick={() => navigate(`/app/oportunidades/${o.id}`)} className="w-full text-left py-2 text-sm flex items-center justify-between hover:text-primary">
                    <span>{ETAPA_LABELS[o.etapa]}</span>
                    <span className="text-xs text-muted-foreground">{new Date(o.criado_em).toLocaleDateString('pt-BR')}</span>
                  </button>
                ))}
              </div>
            )}
            {relConvs.length > 0 && (
              <div className="bg-card rounded-xl p-4 border border-border">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Conversas ({relConvs.length})</h3>
                {relConvs.map(c => (
                  <button key={c.id} onClick={() => navigate(`/app/conversas/${c.id}`)} className="w-full text-left py-2 text-sm flex items-center gap-2 hover:text-primary">
                    <MessageCircle className="w-3.5 h-3.5 text-success" />
                    <span>WhatsApp</span>
                    <span className="text-xs text-muted-foreground ml-auto">{new Date(c.ultima_mensagem_em).toLocaleDateString('pt-BR')}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Aluno detail
  const aluno = alunos.find(a => a.id === id);
  if (!aluno) return <div className="p-4 text-muted-foreground text-center">Não encontrado</div>;

  const resp = responsaveis.find(r => r.id === aluno.responsavel_id);
  const relTarefas = tarefas.filter(t => t.aluno_id === aluno.id);
  const age = Math.floor((Date.now() - new Date(aluno.data_nascimento).getTime()) / (365.25 * 86400000));
  const statusLabel: Record<string, string> = { interessado: 'Interessado', em_negociacao: 'Em negociação', matriculado: 'Matriculado', ex_aluno: 'Ex-aluno' };

  return (
    <div className="min-h-screen bg-muted">
      <div className={headerClass}>
        {backBtn}
        <div className="flex-1">
          <p className={`font-semibold ${!isMobile ? 'text-lg text-foreground' : ''}`}>{aluno.nome}</p>
          <p className={`text-xs ${isMobile ? 'opacity-80' : 'text-muted-foreground'}`}>Aluno · {aluno.serie_turma_interesse}</p>
        </div>
      </div>
      <div className={`p-4 space-y-4 ${!isMobile ? 'max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-6 md:space-y-0' : ''}`}>
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border space-y-2">
            <p className="text-sm"><span className="text-muted-foreground">Idade:</span> {age} anos</p>
            <p className="text-sm"><span className="text-muted-foreground">Nascimento:</span> {new Date(aluno.data_nascimento).toLocaleDateString('pt-BR')}</p>
            <p className="text-sm"><span className="text-muted-foreground">Série:</span> {aluno.serie_turma_interesse}</p>
            <p className="text-sm"><span className="text-muted-foreground">Status:</span> {statusLabel[aluno.status]}</p>
            {resp && (
              <button onClick={() => navigate(`/app/contatos/resp/${resp.id}`)} className="text-sm text-primary font-medium hover:underline">
                Responsável: {resp.nome}
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {relTarefas.length > 0 && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Tarefas ({relTarefas.length})</h3>
              {relTarefas.slice(0, 5).map(t => (
                <div key={t.id} className="py-1.5 text-sm flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${t.status === 'concluida' ? 'bg-success' : t.status === 'atrasada' ? 'bg-destructive' : 'bg-accent'}`} />
                  <span className="truncate">{t.titulo}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
