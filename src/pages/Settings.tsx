import { useNavigate } from 'react-router-dom';
import { LogOut, User, Bell, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { usePermissions } from '@/hooks/usePermissions';
import TeamManagement from '@/components/TeamManagement';
import ZapiConfig from '@/components/ZapiConfig';

export default function Settings() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { canManageSettings } = usePermissions();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isMobile) {
    return (
      <div className="p-4 space-y-4">
        <ProfileCard usuario={usuario} />
        <AboutCard />
        {canManageSettings && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <TeamManagement />
          </div>
        )}
        {canManageSettings && (
          <div className="bg-card rounded-xl p-4 border border-border">
            <ZapiConfig />
          </div>
        )}
        <NotificationsCard />
        <LogoutButton onClick={handleLogout} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seu perfil, equipe e integrações</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Row 1: Profile + About */}
        <ProfileCard usuario={usuario} />
        <AboutCard />

        {/* Row 2: Team (full width) */}
        {canManageSettings && (
          <div className="col-span-2 bg-card rounded-xl p-6 border border-border">
            <TeamManagement />
          </div>
        )}

        {/* Row 3: Z-API (full width) */}
        {canManageSettings && (
          <div className="col-span-2 bg-card rounded-xl p-6 border border-border">
            <ZapiConfig />
          </div>
        )}

        {/* Row 4: Notifications + Logout */}
        <NotificationsCard />
        <div className="flex items-end">
          <LogoutButton onClick={handleLogout} />
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ usuario }: { usuario: any }) {
  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
        <User className="w-3.5 h-3.5" /> Perfil
      </h3>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-7 h-7 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold truncate">{usuario?.nome}</p>
          <p className="text-sm text-muted-foreground truncate">{usuario?.email}</p>
          <p className="text-xs text-primary font-medium mt-0.5 capitalize">{usuario?.perfil}</p>
        </div>
      </div>
    </div>
  );
}

function AboutCard() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-3">
        <span className="text-primary-foreground font-black text-lg">H</span>
      </div>
      <p className="text-sm font-semibold">Centro Educacional Hora de Aprender</p>
      <p className="text-xs text-muted-foreground mt-1">CRM Hora de Aprender · v2.0</p>
      <p className="text-[10px] text-muted-foreground/50 mt-1">Desenvolvido por WS Soluções Digitais</p>
    </div>
  );
}

function NotificationsCard() {
  return (
    <div className="bg-card rounded-xl p-6 border border-border">
      <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
        <Bell className="w-3.5 h-3.5" /> Notificações
      </h3>
      <p className="text-sm text-muted-foreground">As notificações push serão configuradas na versão de produção.</p>
    </div>
  );
}

function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-destructive/10 text-destructive rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-destructive/20 transition-colors"
    >
      <LogOut className="w-4 h-4" /> Sair
    </button>
  );
}
