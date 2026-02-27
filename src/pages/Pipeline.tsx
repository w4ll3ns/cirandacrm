import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { ETAPA_LABELS, ETAPAS_ORDER, TEMPERATURA_LABELS, ORIGEM_LABELS } from '@/types';
import type { EtapaPipeline } from '@/types';
import { Flame, Thermometer, Snowflake, ChevronRight } from 'lucide-react';

const TEMP_ICON = {
  quente: Flame,
  morno: Thermometer,
  frio: Snowflake,
};

const TEMP_COLOR = {
  quente: 'bg-destructive/10 text-destructive',
  morno: 'bg-secondary/10 text-secondary',
  frio: 'bg-cold/10 text-cold',
};

export default function Pipeline() {
  const { usuario } = useAuth();
  const { oportunidades, responsaveis, alunos } = useData();
  const navigate = useNavigate();
  const [activeEtapa, setActiveEtapa] = useState<EtapaPipeline>('novo_lead');

  const myOpps = useMemo(() => {
    return oportunidades.filter(o =>
      usuario?.perfil === 'admin' || o.responsavel_interno_id === usuario?.id
    );
  }, [oportunidades, usuario]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof myOpps> = {};
    ETAPAS_ORDER.forEach(e => { map[e] = []; });
    myOpps.forEach(o => { if (map[o.etapa]) map[o.etapa].push(o); });
    return map;
  }, [myOpps]);

  const currentOpps = grouped[activeEtapa] || [];

  const getResp = (id: string) => responsaveis.find(r => r.id === id);
  const getAluno = (id: string) => alunos.find(a => a.id === id);

  return (
    <div className="flex flex-col h-full">
      {/* Stage tabs - horizontal scroll */}
      <div className="bg-card border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
          {ETAPAS_ORDER.map(etapa => {
            const count = grouped[etapa]?.length || 0;
            const active = activeEtapa === etapa;
            return (
              <button
                key={etapa}
                onClick={() => setActiveEtapa(etapa)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {ETAPA_LABELS[etapa]}
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${
                  active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentOpps.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhuma oportunidade nesta etapa</p>
          </div>
        )}
        {currentOpps.map(opp => {
          const resp = getResp(opp.responsavel_id);
          const aluno = getAluno(opp.aluno_id);
          const TempIcon = TEMP_ICON[opp.temperatura];
          const followup = opp.proximo_followup_em
            ? new Date(opp.proximo_followup_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
            : null;

          return (
            <button
              key={opp.id}
              onClick={() => navigate(`/app/oportunidades/${opp.id}`)}
              className="w-full bg-card rounded-xl p-4 border border-border text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{aluno?.nome || 'Aluno'}</p>
                  <p className="text-xs text-muted-foreground truncate">{resp?.nome || 'Responsável'}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TEMP_COLOR[opp.temperatura]}`}>
                  <TempIcon className="w-3 h-3" />
                  {TEMPERATURA_LABELS[opp.temperatura]}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {resp?.whatsapp && <span>📱 {resp.whatsapp}</span>}
                {resp && <span>· {ORIGEM_LABELS[resp.origem]}</span>}
              </div>

              {followup && (
                <div className="mt-2 text-xs text-primary font-medium">
                  Follow-up: {followup}
                </div>
              )}

              <div className="flex items-center justify-end mt-2">
                <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
