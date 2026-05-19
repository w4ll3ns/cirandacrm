import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UsageMetrics {
  generatedAt: string;
  summary: {
    totalCost: number;
    totalInvocations: number;
    totalCpuMs: number;
    dbSizeMb: number;
    webhooks24h: number;
    storageMb: number;
  };
  hourly: { hour: string; invocations: number }[];
  perFunction: {
    name: string;
    invocations: number;
    avgCpuMs: number;
    totalCpuMs: number;
    errors: number;
  }[];
  costBreakdown: { resource: string; qty: string; unit: string; subtotal: number }[];
  pricing: Record<string, number>;
}

export function useUsageMetrics() {
  return useQuery<UsageMetrics>({
    queryKey: ["usage-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-usage-metrics");
      if (error) throw error;
      return data as UsageMetrics;
    },
    refetchInterval: 30_000,
  });
}
