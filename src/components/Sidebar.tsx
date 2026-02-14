import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Network,
  LogOut,
  Building2,
  Upload,
  Search,
  GraduationCap,
  Landmark,
  Moon,
  Sun,
  Settings,
  Sparkles,
  User,
  MessageSquare,
  Heart
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

// Menu per Admin - solo funzionalità Fase 1
const adminMenuSections = [
  {
    title: "Amministrazione",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: Users, label: "Utenti", path: "/utenti" },
      { icon: Heart, label: "Terzo Settore", path: "/terzo-settore" },
      { icon: Settings, label: "Opzioni Sistema", path: "/admin/opzioni" },
    ]
  }
];

// Menu per Comune/Assessorato Terzo Settore
const comuneMenuSections = [
  {
    title: "Terzo Settore",
    items: [
      { icon: LayoutDashboard, label: "Scrivania", path: "/istituzionale" },
      { icon: Heart, label: "Anagrafe Associazioni", path: "/anagrafe-associazioni" },
      { icon: FileText, label: "Trova Bandi", path: "/trova-bandi" },
    ]
  }
];

// Menu per Gestore/Professionista - solo consultazione
const gestoreMenuSections = [
  {
    title: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: User, label: "Profilo", path: "/profilo-gestore" },
      { icon: FileText, label: "Trova Bandi", path: "/trova-bandi" },
    ]
  }
];

// Menu per Editore - gestione contenuti bandi
const editoreMenuSections = [
  {
    title: "Editore",
    items: [
      { icon: FileText, label: "Finanza Agevolata", path: "/bandi" },
      { icon: Settings, label: "Opzioni Sistema", path: "/admin/opzioni" },
    ]
  }
];

// Menu per Docente - solo consultazione in Fase 1
const docenteMenuSections = [
  {
    title: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: User, label: "Il mio profilo", path: "/profilo-docente" },
      { icon: FileText, label: "Trova Bandi", path: "/trova-bandi" },
    ]
  }
];

// Menu per Gestore Pratiche - limitato in Fase 1
const gestorePraticheMenuSections = [
  {
    title: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: User, label: "Il mio profilo", path: "/profilo-gestore-pratiche" },
      { icon: FileText, label: "Trova Bandi", path: "/trova-bandi" },
    ]
  }
];

const Sidebar = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { theme, setTheme } = useTheme();

  const menuSections = profile?.role === 'admin' 
    ? adminMenuSections 
    : profile?.role === 'editore'
    ? editoreMenuSections
    : profile?.role === 'gestore' 
    ? gestoreMenuSections
    : profile?.role === 'gestore_pratiche'
    ? gestorePraticheMenuSections
    : profile?.role === 'comune' || profile?.role === 'assessorato_terzo_settore'
    ? comuneMenuSections
    : docenteMenuSections;

  const roleLabel = profile?.role === 'admin' 
    ? 'Admin' 
    : profile?.role === 'editore'
    ? 'Editore'
    : profile?.role === 'gestore' 
    ? 'Professionista'
    : profile?.role === 'gestore_pratiche'
    ? 'Gestore Pratiche'
    : profile?.role === 'comune'
    ? 'Comune'
    : profile?.role === 'assessorato_terzo_settore'
    ? 'Assessorato Terzo Settore'
    : 'Docente';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="w-64 min-h-screen bg-sidebar-dark border-r border-sidebar-border flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-sidebar-foreground">Sonyc</span>
        </div>
        {profile && (
          <p className="text-xs text-sidebar-muted mt-3 uppercase tracking-wider font-medium">
            {roleLabel}
          </p>
        )}
      </div>

      <nav className="px-3 space-y-6 flex-1">
        {menuSections.map((section, idx) => (
          <div key={section.title || idx}>
            {section.title && (
              <h3 className="px-3 mb-2 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="h-4 w-4" />
              <span>Tema Chiaro</span>
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              <span>Tema Scuro</span>
            </>
          )}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sm text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Esci</span>
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;