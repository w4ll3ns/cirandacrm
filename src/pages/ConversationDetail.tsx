import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, CheckCircle2, Link2, ListTodo, ChevronDown, ChevronUp, ArrowRightLeft } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { usuarios } from '@/data/mock';
import NewTaskForm from '@/components/NewTaskForm';
import { ETAPA_LABELS } from '@/types';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  embeddedId?: string;
}

export default function ConversationDetail({ embeddedId }: Props) {
  const { id: paramId } = useParams();
  const id = embeddedId || paramId;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isEmbedded = !!embeddedId;
  const { usuario } = useAuth();
  const { conversas, mensagens, responsaveis, oportunidades, addMensagem, updateConversa } = useData();
  const [texto, setTexto] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLinkOpp, setShowLinkOpp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferMotivo, setTransferMotivo] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conv = conversas.find(c => c.id === id);
  const resp = conv ? responsaveis.find(r => r.id === conv.responsavel_id) : null;
  const msgs = mensagens.filter(m => m.conversa_id === id).sort(
    (a, b) => new Date(a.enviada_em).getTime() - new Date(b.enviada_em).getTime()
  );

  // Opportunities related to this contact
  const relOpps = resp ? oportunidades.filter(o => o.responsavel_id === resp.id) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  useEffect(() => {
    setTexto('');
    setShowActions(false);
  }, [id]);

  if (!conv) return <div className="p-4 text-muted-foreground text-center">Conversa não encontrada</div>;

  const handleSend = () => {
    if (!texto.trim()) return;
    // Track attendant change
    const hist = conv.historico_atendentes || [];
    const lastAtendente = hist[hist.length - 1];
    if (usuario && (!lastAtendente || lastAtendente.usuario_id !== usuario.id)) {
      const now = new Date().toISOString();
      const updatedHist = lastAtendente
        ? [...hist.slice(0, -1), { ...lastAtendente, fim_em: now }, { usuario_id: usuario.id, inicio_em: now }]
        : [...hist, { usuario_id: usuario.id, inicio_em: now }];
      updateConversa(conv.id, { historico_atendentes: updatedHist, responsavel_interno_id: usuario.id });
    }
    addMensagem({
      id: `msg_new_${Date.now()}`,
      conversa_id: conv.id,
      direcao: 'outbound',
      texto: texto.trim(),
      enviada_em: new Date().toISOString(),
      lida: true,
      criado_em: new Date().toISOString(),
    });
    setTexto('');
    toast.success('Mensagem enviada');
  };

  const markResolved = () => {
    updateConversa(conv.id, { status: 'resolvida' });
    toast.success('Conversa marcada como resolvida');
    setShowActions(false);
  };

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-screen'} bg-muted`}>
      {/* Header */}
      <div className={`${isEmbedded ? 'bg-card border-b border-border' : 'bg-primary text-primary-foreground'} px-3 py-3 flex items-center gap-3 shrink-0`}>
        {!isEmbedded && (
          <button onClick={() => navigate('/app/conversas')} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        )}
        <div className={`w-9 h-9 rounded-full ${isEmbedded ? 'bg-success/15' : 'bg-primary-foreground/15'} flex items-center justify-center text-xs font-bold shrink-0`}>
          {resp?.nome?.charAt(0) || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm truncate ${isEmbedded ? 'text-foreground' : ''}`}>{resp?.nome}</p>
          <p className={`text-[10px] ${isEmbedded ? 'text-muted-foreground' : 'opacity-80'}`}>WhatsApp · {resp?.whatsapp}</p>
        </div>
        <button onClick={() => setShowActions(!showActions)} className="p-1">
          <MoreVertical className={`w-5 h-5 ${isEmbedded ? 'text-muted-foreground' : ''}`} />
        </button>
      </div>

      {/* Actions dropdown */}
      {showActions && (
        <div className="bg-card border-b border-border px-4 py-2 flex gap-2 flex-wrap shrink-0">
          <button onClick={markResolved} className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Resolver
          </button>
          <button onClick={() => { setShowLinkOpp(true); setShowActions(false); }} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
            <Link2 className="w-3 h-3" /> Vincular Oportunidade
          </button>
          <button onClick={() => { setShowTaskForm(true); setShowActions(false); }} className="text-xs bg-secondary/10 text-secondary px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
            <ListTodo className="w-3 h-3" /> Criar Tarefa
          </button>
          <button onClick={() => { setShowTransfer(true); setShowActions(false); }} className="text-xs bg-accent text-accent-foreground px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
            <ArrowRightLeft className="w-3 h-3" /> Transferir
          </button>
        </div>
      )}

      {/* Attendant history */}
      {conv.historico_atendentes?.length > 0 && (
        <div className="bg-card border-b border-border px-4 py-2 shrink-0">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1 text-xs text-muted-foreground font-medium w-full">
            🎧 Histórico de atendentes ({conv.historico_atendentes.length})
            {showHistory ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
          </button>
          {showHistory && (
            <div className="mt-2 space-y-1">
              {conv.historico_atendentes.map((h, idx) => {
                const usr = usuarios.find(u => u.id === h.usuario_id);
                const isActive = !h.fim_em;
                return (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <Badge variant={isActive ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                      {usr?.nome.split(' ')[0] || h.usuario_id}
                    </Badge>
                    <span className="text-muted-foreground">
                      {new Date(h.inicio_em).toLocaleDateString('pt-BR')}
                      {h.fim_em ? ` → ${new Date(h.fim_em).toLocaleDateString('pt-BR')}` : ' (atual)'}
                    </span>
                    {h.motivo && <p className="text-[10px] text-muted-foreground italic ml-1">— {h.motivo}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {msgs.map(msg => {
          const isOut = msg.direcao === 'outbound';
          return (
            <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${isOut ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md'}`}>
                <p className="text-sm">{msg.texto}</p>
                <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : ''}`}>
                  <span className={`text-[10px] ${isOut ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.enviada_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isOut && msg.lida && <span className="text-[10px] text-primary-foreground/60">✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`bg-card border-t border-border px-3 py-2 flex items-end gap-2 shrink-0 ${!isEmbedded ? 'safe-bottom' : ''}`}>
        <input
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Digite uma mensagem..."
          className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button onClick={handleSend} disabled={!texto.trim()} className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform">
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Link opportunity modal */}
      {showLinkOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLinkOpp(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Oportunidades de {resp?.nome?.split(' ')[0]}</h3>
            {relOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma oportunidade encontrada para este contato</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {relOpps.map(o => (
                  <button key={o.id} onClick={() => { navigate(`/app/oportunidades/${o.id}`); setShowLinkOpp(false); }}
                    className="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-muted transition-colors">
                    <p className="font-medium">{ETAPA_LABELS[o.etapa]}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.criado_em).toLocaleDateString('pt-BR')}</p>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowLinkOpp(false)} className="w-full mt-3 py-2 text-sm text-muted-foreground font-medium">Fechar</button>
          </div>
        </div>
      )}

      {/* New task form */}
      <NewTaskForm open={showTaskForm} onClose={() => setShowTaskForm(false)} defaultResponsavelId={conv.responsavel_id} defaultOportunidadeId={relOpps[0]?.id} />
    </div>
  );
}
