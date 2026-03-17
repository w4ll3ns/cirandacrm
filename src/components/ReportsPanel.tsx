import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';
import { ETAPA_LABELS, ETAPAS_ORDER, ORIGEM_LABELS } from '@/types';

const COLORS = [
  'hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--success))',
  'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--cold))',
  '#8b5cf6', '#f59e0b',
];

export default function ReportsPanel() {
  const { oportunidades, responsaveis } = useData();

  const funnelData = useMemo(() => {
    return ETAPAS_ORDER.filter(e => e !== 'perdido').map((etapa, i) => ({
      name: ETAPA_LABELS[etapa],
      value: oportunidades.filter(o => o.etapa === etapa).length,
      fill: COLORS[i % COLORS.length],
    }));
  }, [oportunidades]);

  const origemData = useMemo(() => {
    const map: Record<string, number> = {};
    oportunidades.forEach(o => {
      const resp = responsaveis.find(r => r.id === o.responsavel_id);
      if (resp?.origem) {
        const label = ORIGEM_LABELS[resp.origem] || resp.origem;
        map[label] = (map[label] || 0) + 1;
      }
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [oportunidades, responsaveis]);

  const perdaData = useMemo(() => {
    const map: Record<string, number> = {};
    oportunidades.filter(o => o.status === 'perdida' && o.motivo_perda).forEach(o => {
      map[o.motivo_perda!] = (map[o.motivo_perda!] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [oportunidades]);

  const conversionRate = useMemo(() => {
    const total = oportunidades.length;
    const ganhas = oportunidades.filter(o => o.status === 'ganha').length;
    return total > 0 ? Math.round((ganhas / total) * 100) : 0;
  }, [oportunidades]);

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-5 border border-border text-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Taxa de Conversão</p>
        <p className="text-4xl font-bold text-success">{conversionRate}%</p>
        <p className="text-xs text-muted-foreground mt-1">
          {oportunidades.filter(o => o.status === 'ganha').length} matrículas de {oportunidades.length} oportunidades
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Funil de Conversão</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Leads por Origem</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={origemData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                {origemData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Motivos de Perda</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={perdaData} margin={{ left: 10, right: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis hide />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--destructive))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Valor do Pipeline</h3>
          <div className="space-y-3">
            {ETAPAS_ORDER.filter(e => e !== 'perdido').map(etapa => {
              const opps = oportunidades.filter(o => o.etapa === etapa);
              const total = opps.reduce((s, o) => s + (o.valor_estimado || 0), 0);
              return (
                <div key={etapa} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{ETAPA_LABELS[etapa]}</span>
                  <span className="font-semibold">R$ {total.toLocaleString('pt-BR')}</span>
                </div>
              );
            })}
            <div className="border-t border-border pt-2 flex items-center justify-between text-sm font-bold">
              <span>Total</span>
              <span className="text-primary">
                R$ {oportunidades.filter(o => o.status === 'aberta').reduce((s, o) => s + (o.valor_estimado || 0), 0).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
