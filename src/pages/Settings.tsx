import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, WifiOff, User, Shield, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';
import { useProfiles } from '@/hooks/useProfiles';
import { toast } from 'sonner';

export default function Settings() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canManageSettings } = usePermissions();
  const { profiles } = useProfiles();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const content = (
    <div className="space-y-4">
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{usuario?.nome}</p>
            <p className="text-sm text-muted-foreground">{usuario?.email}</p>
            <p className="text-xs text-primary font-medium mt-0.5 capitalize">{usuario?.perfil}</p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 border border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-3">
          <span className="text-primary-foreground font-black text-xl">H</span>
        </div>
        <p className="text-sm font-semibold">Centro Educacional Hora de Aprender</p>
        <p className="text-xs text-muted-foreground">CRM Hora de Aprender · v2.0</p>
        <p className="text-[10px] text-muted-foreground/50 mt-1">Desenvolvido por WS Soluções Digitais</p>
      </div>

      {canManageSettings && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Equipe
          </h3>
          {profiles.filter(p => p.active).map(u => (
            <div key={u.id} className="py-2 flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium">{u.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{u.role || 'atendente'}</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-success" />
            </div>
          ))}
        </div>
      )}

      {canManageSettings && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Integrações</h3>
          <div className="space-y-3">
            {[{ name: 'WhatsApp API' }, { name: 'Webhooks' }].map(({ name }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <WifiOff className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">Não conectado</p>
                  </div>
                </div>
                <button onClick={() => toast.info('Funcionalidade disponível em breve')} className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                  Configurar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
          <Bell className="w-3.5 h-3.5" /> Notificações
        </h3>
        <p className="text-sm text-muted-foreground">As notificações push serão configuradas na versão de produção.</p>
      </div>

      <button onClick={handleLogout} className="w-full bg-destructive/10 text-destructive rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2">
        <LogOut className="w-4 h-4" /> Sair
      </button>
    </div>
  );

  if (!isMobile) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-lg font-bold mb-6">Configurações</h1>
        <div className="md:grid md:grid-cols-2 md:gap-4">{content}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-primary text-primary-foreground px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1"><ArrowLeft className="w-5 h-5" /></button>
        <p className="font-semibold">Configurações</p>
      </div>
      <div className="p-4">{content}</div>
    </div>
  );
}
