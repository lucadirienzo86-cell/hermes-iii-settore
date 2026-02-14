import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedAppRouteProps {
  children: ReactNode;
}

const ProtectedAppRoute = ({ children }: ProtectedAppRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[ProtectedAppRoute] State:', { 
      loading, 
      hasUser: !!user, 
      userId: user?.id,
      profileRole: profile?.role 
    });
    
    if (!loading && user && profile) {
      // Profile loaded - check role
      if (profile.role !== 'azienda') {
        console.log('[ProtectedAppRoute] User role is not azienda, redirecting to /dashboard');
        navigate('/dashboard');
      } else {
        console.log('[ProtectedAppRoute] Access granted for azienda user');
      }
    } else if (!loading && !user) {
      // No user - redirect to auth
      console.log('[ProtectedAppRoute] No user, redirecting to /app/auth');
      navigate('/app/auth');
    }
    // If loading or profile not loaded yet, wait
  }, [user, profile, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user || profile.role !== 'azienda') {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedAppRoute;
