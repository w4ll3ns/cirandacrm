import { Outlet, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import BottomNav from './BottomNav';
import AppSidebar from './AppSidebar';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function Layout() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="min-h-screen bg-muted flex flex-col">
        <header className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Dezenas CRM" className="w-8 h-8 object-contain rounded-lg" />
            <div>
              <h1 className="text-base font-bold leading-tight">Dezenas CRM</h1>
              <p className="text-[11px] opacity-80">{usuario?.nome} · {usuario?.perfil === 'admin' ? 'Admin' : usuario?.perfil === 'atendente' ? 'Atendente' : 'Gestor'}</p>
            </div>
          </div>
          <button onClick={() => navigate('/app/configuracoes')} className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </button>
        </header>
        <main className="flex-1 pb-20 overflow-y-auto">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-card flex items-center px-4 gap-3 shrink-0">
            <SidebarTrigger />
            <GlobalSearch />
            <div className="flex-1" />
            <p className="text-sm text-muted-foreground">{usuario?.nome} · <span className="capitalize">{usuario?.perfil}</span></p>
          </header>
          <main className="flex-1 overflow-y-auto bg-muted">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
