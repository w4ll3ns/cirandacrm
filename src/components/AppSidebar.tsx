import { Home, Kanban, MessageCircle, Users, CheckSquare, Settings, LogOut, Workflow, Users2, Megaphone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { usePermissions } from '@/hooks/usePermissions';
import { NavLink } from '@/components/NavLink';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
  SidebarSeparator, useSidebar,
} from '@/components/ui/sidebar';

const navItems = [
  { path: '/app', icon: Home, label: 'Início', end: true },
  { path: '/app/pipeline', icon: Kanban, label: 'Pipeline' },
  { path: '/app/conversas', icon: MessageCircle, label: 'Conversas' },
  { path: '/app/contatos', icon: Users, label: 'Contatos' },
  { path: '/app/tarefas', icon: CheckSquare, label: 'Tarefas' },
];

export default function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { usuario, logout } = useAuth();
  const { conversas = [], tarefas = [] } = useData();
  const { canManageFlows } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const unread = conversas.filter(c => c.status === 'nao_lida' &&
    (usuario?.perfil === 'admin' || c.assigned_user_id === usuario?.id)).length;
  const overdue = tarefas.filter(t => t.status === 'pendente' && t.due_date && new Date(t.due_date) < new Date() &&
    (usuario?.perfil === 'admin' || t.responsavel_interno_id === usuario?.id)).length;

  const getBadge = (label: string) => {
    if (label === 'Conversas' && unread > 0) return unread;
    if (label === 'Tarefas' && overdue > 0) return overdue;
    return 0;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-2">
          <img src="/logo.png" alt="Hora de Aprender" className="w-9 h-9 rounded-xl object-contain shrink-0" />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">Hora de Aprender</p>
              <p className="text-[10px] text-muted-foreground truncate">CRM Escolar</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {[...navItems, ...(canManageFlows ? [{ path: '/app/fluxos', icon: Workflow, label: 'Fluxos' }, { path: '/app/comunidades', icon: Users2, label: 'Comunidades' }, { path: '/app/campanhas', icon: Megaphone, label: 'Campanhas' }] : [])].map(item => {
                const badge = getBadge(item.label);
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton asChild isActive={item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)}>
                      <NavLink to={item.path} end={item.end} className="flex items-center gap-2" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && <span className="flex-1">{item.label}</span>}
                        {!collapsed && badge > 0 && (
                          <span className="bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                            {badge > 99 ? '99+' : badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === '/app/configuracoes'}>
              <NavLink to="/app/configuracoes" className="flex items-center gap-2" activeClassName="bg-sidebar-accent">
                <Settings className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Configurações</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="px-2 py-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
              {usuario?.nome?.charAt(0) || '?'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{usuario?.nome}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{usuario?.perfil}</p>
              </div>
            )}
            {!collapsed && (
              <button onClick={handleLogout} className="p-1.5 rounded-md hover:bg-sidebar-accent text-muted-foreground" title="Sair">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
