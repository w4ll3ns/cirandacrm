import { Home, Kanban, MessageCircle, Users, CheckSquare } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';

const tabs = [
  { path: '/app', icon: Home, label: 'Início' },
  { path: '/app/pipeline', icon: Kanban, label: 'Pipeline' },
  { path: '/app/conversas', icon: MessageCircle, label: 'Conversas' },
  { path: '/app/contatos', icon: Users, label: 'Contatos' },
  { path: '/app/tarefas', icon: CheckSquare, label: 'Tarefas' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { conversas, tarefas } = useData();
  const { usuario } = useAuth();

  const unread = conversas.filter(c => c.status === 'nao_lida' &&
    (usuario?.perfil === 'admin' || c.assigned_user_id === usuario?.id)).length;
  const overdue = tarefas.filter(t => t.status === 'pendente' && t.due_date && new Date(t.due_date) < new Date() &&
    (usuario?.perfil === 'admin' || t.responsavel_interno_id === usuario?.id)).length;

  const isActive = (path: string) => {
    if (path === '/app') return location.pathname === '/app';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          const badge = label === 'Conversas' ? unread : label === 'Tarefas' ? overdue : 0;
          return (
            <button key={path} onClick={() => navigate(path)} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors relative ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
