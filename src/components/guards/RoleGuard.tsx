import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AllowedRole = 'admin' | 'editore' | 'gestore' | 'docente' | 'azienda' | 'gestore_pratiche' | 'comune' | 'assessorato_terzo_settore' | 'associazione' | 'pro_loco' | 'partner' | 'service';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: AllowedRole[];
  loginPath?: string;
}

/**
 * Unified Role Guard:
 * - If not authenticated → redirect to loginPath
 * - If authenticated but wrong role → show Access Denied (NO redirect to home)
 */
const RoleGuard = ({ children, allowedRoles, loginPath = '/auth' }: RoleGuardProps) => {
  const { user, profile, loading, signOut } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to={loginPath} replace />;
  }

  // Profile not loaded yet
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Check if user has allowed role
  const userRole = profile.role;
  const hasAccess = allowedRoles.includes(userRole as AllowedRole) || userRole === 'admin';

  if (!hasAccess) {
    // ACCESS DENIED - DO NOT REDIRECT
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="text-center max-w-md">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Accesso Negato</h1>
          <p className="text-muted-foreground mb-6">
            Non hai i permessi necessari per accedere a questa pagina.
            <br />
            <span className="text-sm">Ruolo attuale: <strong>{userRole}</strong></span>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => window.history.back()}>
              Torna indietro
            </Button>
            <Button onClick={() => signOut()}>
              Esci e cambia account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleGuard;
