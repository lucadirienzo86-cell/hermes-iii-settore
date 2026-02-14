import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Questo guard deve SOLO proteggere l'accesso (auth),
    // NON deve fare redirect basati sul ruolo.
    // I redirect per ruolo li gestisci con guard dedicati (App/ProLoco/Associazione/Istituzionale)
    // oppure nella signIn flow.
    if (!loading && !user) navigate("/auth");
  }, [user, profile, loading, navigate]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Area protetta generica: consentiamo tutti gli autenticati
  // tranne quelli che hanno aree dedicate (Azienda/Pro Loco).
  if (!user || profile.role === "azienda" || profile.role === "pro_loco") {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
