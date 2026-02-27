import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import type { StatusConversa } from '@/types';

const STATUS_FILTER: { key: StatusConversa | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'nao_lida', label: 'Não lidas' },
  { key: 'aguardando', label: 'Aguardando' },
  { key: 'resolvida', label: 'Resolvidas' },
  { key: 'arquivada', label: 'Arquivadas' },
];

export default function Conversations() {
  const { usuario } = useAuth();
  const { conversas, mensagens, responsaveis } = useData();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusConversa | 'todas'>('todas');

  const filtered = useMemo(() => {
    let list = conversas.filter(c =>
      usuario?.perfil === 'admin' || c.responsavel_interno_id === usuario?.id
    );
    if (statusFilter !== 'todas') list = list.filter(c => c.status === statusFilter);
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(c => {
        const resp = responsaveis.find(r => r.id === c.responsavel_id);
        return resp?.nome.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.ultima_mensagem_em).getTime() - new Date(a.ultima_mensagem_em).getTime());
  }, [conversas, statusFilter, busca, usuario, responsaveis]);

  const getLastMsg = (convId: string) => {
    const msgs = mensagens.filter(m => m.conversa_id === convId);
    return msgs[msgs.length - 1];
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Status filter */}
      <div className="flex overflow-x-auto scrollbar-hide px-3 py-2 gap-1 bg-card border-b border-border">
        {STATUS_FILTER.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {label}
            {key === 'nao_lida' && (() => {
              const count = conversas.filter(c => c.status === 'nao_lida' &&
                (usuario?.perfil === 'admin' || c.responsavel_interno_id === usuario?.id)).length;
              return count > 0 ? ` (${count})` : '';
            })()}
          </button>
        ))}
      </div>

      {/* Conversation list */}
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

          return (
            <button
              key={c.id}
              onClick={() => navigate(`/app/conversas/${c.id}`)}
              className="w-full px-4 py-3 flex items-center gap-3 border-b border-border text-left active:bg-muted transition-colors"
            >
              <div className="w-11 h-11 rounded-full bg-success/15 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm truncate ${isUnread ? 'font-bold' : 'font-medium'}`}>{resp?.nome || 'Contato'}</p>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {new Date(c.ultima_mensagem_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                  {lastMsg ? (lastMsg.direcao === 'outbound' ? '✓ ' : '') + lastMsg.texto : 'Sem mensagens'}
                </p>
              </div>
              {isUnread && (
                <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
