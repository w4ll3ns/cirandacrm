import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, User, Bell } from 'lucide-react';
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
          <TeamManagement />
        </div>
      )}

      {canManageSettings && (
        <div className="bg-card rounded-xl p-4 border border-border">
          <ZapiConfig />
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

  return <div className="p-4">{content}</div>;
}
