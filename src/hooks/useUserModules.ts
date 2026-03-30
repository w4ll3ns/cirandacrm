import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type AppModule = 'crm' | 'comunidades';

export function useUserModules() {
  const { user } = useAuth();
  const [modules, setModules] = useState<AppModule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setModules([]);
      setLoading(false);
      return;
    }

    const fetchModules = async () => {
      const { data, error } = await supabase
        .from('user_modules')
        .select('module')
        .eq('user_id', user.id);

      if (!error && data) {
        setModules(data.map(d => d.module as AppModule));
      } else {
        setModules([]);
      }
      setLoading(false);
    };

    fetchModules();
  }, [user]);

  return { modules, loading };
}
