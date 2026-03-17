import { useUserRole } from '@/hooks/useUserRole';

export function usePermissions() {
  const { role, loading } = useUserRole();

  return {
    loading,
    role,

    // Pipeline
    canEditPipeline: role === 'admin' || role === 'gestor',
    canFilterByResponsavel: role === 'admin',

    // Contacts
    canEditContacts: role === 'admin' || role === 'atendente',

    // Reports
    canViewReports: role === 'admin',

    // Settings
    canManageSettings: role === 'admin',

    // Opportunity actions
    canMoveEtapa: role === 'admin' || role === 'gestor',
    canMarkLost: role === 'admin' || role === 'gestor',

    // Flows
    canManageFlows: role === 'admin' || role === 'gestor',
    canViewFlows: role === 'admin' || role === 'gestor',
    canInterruptFlow: true, // all authenticated users
  };
}
