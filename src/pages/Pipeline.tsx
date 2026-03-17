import { useMemo, useState, useRef, useCallback, useEffect, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { ETAPA_LABELS, ETAPAS_ORDER, TEMPERATURA_LABELS, ORIGEM_LABELS } from '@/types';
import type { EtapaPipeline, Temperatura } from '@/types';
import { Flame, Thermometer, Snowflake, ChevronLeft, ChevronRight, Search, Plus, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import NewLeadForm from '@/components/NewLeadForm';
import { useProfiles } from '@/hooks/useProfiles';
import { usePermissions } from '@/hooks/usePermissions';

const TEMP_ICON: Record<string, any> = { quente: Flame, morno: Thermometer, frio: Snowflake };
const TEMP_COLOR: Record<string, string> = { quente: 'bg-destructive/10 text-destructive', morno: 'bg-secondary/10 text-secondary', frio: 'bg-cold/10 text-cold' };
const TEMP_CYCLE: Temperatura[] = ['frio', 'morno', 'quente'];

export default function Pipeline() {
  const { usuario } = useAuth();
  const { oportunidades, responsaveis, alunos, updateOportunidade, loading } = useData();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canEditPipeline, canFilterByResponsavel } = usePermissions();
  const { profiles } = useProfiles();
  const [activeEtapa, setActiveEtapa] = useState<EtapaPipeline>('novo_lead');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverEtapa, setDragOverEtapa] = useState<EtapaPipeline | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTemp, setFilterTemp] = useState<Temperatura | 'todas'>('todas');
  const [filterResp, setFilterResp] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => { el.removeEventListener('scroll', checkScroll); window.removeEventListener('resize', checkScroll); };
  }, [checkScroll]);

  const scrollByAmount = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const handleDragStart = (e: DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggingId(id);
  };
  const handleDragEnd = () => { setDraggingId(null); setDragOverEtapa(null); };
  const handleDragOver = (e: DragEvent, etapa: EtapaPipeline) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverEtapa(etapa); };
  const handleDragLeave = () => { setDragOverEtapa(null); };
  const handleDrop = (e: DragEvent, etapa: EtapaPipeline) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    const opp = oportunidades.find(o => o.id === oppId);
    if (opp && opp.etapa !== etapa) {
      updateOportunidade(oppId, { etapa });
      toast.success(`Oportunidade movida para ${ETAPA_LABELS[etapa]}`);
    }
    setDraggingId(null); setDragOverEtapa(null);
  };

  const cycleTemperature = (e: React.MouseEvent, oppId: string, current: string | null) => {
    e.stopPropagation();
    e.preventDefault();
    const temp = (current || 'morno') as Temperatura;
    const idx = TEMP_CYCLE.indexOf(temp);
    const next = TEMP_CYCLE[(idx + 1) % 3];
    updateOportunidade(oppId, { temperatura: next });
    toast.success(`Temperatura: ${TEMPERATURA_LABELS[next]}`);
  };

  const myOpps = useMemo(() => {
    let list = oportunidades.filter(o =>
      usuario?.perfil === 'admin' || o.responsavel_interno_id === usuario?.id
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(o => {
        const resp = responsaveis.find(r => r.id === o.responsavel_id);
        const aluno = alunos.find(a => a.id === o.aluno_id);
        return resp?.nome.toLowerCase().includes(q) || aluno?.nome.toLowerCase().includes(q) || (resp?.whatsapp || resp?.telefone || '').includes(q);
      });
    }
    if (filterTemp !== 'todas') list = list.filter(o => o.temperatura === filterTemp);
    if (filterResp) list = list.filter(o => o.responsavel_interno_id === filterResp);
    return list;
  }, [oportunidades, usuario, searchQuery, filterTemp, filterResp, responsaveis, alunos]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof myOpps> = {};
    ETAPAS_ORDER.forEach(e => { map[e] = []; });
    myOpps.forEach(o => { if (map[o.etapa]) map[o.etapa].push(o); });
    return map;
  }, [myOpps]);

  const getResp = (id: string) => responsaveis.find(r => r.id === id);
  const getAluno = (id: string | null) => id ? alunos.find(a => a.id === id) : undefined;

  const renderCard = (opp: typeof myOpps[0]) => {
    const resp = getResp(opp.responsavel_id);
    const aluno = getAluno(opp.aluno_id);
    const temp = (opp.temperatura || 'morno') as Temperatura;
    const TempIcon = TEMP_ICON[temp] || Thermometer;
    const followup = opp.proximo_followup_em ? new Date(opp.proximo_followup_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null;

    return (
      <button key={opp.id} onClick={() => navigate(`/app/oportunidades/${opp.id}`)} className="w-full bg-card rounded-xl p-4 border border-border text-left active:scale-[0.99] transition-transform hover:shadow-md hover:border-primary/30">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{aluno?.nome || 'Aluno'}</p>
            <p className="text-xs text-muted-foreground truncate">{resp?.nome || 'Responsável'}</p>
          </div>
          {canEditPipeline ? (
            <button onClick={(e) => { e.stopPropagation(); cycleTemperature(e, opp.id, opp.temperatura); }}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium hover:opacity-70 transition-opacity ${TEMP_COLOR[temp] || TEMP_COLOR.morno}`}
              title="Clique para alterar temperatura">
              <TempIcon className="w-3 h-3" /> {TEMPERATURA_LABELS[temp] || 'Morno'}
            </button>
          ) : (
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TEMP_COLOR[temp] || TEMP_COLOR.morno}`}>
              <TempIcon className="w-3 h-3" /> {TEMPERATURA_LABELS[temp] || 'Morno'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(resp?.whatsapp || resp?.telefone) && <span>📱 {resp?.whatsapp || resp?.telefone}</span>}
          {resp?.origem && <span>· {ORIGEM_LABELS[resp.origem] || resp.origem}</span>}
        </div>
        {opp.valor_estimado && (
          <div className="mt-1.5 text-xs text-success font-medium flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> R$ {opp.valor_estimado.toLocaleString('pt-BR')}
          </div>
        )}
        {followup && <div className="mt-1 text-xs text-primary font-medium">Follow-up: {followup}</div>}
      </button>
    );
  };

  const renderDesktopCard = (opp: typeof myOpps[0]) => {
    const resp = getResp(opp.responsavel_id);
    const aluno = getAluno(opp.aluno_id);
    const temp = (opp.temperatura || 'morno') as Temperatura;
    const TempIcon = TEMP_ICON[temp] || Thermometer;
    const followup = opp.proximo_followup_em ? new Date(opp.proximo_followup_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null;
    const isDragging = draggingId === opp.id;

    return (
      <div key={opp.id} draggable={canEditPipeline} onDragStart={canEditPipeline ? (e) => handleDragStart(e, opp.id) : undefined} onDragEnd={canEditPipeline ? handleDragEnd : undefined} onClick={() => navigate(`/app/oportunidades/${opp.id}`)}
        className={`w-full bg-card rounded-xl p-4 border border-border text-left transition-all hover:shadow-md hover:border-primary/30 ${canEditPipeline ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${isDragging ? 'opacity-40 scale-95' : ''}`}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{aluno?.nome || 'Aluno'}</p>
            <p className="text-xs text-muted-foreground truncate">{resp?.nome || 'Responsável'}</p>
          </div>
          {canEditPipeline ? (
            <button onClick={(e) => cycleTemperature(e, opp.id, opp.temperatura)} onMouseDown={(e) => e.stopPropagation()}
              className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium hover:opacity-70 transition-opacity ${TEMP_COLOR[temp] || TEMP_COLOR.morno}`}
              title="Clique para alterar temperatura">
              <TempIcon className="w-3 h-3" /> {TEMPERATURA_LABELS[temp] || 'Morno'}
            </button>
          ) : (
            <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${TEMP_COLOR[temp] || TEMP_COLOR.morno}`}>
              <TempIcon className="w-3 h-3" /> {TEMPERATURA_LABELS[temp] || 'Morno'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(resp?.whatsapp || resp?.telefone) && <span>📱 {resp?.whatsapp || resp?.telefone}</span>}
          {resp?.origem && <span>· {ORIGEM_LABELS[resp.origem] || resp.origem}</span>}
        </div>
        {opp.valor_estimado && (
          <div className="mt-1.5 text-xs text-success font-medium flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> R$ {opp.valor_estimado.toLocaleString('pt-BR')}
          </div>
        )}
        {followup && <div className="mt-1 text-xs text-primary font-medium">Follow-up: {followup}</div>}
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  // Desktop
  if (!isMobile) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex flex-col">
        <div className="p-4 pb-0 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">Pipeline</h1>
            <button onClick={() => setShowNewLead(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> Novo Lead
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar por nome..." className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <select value={filterTemp} onChange={e => setFilterTemp(e.target.value as any)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="todas">Todas temperaturas</option>
              <option value="quente">🔥 Quente</option>
              <option value="morno">🌡 Morno</option>
              <option value="frio">❄️ Frio</option>
            </select>
            {canFilterByResponsavel && (
              <select value={filterResp} onChange={e => setFilterResp(e.target.value)} className="bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">Todos responsáveis</option>
                {profiles.filter(p => p.active).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            )}
          </div>
        </div>
        <div className="flex-1 relative">
          {canScrollLeft && (
            <button onClick={() => scrollByAmount(-1)} className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background to-transparent hover:from-background/90 transition-opacity">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          )}
          {canScrollRight && (
            <button onClick={() => scrollByAmount(1)} className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background to-transparent hover:from-background/90 transition-opacity">
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          )}
          <div ref={scrollRef} className="h-full overflow-x-scroll p-4 scrollbar-always-visible">
            <div className="flex gap-4 h-full min-w-max">
              {ETAPAS_ORDER.map(etapa => {
                const opps = grouped[etapa] || [];
                const isLost = etapa === 'perdido';
                const isWon = etapa === 'matricula_fechada';
                const isOver = dragOverEtapa === etapa;
                const totalValue = opps.reduce((s, o) => s + (o.valor_estimado || 0), 0);
                return (
                  <div key={etapa} onDragOver={canEditPipeline ? (e) => handleDragOver(e, etapa) : undefined} onDragLeave={canEditPipeline ? handleDragLeave : undefined} onDrop={canEditPipeline ? (e) => handleDrop(e, etapa) : undefined}
                    className={`w-72 flex flex-col shrink-0 bg-card/50 rounded-xl border transition-all duration-200 ${isOver ? 'border-primary bg-primary/5 shadow-lg ring-2 ring-primary/30 scale-[1.01]' : 'border-border'}`}>
                    <div className="px-4 py-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-sm font-semibold ${isLost ? 'text-destructive' : isWon ? 'text-success' : ''}`}>{ETAPA_LABELS[etapa]}</h3>
                        <span className="bg-muted text-muted-foreground text-xs font-bold rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">{opps.length}</span>
                      </div>
                      {totalValue > 0 && <p className="text-[10px] text-muted-foreground mt-0.5">R$ {totalValue.toLocaleString('pt-BR')}</p>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {opps.length === 0 && <p className={`text-xs text-center py-6 ${isOver ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>{isOver ? '↓ Solte aqui ↓' : 'Nenhuma'}</p>}
                      {opps.map(renderDesktopCard)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <NewLeadForm open={showNewLead} onClose={() => setShowNewLead(false)} />
      </div>
    );
  }

  // Mobile
  const currentOpps = grouped[activeEtapa] || [];
  return (
    <div className="flex flex-col h-full">
      <div className="bg-card border-b border-border">
        <div className="flex overflow-x-auto scrollbar-hide px-2 py-2 gap-1">
          {ETAPAS_ORDER.map(etapa => {
            const count = grouped[etapa]?.length || 0;
            const active = activeEtapa === etapa;
            return (
              <button key={etapa} onClick={() => setActiveEtapa(etapa)} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                {ETAPA_LABELS[etapa]}
                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold ${active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentOpps.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground text-sm">Nenhuma oportunidade nesta etapa</p></div>}
        {currentOpps.map(renderCard)}
      </div>
      <NewLeadForm open={showNewLead} onClose={() => setShowNewLead(false)} />
      <button onClick={() => setShowNewLead(true)} className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
