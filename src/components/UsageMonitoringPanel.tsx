import { useEffect, useState } from "react";
import { useUsageMetrics } from "@/hooks/useUsageMetrics";
import { Activity, DollarSign, Cpu, Database, Webhook, RefreshCw, AlertTriangle, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const INSTANCE_PRICING: Record<string, { perHour: number; perDay: number; label: string }> = {
  nano: { perHour: 0.0070, perDay: 0.17, label: "Nano" },
  micro: { perHour: 0.01307, perDay: 0.31, label: "Micro" },
  small: { perHour: 0.025, perDay: 0.60, label: "Small" },
  medium: { perHour: 0.07, perDay: 1.68, label: "Medium" },
  large: { perHour: 0.14, perDay: 3.36, label: "Large" },
  xl: { perHour: 0.28, perDay: 6.72, label: "XL" },
  "2xl": { perHour: 0.56, perDay: 13.40, label: "2XL" },
};

const fmtUsd = (n: number) => `$${n.toFixed(4)}`;
const fmtNum = (n: number) => n.toLocaleString("pt-BR");
const fmtMs = (n: number) => `${(n / 1000).toFixed(1)}s`;

export default function UsageMonitoringPanel() {
  const { data, isLoading, refetch, isFetching, dataUpdatedAt } = useUsageMetrics();

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando métricas...</p>;
  }

  if (!data) {
    return <p className="text-sm text-destructive">Falha ao carregar métricas.</p>;
  }

  const { summary, hourly, perFunction, costBreakdown } = data;

  return (
    <div className="space-y-6">
      <InstanceSizeAlert />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Monitoramento (últimas 24h)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Atualizado em {new Date(dataUpdatedAt).toLocaleTimeString("pt-BR")} · auto a cada 30s
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard icon={<DollarSign className="w-4 h-4" />} label="Custo estimado 24h" value={fmtUsd(summary.totalCost)} />
        <SummaryCard icon={<Activity className="w-4 h-4" />} label="Invocações" value={fmtNum(summary.totalInvocations)} />
        <SummaryCard icon={<Cpu className="w-4 h-4" />} label="CPU total" value={fmtMs(summary.totalCpuMs)} />
        <SummaryCard icon={<Database className="w-4 h-4" />} label="Tamanho do banco" value={`${summary.dbSizeMb.toFixed(0)} MB`} />
        <SummaryCard icon={<Webhook className="w-4 h-4" />} label="Webhooks 24h" value={fmtNum(summary.webhooks24h)} />
      </div>

      {/* Gráfico por hora */}
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Invocações por hora
        </p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => new Date(v).getHours() + "h"}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                labelFormatter={(v) => new Date(v as string).toLocaleString("pt-BR")}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Bar dataKey="invocations" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabela por função */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Edge Functions
        </p>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Invocações</TableHead>
                <TableHead className="text-right">CPU total</TableHead>
                <TableHead className="text-right">CPU média</TableHead>
                <TableHead className="text-right">Erros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perFunction.map((f) => (
                <TableRow key={f.name}>
                  <TableCell className="font-mono text-xs">{f.name}</TableCell>
                  <TableCell className="text-right">{fmtNum(f.invocations)}</TableCell>
                  <TableCell className="text-right">{fmtMs(f.totalCpuMs)}</TableCell>
                  <TableCell className="text-right">{f.avgCpuMs} ms</TableCell>
                  <TableCell className="text-right">{f.errors}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Detalhamento de custo */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
          Detalhamento de custo
        </p>
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recurso</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Preço unitário</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {costBreakdown.map((r) => (
                <TableRow key={r.resource}>
                  <TableCell>{r.resource}</TableCell>
                  <TableCell className="text-muted-foreground">{r.qty}</TableCell>
                  <TableCell className="text-muted-foreground">{r.unit}</TableCell>
                  <TableCell className="text-right font-mono">{fmtUsd(r.subtotal)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={3} className="font-semibold">Total estimado</TableCell>
                <TableCell className="text-right font-mono font-semibold">{fmtUsd(summary.totalCost)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-[11px] text-muted-foreground mt-2">
          Valores estimados a partir de proxies internos. Os números oficiais aparecem em Lovable Cloud → Cloud & AI balance.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] uppercase tracking-wider">
        {icon} {label}
      </div>
      <p className="text-lg font-semibold mt-1.5 tabular-nums">{value}</p>
    </div>
  );
}
