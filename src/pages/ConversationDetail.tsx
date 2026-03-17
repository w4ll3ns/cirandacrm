import { useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowLeft, Send, MoreVertical, CheckCircle2, Link2, ListTodo, ArrowRightLeft, Clock, Check, CheckCheck, AlertCircle, Loader2, ExternalLink, Unlink, Pencil, Paperclip, Smile, X, FileText, Download, Mic, Square, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { useProfiles } from '@/hooks/useProfiles';
import NewTaskForm from '@/components/NewTaskForm';
import { useInboundNotification } from '@/hooks/useInboundNotification';
import { ETAPA_LABELS, ETAPAS_ORDER } from '@/types';
import type { EtapaPipeline } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

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

function MediaRenderer({ msg }: { msg: any }) {
  const [expanded, setExpanded] = useState(false);
  
  if (msg.type === 'image' && msg.media_url) {
    return (
      <div className="mb-1">
        <img
          src={msg.media_url}
          alt={msg.media_filename || 'Imagem'}
          className="rounded-lg max-w-full max-h-60 cursor-pointer object-cover"
          onClick={() => setExpanded(true)}
          loading="lazy"
        />
        {msg.content_text && <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content_text}</p>}
        {expanded && (
          <div className="fixed inset-0 z-[60] bg-foreground/80 flex items-center justify-center p-4" onClick={() => setExpanded(false)}>
            <img src={msg.media_url} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
          </div>
        )}
      </div>
    );
  }

  if (msg.type === 'audio' && msg.media_url) {
    return (
      <div className="mb-1">
        <audio controls className="max-w-full" preload="metadata">
          <source src={msg.media_url} type={msg.media_mime_type || 'audio/mpeg'} />
        </audio>
      </div>
    );
  }

  if (msg.type === 'video' && msg.media_url) {
    return (
      <div className="mb-1">
        <video controls className="rounded-lg max-w-full max-h-60" preload="metadata">
          <source src={msg.media_url} type={msg.media_mime_type || 'video/mp4'} />
        </video>
        {msg.content_text && <p className="text-sm mt-1">{msg.content_text}</p>}
      </div>
    );
  }

  if (msg.type === 'document' && msg.media_url) {
    return (
      <div className="mb-1">
        <a href={msg.media_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-background/20 rounded-lg px-3 py-2 hover:bg-background/30 transition-colors">
          <FileText className="w-5 h-5 shrink-0" />
          <span className="text-sm truncate flex-1">{msg.media_filename || 'Documento'}</span>
          <Download className="w-4 h-4 shrink-0 opacity-60" />
        </a>
        {msg.content_text && <p className="text-sm mt-1 whitespace-pre-wrap">{msg.content_text}</p>}
      </div>
    );
  }

  // Fallback: text only
  if (msg.content_text) {
    return <p className="text-sm whitespace-pre-wrap">{msg.content_text}</p>;
  }

  return null;
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
  const { conversas, getMensagens, fetchMensagens, responsaveis, oportunidades, addMensagem, updateConversa, updateOportunidade, updateResponsavel } = useData();
  const [msgsLoading, setMsgsLoading] = useState(true);
  const { profiles } = useProfiles();
  const [texto, setTexto] = useState('');
  const [sending, setSending] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showLinkOpp, setShowLinkOpp] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showEditContact, setShowEditContact] = useState(false);
  const [editNome, setEditNome] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOrigem, setEditOrigem] = useState('');
  const [savingContact, setSavingContact] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferMotivo, setTransferMotivo] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingFilePreview, setPendingFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useInboundNotification(id || null);

  const conv = conversas.find(c => c.id === id);
  const resp = conv ? responsaveis.find(r => r.id === conv.responsavel_id) : null;
  const msgs = getMensagens(id || '');

  const relOpps = resp ? oportunidades.filter(o => o.responsavel_id === resp.id) : [];
  const linkedOpp = conv?.oportunidade_id ? oportunidades.find(o => o.id === conv.oportunidade_id) : null;

  useEffect(() => {
    if (!id) return;
    setMsgsLoading(true);
    fetchMensagens(id).finally(() => setMsgsLoading(false));
  }, [id, fetchMensagens]);

  useEffect(() => {
    if (conv && conv.status === 'nao_lida') {
      updateConversa(conv.id, { status: 'em_atendimento' });
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs.length]);

  useEffect(() => {
    setTexto('');
    setShowActions(false);
    clearPendingFile();
  }, [id]);

  const clearPendingFile = () => {
    setPendingFile(null);
    if (pendingFilePreview) URL.revokeObjectURL(pendingFilePreview);
    setPendingFilePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 16MB)');
      return;
    }
    setPendingFile(file);
    if (file.type.startsWith('image/')) {
      setPendingFilePreview(URL.createObjectURL(file));
    } else {
      setPendingFilePreview(null);
    }
    // Reset input so same file can be reselected
    e.target.value = '';
  };

  const getMediaType = (file: File): string => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  };

  const uploadAndSend = async (file: File) => {
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${conv!.id}/${Date.now()}.${ext}`;
    
    const { error: upErr } = await supabase.storage
      .from('chat-media')
      .upload(path, file, { contentType: file.type });
    if (upErr) throw new Error(`Upload falhou: ${upErr.message}`);

    const { data: urlData } = supabase.storage.from('chat-media').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleSend = async () => {
    if ((!texto.trim() && !pendingFile) || sending) return;
    setSending(true);
    setUploading(!!pendingFile);
    try {
      const phone = resp?.whatsapp || resp?.telefone || conv!.telefone;
      let mediaUrl: string | undefined;
      let type = 'text';
      let mediaFilename: string | undefined;
      let mediaMimeType: string | undefined;

      if (pendingFile) {
        mediaUrl = await uploadAndSend(pendingFile);
        type = getMediaType(pendingFile);
        mediaFilename = pendingFile.name;
        mediaMimeType = pendingFile.type;
      }

      const { data, error } = await supabase.functions.invoke('zapi-send', {
        body: {
          conversation_id: conv!.id,
          message: texto.trim() || undefined,
          phone,
          type,
          media_url: mediaUrl,
          media_filename: mediaFilename,
          media_mime_type: mediaMimeType,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setTexto('');
      clearPendingFile();
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar mensagem');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const handleRetry = async (msg: typeof msgs[0]) => {
    if (retryingId) return;
    setRetryingId(msg.id);
    try {
      const phone = resp?.whatsapp || resp?.telefone || conv!.telefone;
      const { data, error } = await supabase.functions.invoke('zapi-send', {
        body: {
          conversation_id: conv!.id,
          message: msg.content_text,
          phone,
          retry_message_id: msg.id,
          type: msg.type || 'text',
          media_url: msg.media_url,
          media_filename: msg.media_filename,
          media_mime_type: msg.media_mime_type,
        },
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

  const handleEmojiSelect = (emoji: any) => {
    setTexto(prev => prev + emoji.native);
    textInputRef.current?.focus();
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        if (audioChunksRef.current.length === 0) return;

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];
        await sendAudioBlob(blob, mimeType);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
    } catch {
      toast.error('Não foi possível acessar o microfone');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop(); // triggers onstop → sendAudioBlob
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) { clearInterval(recordingTimerRef.current); recordingTimerRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const sendAudioBlob = async (blob: Blob, mimeType: string) => {
    setSending(true);
    setUploading(true);
    try {
      const ext = mimeType.includes('webm') ? 'webm' : 'ogg';
      const filename = `audio_${Date.now()}.${ext}`;
      const file = new File([blob], filename, { type: mimeType });
      const publicUrl = await uploadAndSend(file);
      const phone = resp?.whatsapp || resp?.telefone || conv!.telefone;

      const { data, error } = await supabase.functions.invoke('zapi-send', {
        body: {
          conversation_id: conv!.id,
          phone,
          type: 'audio',
          media_url: publicUrl,
          media_filename: filename,
          media_mime_type: mimeType,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar áudio');
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  const finishFlowSessions = async (conversationId: string) => {
    await supabase
      .from('conversation_flow_sessions')
      .update({ status: 'finished' as any, finished_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('status', 'running');
  };

  const handleResolve = async () => {
    if (linkedOpp && linkedOpp.status === 'aberta') {
      setShowResolveModal(true);
    } else {
      await updateConversa(conv!.id, { status: 'resolvida' });
      await finishFlowSessions(conv!.id);
      toast.success('Conversa marcada como resolvida');
    }
    setShowActions(false);
  };

  const resolveOnly = async () => {
    await updateConversa(conv!.id, { status: 'resolvida' });
    await finishFlowSessions(conv!.id);
    toast.success('Conversa marcada como resolvida');
    setShowResolveModal(false);
  };

  const resolveAndAdvance = async () => {
    if (!linkedOpp) return;
    const currentIdx = ETAPAS_ORDER.indexOf(linkedOpp.etapa);
    const nextEtapa = currentIdx >= 0 && currentIdx < ETAPAS_ORDER.length - 2
      ? ETAPAS_ORDER[currentIdx + 1]
      : linkedOpp.etapa;

    if (nextEtapa !== linkedOpp.etapa) {
      await updateOportunidade(linkedOpp.id, { etapa: nextEtapa as any });
    }
    await updateConversa(conv!.id, { status: 'resolvida' });
    await finishFlowSessions(conv!.id);
    toast.success(`Conversa resolvida. Oportunidade avançada para "${ETAPA_LABELS[nextEtapa]}"`);
    setShowResolveModal(false);
  };

  const handleLinkOpp = async (oppId: string) => {
    await updateConversa(conv!.id, { oportunidade_id: oppId });
    toast.success('Oportunidade vinculada à conversa');
    setShowLinkOpp(false);
  };

  const handleUnlinkOpp = async () => {
    await updateConversa(conv!.id, { oportunidade_id: null });
    toast.success('Oportunidade desvinculada');
    setShowLinkOpp(false);
  };

  const handleTransfer = async () => {
    if (!transferTo) return;
    await supabase.from('conversation_assignments_history').insert({
      conversation_id: conv!.id,
      previous_user_id: conv!.assigned_user_id,
      new_user_id: transferTo,
      changed_by: usuario?.id,
      motivo: transferMotivo || null,
    });
    await updateConversa(conv!.id, { assigned_user_id: transferTo });
    toast.success('Conversa transferida com sucesso');
    setShowTransfer(false);
    setTransferTo('');
    setTransferMotivo('');
  };

  if (!conv) return <div className="p-4 text-muted-foreground text-center">Conversa não encontrada</div>;

  return (
    <div className={`flex flex-col ${isEmbedded ? 'h-full' : isMobile ? 'h-[100dvh]' : 'h-[calc(100vh-3.5rem)]'} bg-muted`}>
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
          <button onClick={handleResolve} className="text-xs bg-success/10 text-success px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
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
          <button onClick={() => {
            if (resp) { setEditNome(resp.nome); setEditWhatsapp(resp.whatsapp || resp.telefone); setEditEmail(resp.email || ''); setEditOrigem(resp.origem || ''); }
            setShowEditContact(true); setShowActions(false);
          }} className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
            <Pencil className="w-3 h-3" /> Editar Contato
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {msgsLoading && msgs.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : msgs.map(msg => {
          const isOut = msg.direction === 'outbound';
          const hasMedia = msg.type !== 'text' && msg.media_url;
          return (
            <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] md:max-w-[60%] rounded-2xl px-4 py-2.5 ${isOut ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border rounded-bl-md'}`}>
                {hasMedia ? (
                  <MediaRenderer msg={msg} />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content_text}</p>
                )}
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

      {/* File preview */}
      {pendingFile && (
        <div className="bg-card border-t border-border px-3 py-2 flex items-center gap-3 shrink-0">
          {pendingFilePreview ? (
            <img src={pendingFilePreview} alt="" className="w-16 h-16 rounded-lg object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{pendingFile.name}</p>
            <p className="text-xs text-muted-foreground">{(pendingFile.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={clearPendingFile} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className={`bg-card border-t border-border px-3 py-2 flex items-end gap-1.5 shrink-0 ${!isEmbedded ? 'safe-bottom' : ''}`}>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden"
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv" />

        {isRecording ? (
          <>
            <button onClick={cancelRecording} className="w-10 h-10 flex items-center justify-center shrink-0 text-destructive hover:text-destructive/80 transition-colors">
              <Trash2 className="w-5 h-5" />
            </button>
            <div className="flex-1 flex items-center gap-3 bg-muted rounded-full px-4 py-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive animate-pulse shrink-0" />
              <span className="text-sm font-medium text-foreground">{formatRecordingTime(recordingTime)}</span>
              <span className="text-xs text-muted-foreground">Gravando...</span>
            </div>
            <button onClick={stopRecording} className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 active:scale-95 transition-transform">
              <Send className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => fileInputRef.current?.click()} disabled={sending} className="w-10 h-10 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <Paperclip className="w-5 h-5" />
            </button>

            <Popover>
              <PopoverTrigger asChild>
                <button disabled={sending} className="w-10 h-10 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  <Smile className="w-5 h-5" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" side="top" align="start">
                <Picker data={data} onEmojiSelect={handleEmojiSelect} theme="light" locale="pt" previewPosition="none" skinTonePosition="none" />
              </PopoverContent>
            </Popover>

            <input
              ref={textInputRef}
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={pendingFile ? "Legenda (opcional)..." : "Digite uma mensagem..."}
              disabled={sending}
              className="flex-1 bg-muted rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />

            {texto.trim() || pendingFile ? (
              <button onClick={handleSend} disabled={(!texto.trim() && !pendingFile) || sending} className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            ) : (
              <button onClick={startRecording} disabled={sending} className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shrink-0 disabled:opacity-50 active:scale-95 transition-transform">
                <Mic className="w-4 h-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Link opportunity modal */}
      {showLinkOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowLinkOpp(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">Vincular Oportunidade</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {linkedOpp
                ? <>Vinculada: <span className="font-medium text-foreground">{ETAPA_LABELS[linkedOpp.etapa]}</span></>
                : 'Selecione uma oportunidade para vincular à conversa'}
            </p>

            {linkedOpp && (
              <button onClick={handleUnlinkOpp} className="w-full text-left px-4 py-2.5 rounded-lg text-sm bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors mb-2 flex items-center gap-2">
                <Unlink className="w-3.5 h-3.5" />
                Desvincular oportunidade atual
              </button>
            )}

            {relOpps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma oportunidade encontrada</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {relOpps.map(o => {
                  const isLinked = conv.oportunidade_id === o.id;
                  return (
                    <div key={o.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors ${isLinked ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'}`}>
                      <button onClick={() => !isLinked && handleLinkOpp(o.id)} className="flex-1 text-left" disabled={isLinked}>
                        <p className="font-medium">{ETAPA_LABELS[o.etapa]} {isLinked && <span className="text-xs text-primary">(vinculada)</span>}</p>
                        <p className="text-xs text-muted-foreground">{o.status} · {new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                      </button>
                      <button onClick={() => { navigate(`/app/oportunidades/${o.id}`); setShowLinkOpp(false); }} className="p-1.5 rounded-md hover:bg-muted-foreground/10 text-muted-foreground" title="Ver detalhes">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => setShowLinkOpp(false)} className="w-full mt-3 py-2 text-sm text-muted-foreground font-medium">Fechar</button>
          </div>
        </div>
      )}

      {/* Resolve with pipeline modal */}
      {showResolveModal && linkedOpp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowResolveModal(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">Resolver conversa</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Esta conversa está vinculada à oportunidade em <span className="font-medium text-foreground">{ETAPA_LABELS[linkedOpp.etapa]}</span>.
              Deseja avançar a etapa no pipeline?
            </p>
            {(() => {
              const currentIdx = ETAPAS_ORDER.indexOf(linkedOpp.etapa);
              const nextEtapa = currentIdx >= 0 && currentIdx < ETAPAS_ORDER.length - 2 ? ETAPAS_ORDER[currentIdx + 1] : null;
              return (
                <div className="space-y-2">
                  {nextEtapa && (
                    <button onClick={resolveAndAdvance} className="w-full py-2.5 text-sm bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      Resolver e avançar para "{ETAPA_LABELS[nextEtapa]}"
                    </button>
                  )}
                  <button onClick={resolveOnly} className="w-full py-2.5 text-sm bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition-colors">
                    Apenas resolver conversa
                  </button>
                  <button onClick={() => setShowResolveModal(false)} className="w-full py-2 text-sm text-muted-foreground font-medium">
                    Cancelar
                  </button>
                </div>
              );
            })()}
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

      <NewTaskForm open={showTaskForm} onClose={() => setShowTaskForm(false)} defaultResponsavelId={conv.responsavel_id} defaultOportunidadeId={conv.oportunidade_id || relOpps[0]?.id} />

      {/* Edit contact modal */}
      {showEditContact && resp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowEditContact(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-3">Editar Contato</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Nome</label>
                <input value={editNome} onChange={e => setEditNome(e.target.value)} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">WhatsApp</label>
                <input value={editWhatsapp} onChange={e => setEditWhatsapp(e.target.value)} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Email</label>
                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} type="email" className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">Origem</label>
                <select value={editOrigem} onChange={e => setEditOrigem(e.target.value)} className="w-full mt-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Selecione...</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="instagram">Instagram</option>
                  <option value="facebook">Facebook</option>
                  <option value="google">Google</option>
                  <option value="site">Site</option>
                  <option value="indicacao">Indicação</option>
                  <option value="panfleto">Panfleto</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowEditContact(false)} className="flex-1 py-2 text-sm text-muted-foreground font-medium rounded-lg">Cancelar</button>
              <button
                disabled={!editNome.trim() || savingContact}
                onClick={async () => {
                  setSavingContact(true);
                  try {
                    await updateResponsavel(resp.id, {
                      nome: editNome.trim(),
                      whatsapp: editWhatsapp.trim() || resp.whatsapp,
                      telefone: editWhatsapp.trim() || resp.telefone,
                      email: editEmail.trim() || null,
                      origem: (editOrigem || null) as any,
                    });
                    toast.success('Contato atualizado');
                    setShowEditContact(false);
                  } catch {
                    // error toast handled by updateResponsavel
                  } finally {
                    setSavingContact(false);
                  }
                }}
                className="flex-1 py-2 text-sm bg-primary text-primary-foreground font-medium rounded-lg disabled:opacity-50"
              >
                {savingContact ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
