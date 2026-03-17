import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, CheckCircle2, Link2, ListTodo, ArrowRightLeft, Clock, Check, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useProfiles } from '@/hooks/useProfiles';
import NewTaskForm from '@/components/NewTaskForm';
import { ETAPA_LABELS } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

function MessageStatusIcon({ status, onRetry, retrying }: { status: string; onRetry?: () => void; retrying?: boolean }) {
  if (retrying) return <Loader2 className="w-3 h-3 animate-spin text-primary-foreground/60" />;
  switch (status) {
    case 'pending': return <Clock className="w-3 h-3 text-primary-foreground/50" />;
    case 'sent': return <Check className="w-3 h-3 text-primary-foreground/60" />;
    case 'delivered': return <CheckCheck className="w-3 h-3 text-primary-foreground/60" />;
    case 'read': return <CheckCheck className="w-3 h-3 text-accent-foreground" />;
    case 'failed': return (
      <button onClick={onRetry} title="Reenviar" className="inline-flex items-center gap-0.5 text-destructive hover:text-destructive/80 transition-colors">
        <AlertCircle className="w-3 h-3" />
        <span className="text-[9px] font-medium">Reenviar</span>
      </button>
    );
    default: return <Clock className="w-3 h-3 text-primary-foreground/50" />;
  }
}

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
  const { profiles } = useProfiles();
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLinkOpp, setShowLinkOpp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferMotivo, setTransferMotivo] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conv = conversas.find(c => c.id === id);
  const resp = conv ? responsaveis.find(r => r.id === conv.responsavel_id) : null;
  const msgs = mensagens.filter(m => m.conversation_id === id).sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const relOpps = resp ? oportunidades.filter(o => o.responsavel_id === resp.id) : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  useEffect(() => {
    setTexto('');
    setShowActions(false);
  }, [id]);

  if (!conv) return <div className="p-4 text-muted-foreground text-center">Conversa não encontrada</div>;

  const handleSend = async () => {
    if (!texto.trim() || sending) return;
    setSending(true);
    try {
      const phone = resp?.whatsapp || resp?.telefone || conv.telefone;
      const { data, error } = await supabase.functions.invoke('zapi-send', {
        body: { conversation_id: conv.id, message: texto.trim(), phone },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setTexto('');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleRetry = async (msg: typeof msgs[0]) => {
    if (retryingId) return;
    setRetryingId(msg.id);
    try {
      const phone = resp?.whatsapp || resp?.telefone || conv.telefone;
      const { data, error } = await supabase.functions.invoke('zapi-send', {
        body: { conversation_id: conv.id, message: msg.content_text, phone, retry_message_id: msg.id },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao reenviar mensagem');
    } finally {
      setRetryingId(null);
    }
  };

  const markResolved = () => {
    updateConversa(conv.id, { status: 'resolvida' });
    toast.success('Conversa marcada como resolvida');
    setShowActions(false);
  };

  const handleTransfer = async () => {
    if (!transferTo) return;
    // Record assignment history
    await supabase.from('conversation_assignments_history').insert({
      conversation_id: conv.id,
      previous_user_id: conv.assigned_user_id,
      new_user_id: transferTo,
      changed_by: usuario?.id,
      motivo: transferMotivo || null,
    });
    await updateConversa(conv.id, { assigned_user_id: transferTo });
    toast.success('Conversa transferida com sucesso');
    setShowTransfer(false);
    setTransferTo('');
    setTransferMotivo('');
  };

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : 'h-[100dvh]'} bg-muted`}>
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
          <p className={`text-[10px] ${isEmbedded ? 'text-muted-foreground' : 'opacity-80'}`}>{conv.canal || 'WhatsApp'} · {resp?.whatsapp || resp?.telefone}</p>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {msgs.map(msg => {
          const isOut = msg.direction === 'outbound';
          return (
            <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${isOut ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md'}`}>
                <p className="text-sm">{msg.content_text}</p>
                <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : ''}`}>
                  <span className={`text-[10px] ${isOut ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                    {new Date(msg.sent_at || msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isOut && <MessageStatusIcon status={msg.status} onRetry={msg.status === 'failed' ? () => handleRetry(msg) : undefined} retrying={retryingId === msg.id} />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`bg-card border-t border-border px-3 py-2 flex items-end gap-2 shrink-0 ${!isEmbedded ? 'safe-bottom' : ''}`}>
        <input value={texto} onChange={e => setTexto(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Digite uma mensagem..." disabled={sending} className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
        <button onClick={handleSend} disabled={!texto.trim() || sending} className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Link opportunity modal */}
      {showLinkOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLinkOpp(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Oportunidades de {resp?.nome?.split(' ')[0]}</h3>
            {relOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma oportunidade encontrada</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {relOpps.map(o => (
                  <button key={o.id} onClick={() => { navigate(`/app/oportunidades/${o.id}`); setShowLinkOpp(false); }} className="w-full text-left px-4 py-3 rounded-lg text-sm hover:bg-muted transition-colors">
                    <p className="font-medium">{ETAPA_LABELS[o.etapa]}</p>
                    <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setShowLinkOpp(false)} className="w-full mt-3 py-2 text-sm text-muted-foreground font-medium">Fechar</button>
          </div>
        </div>
      )}

      {/* Transfer modal */}
      {showTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowTransfer(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Transferir conversa</h3>
            <label className="text-xs text-muted-foreground font-medium">Novo atendente</label>
            <select value={transferTo} onChange={e => setTransferTo(e.target.value)} className="w-full mt-1 mb-3 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Selecione...</option>
              {profiles.filter(u => u.active && u.id !== conv.assigned_user_id).map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground font-medium">Motivo (opcional)</label>
            <Textarea value={transferMotivo} onChange={e => setTransferMotivo(e.target.value)} placeholder="Ex: Lead precisa de atendimento especializado..." className="mt-1 mb-3 min-h-[60px]" />
            <div className="flex gap-2">
              <button onClick={() => { setShowTransfer(false); setTransferTo(''); setTransferMotivo(''); }} className="flex-1 py-2 text-sm text-muted-foreground font-medium rounded-lg">Cancelar</button>
              <button disabled={!transferTo} onClick={handleTransfer} className="flex-1 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50">
                Transferir
              </button>
            </div>
          </div>
        </div>
      )}

      <NewTaskForm open={showTaskForm} onClose={() => setShowTaskForm(false)} defaultResponsavelId={conv.responsavel_id} defaultOportunidadeId={relOpps[0]?.id} />
    </div>
  );
}
