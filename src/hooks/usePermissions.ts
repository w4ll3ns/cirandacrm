import { useUserRole } from '@/hooks/useUserRole';
import { useUserModules, type AppModule } from '@/hooks/useUserModules';

export function usePermissions() {
  const { role, loading: roleLoading } = useUserRole();
  const { modules, loading: modulesLoading } = useUserModules();

  const loading = roleLoading || modulesLoading;
  const isAdmin = role === 'admin';

  const hasModule = (mod: AppModule): boolean => {
    if (isAdmin) return true;
    return modules.includes(mod);
  };

  return {
    loading,
    role,
    modules,
    hasModule,

    // Modules
    canViewCRM: hasModule('crm'),
    canViewCommunities: hasModule('comunidades'),

    // Pipeline
    canEditPipeline: (role === 'admin' || role === 'gestor') && hasModule('crm'),
    canFilterByResponsavel: role === 'admin',

    // Contacts
    canEditContacts: (role === 'admin' || role === 'atendente') && hasModule('crm'),

    // Reports
    canViewReports: role === 'admin',

    // Settings
    canManageSettings: role === 'admin',

    // Opportunity actions
    canMoveEtapa: (role === 'admin' || role === 'gestor') && hasModule('crm'),
    canMarkLost: (role === 'admin' || role === 'gestor') && hasModule('crm'),

    // Flows
    canManageFlows: (role === 'admin' || role === 'gestor') && hasModule('crm'),
    canViewFlows: (role === 'admin' || role === 'gestor') && hasModule('crm'),
    canInterruptFlow: true,
  };
}
