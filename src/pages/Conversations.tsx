import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ConversationStatus } from '@/types';
import ConversationDetail from './ConversationDetail';

const STATUS_FILTER: { key: ConversationStatus | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'nao_lida', label: 'Não lidas' },
  { key: 'em_atendimento', label: 'Em atendimento' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'resolvida', label: 'Resolvidas' },
  { key: 'arquivada', label: 'Arquivadas' },
];

export default function Conversations() {
  const { usuario } = useAuth();
  const { conversas = [], mensagens = [], responsaveis = [], loading, updateConversa } = useData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'todas'>('todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = conversas.filter(c =>
      usuario?.perfil === 'admin' || c.assigned_user_id === usuario?.id
    );
    if (statusFilter !== 'todas') list = list.filter(c => c.status === statusFilter);
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(c => {
        const resp = responsaveis.find(r => r.id === c.responsavel_id);
        return resp?.nome.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.ultima_mensagem_em || b.created_at).getTime() - new Date(a.ultima_mensagem_em || a.created_at).getTime());
  }, [conversas, statusFilter, busca, usuario, responsaveis]);

  const getLastMsg = (convId: string) => {
    const msgs = mensagens.filter(m => m.conversation_id === convId);
    return msgs[msgs.length - 1];
  };

  const handleSelect = (id: string) => {
    // Auto-mark as em_atendimento when selecting an unread conversation
    const selected = conversas.find(c => c.id === id);
    if (selected?.status === 'nao_lida') {
      updateConversa(id, { status: 'em_atendimento' });
    }
    if (isMobile) {
      navigate(`/app/conversas/${id}`);
    } else {
      setSelectedId(id);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const listPanel = (
    <div className={`flex flex-col h-full ${!isMobile ? 'border-r border-border' : ''}`}>
      <div className="p-3 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar conversa..." className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1 bg-card border-b border-border">
        {STATUS_FILTER.map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
            {label}
            {key === 'nao_lida' && (() => {
              const count = conversas.filter(c => c.status === 'nao_lida' && (usuario?.perfil === 'admin' || c.assigned_user_id === usuario?.id)).length;
              return count > 0 ? ` (${count})` : '';
            })()}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa encontrada</p>
          </div>
        )}
        {filtered.map(c => {
          const resp = responsaveis.find(r => r.id === c.responsavel_id);
          const lastMsg = getLastMsg(c.id);
          const isUnread = c.status === 'nao_lida';
          const isSelected = !isMobile && selectedId === c.id;

          return (
            <button key={c.id} onClick={() => handleSelect(c.id)}
              className={`w-full px-4 py-3 flex items-center gap-3 border-b border-border text-left transition-colors ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'active:bg-muted hover:bg-muted/50'}`}>
              <div className="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>{resp?.nome || 'Contato'}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {c.ultima_mensagem_em ? new Date(c.ultima_mensagem_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '-'}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {lastMsg ? (lastMsg.direction === 'outbound' ? '✓ ' : '') + (lastMsg.content_text || '') : 'Sem mensagens'}
                </p>
              </div>
              {isUnread && <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)]">
        <div className="w-96 shrink-0">{listPanel}</div>
        <div className="flex-1">
          {selectedId ? (
            <ConversationDetail embeddedId={selectedId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Selecione uma conversa</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return listPanel;
}
