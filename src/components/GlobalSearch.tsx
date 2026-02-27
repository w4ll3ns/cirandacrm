import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Users, GraduationCap, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { ETAPA_LABELS } from '@/types';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const navigate = useNavigate();
  const { responsaveis, alunos, oportunidades } = useData();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const results = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const items: { type: string; label: string; sub: string; path: string; icon: typeof Users }[] = [];

    responsaveis.filter(r => r.nome.toLowerCase().includes(q) || r.whatsapp.includes(q)).slice(0, 5).forEach(r => {
      items.push({ type: 'Responsável', label: r.nome, sub: r.whatsapp, path: `/app/contatos/resp/${r.id}`, icon: Users });
    });

    alunos.filter(a => a.nome.toLowerCase().includes(q)).slice(0, 5).forEach(a => {
      items.push({ type: 'Aluno', label: a.nome, sub: a.serie_turma_interesse, path: `/app/contatos/aluno/${a.id}`, icon: GraduationCap });
    });

    oportunidades.filter(o => {
      const resp = responsaveis.find(r => r.id === o.responsavel_id);
      const aluno = alunos.find(a => a.id === o.aluno_id);
      return resp?.nome.toLowerCase().includes(q) || aluno?.nome.toLowerCase().includes(q);
    }).slice(0, 5).forEach(o => {
      const aluno = alunos.find(a => a.id === o.aluno_id);
      items.push({ type: 'Oportunidade', label: aluno?.nome || 'Aluno', sub: ETAPA_LABELS[o.etapa], path: `/app/oportunidades/${o.id}`, icon: Target });
    });

    return items.slice(0, 10);
  }, [query, responsaveis, alunos, oportunidades]);

  const showDropdown = focused && results.length > 0;

  return (
    <div ref={ref} className="relative w-72">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        placeholder="Buscar contatos, oportunidades..."
        className="w-full pl-10 pr-8 py-2 bg-muted rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      {query && (
        <button onClick={() => { setQuery(''); setFocused(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => { navigate(r.path); setQuery(''); setFocused(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors text-sm"
            >
              <r.icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.type} · {r.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
