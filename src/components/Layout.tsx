import { Outlet, useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import BottomNav from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';

export default function Layout() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold leading-tight">Ciranda ABC</h1>
          <p className="text-[11px] opacity-80">{usuario?.nome} · {usuario?.perfil === 'admin' ? 'Admin' : usuario?.perfil === 'secretaria' ? 'Secretaria' : 'Comercial'}</p>
        </div>
        <button
          onClick={() => navigate('/app/configuracoes')}
          className="w-9 h-9 rounded-full bg-primary-foreground/15 flex items-center justify-center"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
