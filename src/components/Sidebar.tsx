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
  Moon,
  Sun,
  Settings,
  Sparkles,
  User,
  MessageSquare,
  Heart,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

// ─── Menu Admin ────────────────────────────────────────────────────────────────
const adminMenuSections = [
  {
    title: "Amministrazione",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",          path: "/admin/dashboard" },
      { icon: Users,           label: "Utenti",             path: "/utenti" },
      { icon: MessageSquare,   label: "Richieste Contatto", path: "/richieste-contatto" },
      { icon: Settings,        label: "Opzioni Sistema",    path: "/admin/opzioni" },
    ],
  },
  {
    title: "Aziende & Finanziamenti",
    items: [
      { icon: Building2,     label: "Aziende",           path: "/aziende" },
      { icon: ClipboardList, label: "Pratiche",           path: "/pratiche" },
      { icon: Network,       label: "Incroci",            path: "/incroci" },
      { icon: Search,        label: "Ricerca Imprese",    path: "/ricerca-imprese" },
      { icon: Upload,        label: "Import Fondimpresa", path: "/admin/fondimpresa-import" },
    ],
  },
  {
    title: "Formazione",
    items: [
      { icon: GraduationCap, label: "Fondi Formativi", path: "/fondi" },
      { icon: Users,         label: "Docenti",         path: "/docenti" },
    ],
  },
  {
    title: "Terzo Settore",
    items: [
      { icon: Heart,       label: "Scrivania",         path: "/istituzionale/dashboard" },
      { icon: ShieldCheck, label: "Import Bandi Edit.", path: "/bandi" },
    ],
  },
];

// ─── Menu Comune / Assessorato ─────────────────────────────────────────────────
const comuneMenuSections = [
  {
    title: "Terzo Settore",
    items: [
      { icon: LayoutDashboard, label: "Scrivania",              path: "/istituzionale" },
      { icon: Heart,           label: "Anagrafe Associazioni",  path: "/istituzionale/associazioni" },
      { icon: FileText,        label: "Trova Bandi",            path: "/istituzionale/bandi" },
    ],
  },
];

// ─── Menu Gestore / Professionista ─────────────────────────────────────────────
const gestoreMenuSections = [
  {
    title: "Gestione",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",        path: "/dashboard" },
      { icon: Building2,       label: "Aziende",          path: "/aziende" },
      { icon: ClipboardList,   label: "Pratiche",         path: "/pratiche" },
      { icon: GraduationCap,   label: "Fondi Formativi",  path: "/fondi" },
      { icon: Network,         label: "Incroci",          path: "/incroci" },
      { icon: Search,          label: "Ricerca Imprese",  path: "/ricerca-imprese" },
    ],
  },
  {
    title: "",
    items: [
      { icon: FileText, label: "Trova Bandi", path: "/trova-bandi" },
      { icon: User,     label: "Profilo",     path: "/profilo-gestore" },
    ],
  },
];

// ─── Menu Editore ──────────────────────────────────────────────────────────────
const editoreMenuSections = [
  {
    title: "Editore",
    items: [
      { icon: FileText,  label: "Finanza Agevolata", path: "/bandi" },
      { icon: Upload,    label: "Import Fondimpresa", path: "/admin/fondimpresa-import" },
      { icon: Settings,  label: "Opzioni Sistema",   path: "/admin/opzioni" },
    ],
  },
];

// ─── Menu Docente ──────────────────────────────────────────────────────────────
const docenteMenuSections = [
  {
    title: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",          path: "/dashboard" },
      { icon: Sparkles,        label: "Avvisi Compatibili", path: "/docente-matching" },
      { icon: FileText,        label: "Trova Bandi",        path: "/trova-bandi" },
      { icon: User,            label: "Il mio profilo",     path: "/profilo-docente" },
    ],
  },
];

// ─── Menu Gestore Pratiche ─────────────────────────────────────────────────────
const gestorePraticheMenuSections = [
  {
    title: "",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
      { icon: ClipboardList,   label: "Pratiche",  path: "/pratiche" },
      { icon: Building2,       label: "Aziende",   path: "/aziende" },
      { icon: User,            label: "Profilo",   path: "/profilo-gestore-pratiche" },
    ],
  },
];

// ─── Sidebar Component ─────────────────────────────────────────────────────────
const Sidebar = () => {
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { theme, setTheme } = useTheme();

  const menuSections =
    profile?.role === 'admin'                       ? adminMenuSections
    : profile?.role === 'editore'                   ? editoreMenuSections
    : profile?.role === 'gestore'                   ? gestoreMenuSections
    : profile?.role === 'gestore_pratiche'          ? gestorePraticheMenuSections
    : profile?.role === 'comune' ||
      profile?.role === 'assessorato_terzo_settore' ? comuneMenuSections
    : docenteMenuSections;

  const roleLabel =
    profile?.role === 'admin'                        ? 'Admin'
    : profile?.role === 'editore'                    ? 'Editore'
    : profile?.role === 'gestore'                    ? 'Professionista'
    : profile?.role === 'gestore_pratiche'           ? 'Gestore Pratiche'
    : profile?.role === 'comune'                     ? 'Comune'
    : profile?.role === 'assessorato_terzo_settore'  ? 'Assessorato Terzo Settore'
    : 'Docente';

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

      <nav className="px-3 space-y-6 flex-1 overflow-y-auto pb-4">
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
                const isActive =
                  item.path === '/istituzionale'
                    ? location.pathname === '/istituzionale' || location.pathname === '/istituzionale/dashboard'
                    : location.pathname === item.path ||
                      (item.path !== '/dashboard' && location.pathname.startsWith(item.path + '/'));

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
                    <Icon className="h-4 w-4 flex-shrink-0" />
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
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? (
            <><Sun className="h-4 w-4" /><span>Tema Chiaro</span></>
          ) : (
            <><Moon className="h-4 w-4" /><span>Tema Scuro</span></>
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
