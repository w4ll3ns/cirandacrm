import { useState } from 'react';
import { UserPlus, Shield, X, UserX, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useProfiles, Profile } from '@/hooks/useProfiles';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import type { AppRole } from '@/types';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  atendente: 'Atendente',
};

const MODULE_LABELS: Record<string, string> = {
  crm: 'CRM',
  comunidades: 'Comunidades',
};

export default function TeamManagement() {
  const { profiles, loading, refetch } = useProfiles();
  const [showInvite, setShowInvite] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<AppRole>('atendente');
  const [inviteModules, setInviteModules] = useState<string[]>(['crm']);
  const [submitting, setSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [userModules, setUserModules] = useState<Record<string, string[]>>({});
  const [modulesLoaded, setModulesLoaded] = useState(false);

  // Fetch modules for all users
  const fetchModules = async () => {
    const { data } = await supabase.from('user_modules').select('user_id, module');
    if (data) {
      const map: Record<string, string[]> = {};
      data.forEach(d => {
        if (!map[d.user_id]) map[d.user_id] = [];
        map[d.user_id].push(d.module);
      });
      setUserModules(map);
    }
    setModulesLoaded(true);
  };

  // Load modules on first render
  if (!modulesLoaded) fetchModules();

  const toggleInviteModule = (mod: string) => {
    setInviteModules(prev =>
      prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]
    );
  };

  const handleToggleModule = async (userId: string, mod: string) => {
    const current = userModules[userId] || [];
    const has = current.includes(mod);

    try {
      if (has) {
        const { error } = await supabase
          .from('user_modules')
          .delete()
          .eq('user_id', userId)
          .eq('module', mod);
        if (error) throw error;
        setUserModules(prev => ({
          ...prev,
          [userId]: (prev[userId] || []).filter(m => m !== mod),
        }));
      } else {
        const { error } = await supabase
          .from('user_modules')
          .insert({ user_id: userId, module: mod });
        if (error) throw error;
        setUserModules(prev => ({
          ...prev,
          [userId]: [...(prev[userId] || []), mod],
        }));
      }
      toast.success('Módulo atualizado');
    } catch {
      toast.error('Erro ao atualizar módulo');
    }
  };

  const handleInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim() || !invitePassword.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (invitePassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (inviteModules.length === 0) {
      toast.error('Selecione pelo menos um módulo');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-member', {
        body: {
          name: inviteName.trim(),
          email: inviteEmail.trim(),
          password: invitePassword.trim(),
          role: inviteRole,
          modules: inviteModules,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(`${inviteName} foi adicionado(a) à equipe!`);
      setShowInvite(false);
      setInviteName('');
      setInviteEmail('');
      setInvitePassword('');
      setInviteRole('atendente');
      setInviteModules(['crm']);
      refetch();
      fetchModules();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao convidar membro');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: AppRole) => {
    try {
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) throw error;
      toast.success('Perfil atualizado');
      setEditingRole(null);
      refetch();
    } catch {
      toast.error('Erro ao alterar perfil');
    }
  };

  const handleToggleActive = async (profile: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: !profile.active })
        .eq('id', profile.id);
      if (error) throw error;
      toast.success(profile.active ? 'Membro desativado' : 'Membro reativado');
      refetch();
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-lg" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-3.5 h-3.5" /> Equipe
        </h3>
        <button onClick={() => setShowInvite(true)} className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-full font-medium flex items-center gap-1">
          <UserPlus className="w-3 h-3" /> Convidar
        </button>
      </div>

      {profiles.map(u => {
        const isAdmin = u.role === 'admin';
        const mods = userModules[u.id] || [];
        return (
          <div key={u.id} className={`py-3 space-y-2 ${!u.active ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{u.name}</p>
                <p className="text-xs text-muted-foreground">{u.email}</p>
              </div>
              {editingRole === u.id ? (
                <select
                  value={u.role || 'atendente'}
                  onChange={e => handleChangeRole(u.id, e.target.value as AppRole)}
                  className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onBlur={() => setEditingRole(null)}
                >
                  <option value="admin">Administrador</option>
                  <option value="gestor">Gestor</option>
                  <option value="atendente">Atendente</option>
                </select>
              ) : (
                <button onClick={() => setEditingRole(u.id)} className="text-[10px] bg-muted px-2 py-1 rounded-full font-medium text-muted-foreground hover:text-foreground transition-colors">
                  {ROLE_LABELS[u.role || 'atendente'] || 'Atendente'}
                </button>
              )}
              <button onClick={() => handleToggleActive(u)} className="p-1 rounded-lg hover:bg-muted transition-colors" title={u.active ? 'Desativar' : 'Reativar'}>
                {u.active ? <UserX className="w-4 h-4 text-muted-foreground" /> : <UserCheck className="w-4 h-4 text-green-500" />}
              </button>
            </div>
            <div className="flex items-center gap-4 pl-12">
              {Object.entries(MODULE_LABELS).map(([mod, label]) => (
                <label key={mod} className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={mods.includes(mod)}
                    onCheckedChange={() => handleToggleModule(u.id, mod)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        );
      })}

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowInvite(false)}>
          <div className="absolute inset-0 bg-foreground/40" />
          <div className="relative bg-card rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Convidar Membro</h3>
              <button onClick={() => setShowInvite(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Nome</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Nome completo" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@exemplo.com" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Senha inicial</label>
                <input type="password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Perfil</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value as AppRole)} className="w-full mt-1 bg-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="atendente">Atendente</option>
                  <option value="gestor">Gestor</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Módulos</label>
                <div className="flex items-center gap-4 mt-2">
                  {Object.entries(MODULE_LABELS).map(([mod, label]) => (
                    <label key={mod} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <Checkbox
                        checked={inviteModules.includes(mod)}
                        onCheckedChange={() => toggleInviteModule(mod)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleInvite} disabled={submitting} className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold disabled:opacity-50 mt-2">
                {submitting ? 'Adicionando...' : 'Adicionar à Equipe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
