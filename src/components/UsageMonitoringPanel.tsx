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

function InstanceSizeAlert() {
  const [size, setSize] = useState<string>("micro");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("valor")
        .eq("chave", "cloud_instance_size")
        .maybeSingle();
      if (data?.valor) setSize(data.valor);
      setLoading(false);
    })();
  }, []);

  const saveSize = async (newSize: string) => {
    setSaving(true);
    setSize(newSize);
    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("chave", "cloud_instance_size")
      .maybeSingle();
    const payload = {
      chave: "cloud_instance_size",
      valor: newSize,
      descricao: "Tamanho atual da instância do Lovable Cloud (informado manualmente)",
    };
    const { error } = existing
      ? await supabase.from("settings").update(payload).eq("id", existing.id)
      : await supabase.from("settings").insert(payload);
    setSaving(false);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Tamanho registrado");
  };

  if (loading) return null;
  const info = INSTANCE_PRICING[size] ?? INSTANCE_PRICING.micro;
  const isOversized = size !== "micro" && size !== "nano";

  return (
    <div
      className={`rounded-lg border p-4 ${
        isOversized
          ? "bg-yellow-50 border-yellow-300 dark:bg-yellow-950/30 dark:border-yellow-800"
          : "bg-card border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${isOversized ? "text-yellow-600" : "text-primary"}`}>
          {isOversized ? <AlertTriangle className="w-5 h-5" /> : <Server className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            Instância atual: {info.label} · ~${info.perDay.toFixed(2)}/dia
          </p>
          {isOversized ? (
            <p className="text-xs text-yellow-800 dark:text-yellow-200 mt-1">
              O uso atual do app é muito baixo (RAM ~15%, poucas invocações/dia). Considere
              voltar para <strong>Micro</strong> em <em>Backend → Advanced settings</em> para
              economizar ~${(info.perDay - INSTANCE_PRICING.micro.perDay).toFixed(2)}/dia.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1">
              Tamanho adequado para o volume atual. Se o app ficar lento sob carga, suba em
              Backend → Advanced settings.
            </p>
          )}
        </div>
        <div className="w-32 shrink-0">
          <Select value={size} onValueChange={saveSize} disabled={saving}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(INSTANCE_PRICING).map(([key, v]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {v.label} (${v.perDay.toFixed(2)}/d)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
