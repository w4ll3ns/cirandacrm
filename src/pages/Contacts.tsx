import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, GraduationCap } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ORIGEM_LABELS } from '@/types';

type Tab = 'responsaveis' | 'alunos';

export default function Contacts() {
  const { responsaveis, alunos } = useData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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

  // Desktop table view
  if (!isMobile) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        {/* Tabs + Search */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-1 bg-card rounded-lg p-1 border border-border">
            <button
              onClick={() => setTab('responsaveis')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'responsaveis' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4 inline mr-1.5" />Responsáveis ({responsaveis.length})
            </button>
            <button
              onClick={() => setTab('alunos')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                tab === 'alunos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="w-4 h-4 inline mr-1.5" />Alunos ({alunos.length})
            </button>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {tab === 'responsaveis' ? (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">WhatsApp</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Origem</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Cadastro</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Nome</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Série</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Responsável</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Nascimento</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tab === 'responsaveis' ? (
                filteredResp.map(r => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/app/contatos/resp/${r.id}`)}
                    className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          {r.nome.charAt(0)}
                        </div>
                        <span className="font-medium text-sm">{r.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{r.whatsapp}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ORIGEM_LABELS[r.origem]}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        r.status_relacionamento === 'matriculado' ? 'bg-success/10 text-success' :
                        r.status_relacionamento === 'lead' ? 'bg-primary/10 text-primary' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {statusLabel(r.status_relacionamento)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(r.criado_em).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                ))
              ) : (
                filteredAlunos.map(a => {
                  const resp = responsaveis.find(r => r.id === a.responsavel_id);
                  return (
                    <tr
                      key={a.id}
                      onClick={() => navigate(`/app/contatos/aluno/${a.id}`)}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent-foreground font-bold text-xs shrink-0">
                            {a.nome.charAt(0)}
                          </div>
                          <span className="font-medium text-sm">{a.nome}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{a.serie_turma_interesse}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{resp?.nome || '-'}</td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-medium">
                          {alunoStatusLabel(a.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(a.data_nascimento).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Mobile list view
  return (
    <div className="flex flex-col h-full">
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
