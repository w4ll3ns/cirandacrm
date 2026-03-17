import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PipelineStage {
  id: string;
  key: string;
  label: string;
  color: string | null;
  icon: string | null;
  is_final_win: boolean;
  is_final_loss: boolean;
  sort_order: number;
  active: boolean;
}

export function usePipelineStages() {
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [allStages, setAllStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStages = useCallback(async () => {
    const { data } = await supabase
      .from('pipeline_stages')
      .select('*')
      .order('sort_order');
    if (data) {
      setAllStages(data as PipelineStage[]);
      setStages((data as PipelineStage[]).filter(s => s.active));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStages(); }, [fetchStages]);

  const stageLabels = useMemo(() => {
    const map: Record<string, string> = {};
    stages.forEach(s => { map[s.key] = s.label; });
    return map;
  }, [stages]);

  const stageOrder = useMemo(() => stages.map(s => s.key), [stages]);

  const isFinalWin = useCallback((key: string) => stages.find(s => s.key === key)?.is_final_win ?? false, [stages]);
  const isFinalLoss = useCallback((key: string) => stages.find(s => s.key === key)?.is_final_loss ?? false, [stages]);

  return { stages, allStages, stageLabels, stageOrder, loading, isFinalWin, isFinalLoss, refetch: fetchStages };
}
