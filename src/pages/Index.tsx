import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Building2, Users, Heart, Briefcase, Wrench, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

const accessButtons = [
  {
    label: "Comune",
    description: "Accesso enti locali",
    icon: Building2,
    path: "/comune/auth",
  },
  {
    label: "Pro Loco",
    description: "Accesso Pro Loco",
    icon: Users,
    path: "/proloco/login",
  },
  {
    label: "Associazioni III Settore",
    description: "Accesso associazioni",
    icon: Heart,
    path: "/associazione/auth",
  },
  {
    label: "Partner",
    description: "Accesso convenzionati",
    icon: Briefcase,
    path: "/login?role=partner",
  },
  {
    label: "Service / Facility",
    description: "Fornitori di servizi",
    icon: Wrench,
    path: "/login?role=service",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Redirect automatico se utente già autenticato
  useEffect(() => {
    if (!loading && user && profile) {
      const role = profile.role;
      if (role === 'azienda') {
        navigate('/app/dashboard', { replace: true });
      } else if (role === 'pro_loco') {
        navigate('/proloco/dashboard', { replace: true });
      } else if (role === 'associazione') {
        navigate('/associazione/dashboard', { replace: true });
      } else if (role === 'comune' || role === 'assessorato_terzo_settore') {
        navigate('/istituzionale/dashboard', { replace: true });
      } else if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  // Mostra loading mentre verifica auth
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003399]"></div>
      </div>
    );
  }

  // Se utente loggato, non mostrare la home (il redirect è in corso)
  if (user && profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#003399]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header blu Europa */}
      <header className="bg-[#003399] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-xl font-bold text-white">H</span>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              HERMES
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-white/80 text-sm">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <a href="mailto:supporto@hermes.gov.it" className="hover:text-white transition-colors">
              Supporto
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10">
          <p className="text-[#003399] text-sm font-medium mb-2 tracking-wider uppercase">
            • <span className="font-bold">HERMES</span> • Governance Terzo Settore
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a1a2e] mb-4 leading-tight">
            Accedi a <span className="text-[#003399] font-bold">HERMES</span>
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Piattaforma istituzionale per la governance del Terzo Settore. 
            Seleziona il tuo profilo per accedere.
          </p>
        </div>

        {/* Card di accesso */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8">
            <h2 className="text-lg font-semibold text-[#1a1a2e] mb-6 text-center">
              Seleziona il tuo profilo
            </h2>
            
            {/* Pulsanti accesso verticali */}
            <div className="flex flex-col gap-3">
              {accessButtons.map((btn) => (
                <Button
                  key={btn.label}
                  variant="outline"
                  onClick={() => navigate(btn.path)}
                  className="h-auto py-4 px-5 flex items-center gap-4 justify-between text-left border-gray-200 hover:bg-[#003399]/5 hover:border-[#003399] text-[#1a1a2e] transition-all duration-200 w-full group rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#003399] group-hover:bg-[#002266] flex items-center justify-center shrink-0 transition-colors duration-200">
                      <btn.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-base">{btn.label}</span>
                      <span className="text-xs text-gray-500">
                        {btn.description}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-[#003399] transition-colors" />
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex items-center gap-8 text-gray-400 text-xs">
          <span>🔒 Accesso sicuro</span>
          <span>🇪🇺 GDPR Compliant</span>
          <span>🏛️ PA Certificato</span>
        </div>
      </main>

      {/* Footer blu Europa */}
      <footer className="bg-[#003399] py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Admin nascosto a sinistra */}
          <button
            onClick={() => navigate('/admin/auth')}
            className="flex items-center gap-2 text-white/30 hover:text-white/60 text-xs transition-colors"
          >
            <Shield className="h-3 w-3" />
            <span>Admin</span>
          </button>

          {/* Link centrali */}
          <div className="flex items-center gap-6 text-sm text-white/70">
            <Link to="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-white/30">|</span>
            <a href="mailto:supporto@hermes.gov.it" className="hover:text-white transition-colors">
              Help Center
            </a>
          </div>

          {/* Copyright a destra */}
          <p className="text-white/50 text-xs">
            © 2025 <span className="font-bold">HERMES</span> Governance. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
