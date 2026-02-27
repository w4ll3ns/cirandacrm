import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { usuario } = useAuth();
  const perfil = usuario?.perfil;

  return {
    // Pipeline
    canEditPipeline: perfil === 'admin' || perfil === 'comercial',
    canFilterByResponsavel: perfil === 'admin',

    // Contacts
    canEditContacts: perfil === 'admin' || perfil === 'secretaria',

    // Reports
    canViewReports: perfil === 'admin',

    // Settings
    canManageSettings: perfil === 'admin',

    // Opportunity actions
    canMoveEtapa: perfil === 'admin' || perfil === 'comercial',
    canMarkLost: perfil === 'admin' || perfil === 'comercial',
  };
}
