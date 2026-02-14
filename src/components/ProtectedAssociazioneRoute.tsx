import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedAssociazioneRouteProps {
  children: ReactNode;
}

const ProtectedAssociazioneRoute = ({ children }: ProtectedAssociazioneRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/associazione/auth');
    } else if (!loading && user && profile) {
      // If user is not an associazione, redirect to appropriate dashboard
      if (profile.role !== 'associazione') {
        if (profile.role === 'azienda') {
          navigate('/app/dashboard');
        } else if (profile.role === 'pro_loco') {
          navigate('/pro-loco/dashboard');
        } else if (profile.role === 'comune' || profile.role === 'assessorato_terzo_settore') {
          navigate('/istituzionale');
        } else {
          navigate('/dashboard');
        }
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

  if (!user || profile.role !== 'associazione') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedAssociazioneRoute;