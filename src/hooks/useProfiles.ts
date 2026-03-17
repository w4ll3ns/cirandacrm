import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  role: string | null;
}

export function useProfiles() {
  const { session } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    if (!session) { setLoading(false); return; }

    const { data: profilesData } = await supabase.from('profiles').select('*');
    const { data: rolesData } = await supabase.from('user_roles').select('user_id, role');

    if (profilesData) {
      const roleMap = new Map(rolesData?.map(r => [r.user_id, r.role]) || []);
      setProfiles(profilesData.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        avatar_url: p.avatar_url,
        active: p.active,
        role: roleMap.get(p.id) || null,
      })));
    }
    setLoading(false);
  }, [session]);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  return { profiles, loading, refetch: fetchProfiles };
}
