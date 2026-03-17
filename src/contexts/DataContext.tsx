import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import type { Responsavel, Aluno, OportunidadeMatricula, Conversa, Mensagem, Tarefa } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DataContextType {
  responsaveis: Responsavel[];
  alunos: Aluno[];
  oportunidades: OportunidadeMatricula[];
  conversas: Conversa[];
  tarefas: Tarefa[];
  loading: boolean;
  getMensagens: (conversationId: string) => Mensagem[];
  fetchMensagens: (conversationId: string) => Promise<void>;
  lastMessages: Map<string, Mensagem>;
  addMensagem: (msg: Partial<Mensagem> & { conversation_id: string; direction: Mensagem['direction']; sender_type: Mensagem['sender_type'] }) => Promise<void>;
  addResponsavel: (resp: Partial<Responsavel> & { nome: string; telefone: string }) => Promise<string>;
  addAluno: (aluno: Partial<Aluno> & { nome: string; responsavel_id: string }) => Promise<string>;
  addOportunidade: (opp: Partial<OportunidadeMatricula> & { responsavel_id: string }) => Promise<string>;
  addTarefa: (tarefa: Partial<Tarefa> & { titulo: string }) => Promise<void>;
  updateResponsavel: (id: string, data: Partial<Responsavel>) => Promise<void>;
  updateAluno: (id: string, data: Partial<Aluno>) => Promise<void>;
  updateOportunidade: (id: string, data: Partial<OportunidadeMatricula>) => Promise<void>;
  updateTarefa: (id: string, data: Partial<Tarefa>) => Promise<void>;
  updateConversa: (id: string, data: Partial<Conversa>) => Promise<void>;
}

const DataContext = createContext<DataContextType>({
  responsaveis: [], alunos: [], oportunidades: [], conversas: [], tarefas: [], loading: true,
  getMensagens: () => [], fetchMensagens: async () => {}, lastMessages: new Map(),
  addMensagem: async () => {}, addResponsavel: async () => '', addAluno: async () => '', addOportunidade: async () => '',
  addTarefa: async () => {}, updateResponsavel: async () => {}, updateAluno: async () => {},
  updateOportunidade: async () => {}, updateTarefa: async () => {}, updateConversa: async () => {},
});

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [responsaveis, setResponsaveis] = useState<Responsavel[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [oportunidades, setOportunidades] = useState<OportunidadeMatricula[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-conversation message cache
  const [msgCache, setMsgCache] = useState<Map<string, Mensagem[]>>(new Map());
  const [lastMessages, setLastMessages] = useState<Map<string, Mensagem>>(new Map());
  const fetchedConvsRef = useRef<Set<string>>(new Set());

  const getMensagens = useCallback((conversationId: string): Mensagem[] => {
    return msgCache.get(conversationId) || [];
  }, [msgCache]);

  const fetchMensagens = useCallback(async (conversationId: string): Promise<void> => {
    if (fetchedConvsRef.current.has(conversationId)) return;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) { console.error('Error fetching messages:', error); return; }
    const msgs = data as unknown as Mensagem[];
    fetchedConvsRef.current.add(conversationId);
    setMsgCache(prev => {
      const next = new Map(prev);
      next.set(conversationId, msgs);
      return next;
    });
    // Update last message
    if (msgs.length > 0) {
      setLastMessages(prev => {
        const next = new Map(prev);
        next.set(conversationId, msgs[msgs.length - 1]);
        return next;
      });
    }
  }, []);

  const fetchAll = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    try {
      const [rRes, aRes, oRes, cRes, tRes] = await Promise.all([
        supabase.from('responsaveis').select('*').order('created_at', { ascending: false }),
        supabase.from('alunos').select('*').order('created_at', { ascending: false }),
        supabase.from('oportunidades').select('*').order('created_at', { ascending: false }),
        supabase.from('conversations').select('*').order('ultima_mensagem_em', { ascending: false }),
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      ]);
      if (rRes.data) setResponsaveis(rRes.data as unknown as Responsavel[]);
      if (aRes.data) setAlunos(aRes.data as unknown as Aluno[]);
      if (oRes.data) setOportunidades(oRes.data as unknown as OportunidadeMatricula[]);
      if (cRes.data) setConversas(cRes.data as unknown as Conversa[]);
      if (tRes.data) setTarefas(tRes.data as unknown as Tarefa[]);

      // Fetch last message for each conversation for previews
      if (cRes.data && cRes.data.length > 0) {
        const convIds = cRes.data.map((c: any) => c.id);
        // Fetch the most recent message per conversation using a single query
        // We fetch all and pick the last per conversation client-side (simpler than RPC)
        const { data: previewMsgs } = await supabase
          .from('messages')
          .select('*')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
          .limit(convIds.length * 2); // rough limit: ~2 per conv is plenty for last msg

        if (previewMsgs && previewMsgs.length > 0) {
          const lastMap = new Map<string, Mensagem>();
          for (const msg of previewMsgs as unknown as Mensagem[]) {
            if (!lastMap.has(msg.conversation_id)) {
              lastMap.set(msg.conversation_id, msg);
            }
          }
          setLastMessages(lastMap);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime subscriptions
  useEffect(() => {
    if (!session) return;

    const messagesChannel = supabase
      .channel('realtime-messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as unknown as Mensagem;
        const convId = newMsg.conversation_id;
        // Update cache if conversation was fetched
        if (fetchedConvsRef.current.has(convId)) {
          setMsgCache(prev => {
            const next = new Map(prev);
            const existing = next.get(convId) || [];
            if (existing.some(m => m.id === newMsg.id)) return prev;
            next.set(convId, [...existing, newMsg]);
            return next;
          });
        }
        // Always update last message for preview
        setLastMessages(prev => {
          const next = new Map(prev);
          next.set(convId, newMsg);
          return next;
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const updated = payload.new as unknown as Mensagem;
        const convId = updated.conversation_id;
        if (fetchedConvsRef.current.has(convId)) {
          setMsgCache(prev => {
            const next = new Map(prev);
            const existing = next.get(convId) || [];
            next.set(convId, existing.map(m => m.id === updated.id ? updated : m));
            return next;
          });
        }
        // Update last message if it's the same
        setLastMessages(prev => {
          const current = prev.get(convId);
          if (current?.id === updated.id) {
            const next = new Map(prev);
            next.set(convId, updated);
            return next;
          }
          return prev;
        });
      })
      .subscribe();

    const convsChannel = supabase
      .channel('realtime-conversations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (payload) => {
        const newConv = payload.new as unknown as Conversa;
        setConversas(prev => {
          if (prev.some(c => c.id === newConv.id)) return prev;
          return [newConv, ...prev];
        });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        const updated = payload.new as unknown as Conversa;
        setConversas(prev => prev.map(c => c.id === updated.id ? updated : c));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(convsChannel);
    };
  }, [session]);

  const addResponsavel = async (resp: Partial<Responsavel> & { nome: string; telefone: string }): Promise<string> => {
    const { data, error } = await supabase.from('responsaveis').insert({
      nome: resp.nome, telefone: resp.telefone, whatsapp: resp.whatsapp || resp.telefone,
      email: resp.email || null, origem: resp.origem || 'outro', tags: resp.tags || [],
      utm_source: resp.utm_source || null, utm_medium: resp.utm_medium || null, utm_campaign: resp.utm_campaign || null,
    }).select().single();
    if (error) { toast.error('Erro ao criar responsável'); throw error; }
    setResponsaveis(prev => [data as unknown as Responsavel, ...prev]);
    return data.id;
  };

  const addAluno = async (aluno: Partial<Aluno> & { nome: string; responsavel_id: string }): Promise<string> => {
    const { data, error } = await supabase.from('alunos').insert({
      nome: aluno.nome, responsavel_id: aluno.responsavel_id,
      data_nascimento: aluno.data_nascimento || null, serie_interesse: aluno.serie_interesse || null, unidade_interesse: aluno.unidade_interesse || null,
    }).select().single();
    if (error) { toast.error('Erro ao criar aluno'); throw error; }
    setAlunos(prev => [data as unknown as Aluno, ...prev]);
    return data.id;
  };

  const addOportunidade = async (opp: Partial<OportunidadeMatricula> & { responsavel_id: string }): Promise<string> => {
    const { data, error } = await supabase.from('oportunidades').insert({
      responsavel_id: opp.responsavel_id, aluno_id: opp.aluno_id || null,
      etapa: (opp.etapa as any) || 'novo_lead', temperatura: opp.temperatura || 'morno',
      status: (opp.status as any) || 'aberta', valor_estimado: opp.valor_estimado || null,
      responsavel_interno_id: opp.responsavel_interno_id || null, origem: (opp.origem as any) || null,
    }).select().single();
    if (error) { toast.error('Erro ao criar oportunidade'); throw error; }
    setOportunidades(prev => [data as unknown as OportunidadeMatricula, ...prev]);
    return data.id;
  };

  const addTarefa = async (tarefa: Partial<Tarefa> & { titulo: string }): Promise<void> => {
    const { data, error } = await supabase.from('tasks').insert({
      titulo: tarefa.titulo, tipo: tarefa.tipo || 'followup', descricao: tarefa.descricao || null,
      due_date: tarefa.due_date || null, prioridade: (tarefa.prioridade as any) || 'media',
      responsavel_interno_id: tarefa.responsavel_interno_id || null, responsavel_id: tarefa.responsavel_id || null,
      aluno_id: tarefa.aluno_id || null, oportunidade_id: tarefa.oportunidade_id || null,
    }).select().single();
    if (error) { toast.error('Erro ao criar tarefa'); throw error; }
    setTarefas(prev => [data as unknown as Tarefa, ...prev]);
  };

  const addMensagem = async (msg: Partial<Mensagem> & { conversation_id: string; direction: Mensagem['direction']; sender_type: Mensagem['sender_type'] } & { phone?: string }): Promise<void> => {
    const { data, error } = await supabase.functions.invoke('zapi-send', {
      body: { conversation_id: msg.conversation_id, message: msg.content_text || '', phone: msg.phone || null },
    });
    if (error) { toast.error('Erro ao enviar mensagem'); throw error; }
    if (data?.error) { toast.error(data.error); throw new Error(data.error); }
  };

  const updateResponsavel = async (id: string, data: Partial<Responsavel>): Promise<void> => {
    const { error } = await supabase.from('responsaveis').update(data as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); throw error; }
    setResponsaveis(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  };

  const updateAluno = async (id: string, data: Partial<Aluno>): Promise<void> => {
    const { error } = await supabase.from('alunos').update(data as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); throw error; }
    setAlunos(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  };

  const updateOportunidade = async (id: string, data: Partial<OportunidadeMatricula>): Promise<void> => {
    const { error } = await supabase.from('oportunidades').update(data as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); throw error; }
    setOportunidades(prev => prev.map(o => o.id === id ? { ...o, ...data } : o));
  };

  const updateTarefa = async (id: string, data: Partial<Tarefa>): Promise<void> => {
    const updateData: any = { ...data };
    if (data.status === 'concluida') updateData.completed_at = new Date().toISOString();
    if (data.status === 'pendente') updateData.completed_at = null;
    const { error } = await supabase.from('tasks').update(updateData).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); throw error; }
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, ...updateData } : t));
  };

  const updateConversa = async (id: string, data: Partial<Conversa>): Promise<void> => {
    const { error } = await supabase.from('conversations').update(data as any).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); throw error; }
  };

  return (
    <DataContext.Provider value={{
      responsaveis, alunos, oportunidades, conversas, tarefas, loading,
      getMensagens, fetchMensagens, lastMessages,
      addMensagem, addResponsavel, addAluno, addOportunidade, addTarefa,
      updateResponsavel, updateAluno, updateOportunidade, updateTarefa, updateConversa,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
