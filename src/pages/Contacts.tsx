import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, GraduationCap } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { ORIGEM_LABELS } from '@/types';

type Tab = 'responsaveis' | 'alunos';

export default function Contacts() {
  const { responsaveis, alunos } = useData();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('responsaveis');
  const [busca, setBusca] = useState('');

  const filteredResp = useMemo(() => {
    if (!busca) return responsaveis;
    const q = busca.toLowerCase();
    return responsaveis.filter(r => r.nome.toLowerCase().includes(q) || r.whatsapp.includes(q));
  }, [responsaveis, busca]);

  const filteredAlunos = useMemo(() => {
    if (!busca) return alunos;
    const q = busca.toLowerCase();
    return alunos.filter(a => a.nome.toLowerCase().includes(q) || a.serie_turma_interesse.toLowerCase().includes(q));
  }, [alunos, busca]);

  const statusLabel = (s: string) => {
    const map: Record<string, string> = { lead: 'Lead', matriculado: 'Matriculado', 'ex-aluno': 'Ex-aluno', interessado: 'Interessado' };
    return map[s] || s;
  };

  const alunoStatusLabel = (s: string) => {
    const map: Record<string, string> = { interessado: 'Interessado', em_negociacao: 'Em negociação', matriculado: 'Matriculado', ex_aluno: 'Ex-aluno' };
    return map[s] || s;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="bg-card border-b border-border flex">
        <button
          onClick={() => setTab('responsaveis')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'responsaveis' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Users className="w-4 h-4 inline mr-1.5" />Responsáveis ({responsaveis.length})
        </button>
        <button
          onClick={() => setTab('alunos')}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            tab === 'alunos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <GraduationCap className="w-4 h-4 inline mr-1.5" />Alunos ({alunos.length})
        </button>
      </div>

      {/* Search */}
      <div className="p-3 bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder={tab === 'responsaveis' ? 'Buscar responsável...' : 'Buscar aluno...'}
            className="w-full pl-10 pr-4 py-2.5 bg-muted rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'responsaveis' ? (
          filteredResp.map(r => (
            <button
              key={r.id}
              onClick={() => navigate(`/app/contatos/resp/${r.id}`)}
              className="w-full px-4 py-3 flex items-center gap-3 border-b border-border text-left active:bg-muted"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {r.nome.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{r.nome}</p>
                <p className="text-xs text-muted-foreground">{r.whatsapp} · {ORIGEM_LABELS[r.origem]}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                r.status_relacionamento === 'matriculado' ? 'bg-success/10 text-success' :
                r.status_relacionamento === 'lead' ? 'bg-primary/10 text-primary' :
                'bg-muted text-muted-foreground'
              }`}>
                {statusLabel(r.status_relacionamento)}
              </span>
            </button>
          ))
        ) : (
          filteredAlunos.map(a => {
            const resp = responsaveis.find(r => r.id === a.responsavel_id);
            return (
              <button
                key={a.id}
                onClick={() => navigate(`/app/contatos/aluno/${a.id}`)}
                className="w-full px-4 py-3 flex items-center gap-3 border-b border-border text-left active:bg-muted"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0">
                  {a.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.nome}</p>
                  <p className="text-xs text-muted-foreground">{a.serie_turma_interesse} · {resp?.nome || '-'}</p>
                </div>
                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                  {alunoStatusLabel(a.status)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
