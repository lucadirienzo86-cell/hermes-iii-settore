import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedIstituzionaleRouteProps {
  children: ReactNode;
}

/**
 * Guard dedicato per area istituzionale (COMUNE / ASSESSORATO_TERZO_SETTORE).
 * Regola: protegge l'accesso, ma NON "teletrasporta" sempre su /istituzionale,
 * altrimenti rompi la navigazione tra moduli (anagrafe, trova bandi, dettaglio, ecc.).
 */
const ProtectedIstituzionaleRoute = ({ children }: ProtectedIstituzionaleRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/comune/auth');
      return;
    }

    if (!loading && user && profile) {
      const role = profile.role;
      const isIstituzionale = role === 'comune' || role === 'assessorato_terzo_settore';

      if (!isIstituzionale) {
        if (role === 'azienda') navigate('/app/dashboard');
        else if (role === 'pro_loco') navigate('/pro-loco/dashboard');
        else if (role === 'associazione') navigate('/associazione/dashboard');
        else navigate('/dashboard');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const role = profile.role;
  const isIstituzionale = role === 'comune' || role === 'assessorato_terzo_settore';

  if (!user || !isIstituzionale) return null;

  return <>{children}</>;
};

export default ProtectedIstituzionaleRoute;
