import { ReactNode, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Upload
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface IstituzionaleLayoutProps {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

const menuItems = [
  { 
    id: 'scrivania', 
    label: 'Scrivania (Dashboard)', 
    icon: LayoutDashboard, 
    route: '/istituzionale/dashboard' 
  },
  { 
    id: 'anagrafe', 
    label: 'Anagrafe Associazioni', 
    icon: Users, 
    route: '/istituzionale/associazioni' 
  },
  { 
    id: 'trova-bandi', 
    label: 'Trova Bandi', 
    icon: FileText, 
    route: '/istituzionale/bandi' 
  },
  { 
    id: 'bandi', 
    label: 'Gestione Bandi & Avvisi', 
    icon: FileText, 
    route: '/istituzionale/progetti' 
  },
  { 
    id: 'reportistica', 
    label: 'Reportistica Semplificata', 
    icon: BarChart3, 
    route: '/istituzionale/notifiche' 
  },
  { 
    id: 'impostazioni', 
    label: 'Impostazioni', 
    icon: Settings, 
    route: '#' 
  },
];

export const IstituzionaleLayout = ({ children, breadcrumbs = [] }: IstituzionaleLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [enteLogo, setEnteLogo] = useState<string | null>(null);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEnteLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isActive = (route: string) => {
    if (route === '/istituzionale/dashboard') {
      return location.pathname === '/istituzionale/dashboard' || location.pathname === '/istituzionale';
    }
    return location.pathname.startsWith(route) && route !== '#';
  };

  const userName = (profile as { full_name?: string } | null)?.full_name || 'Funzionario';

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Blue Europa */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#003399] flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header - Logo Ente */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {enteLogo ? (
              <img 
                src={enteLogo} 
                alt="Logo Ente" 
                className="w-12 h-12 object-contain rounded-lg bg-white p-1"
              />
            ) : (
              <label className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                <Upload className="w-5 h-5 text-white/70" />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleLogoUpload}
                />
              </label>
            )}
            <div>
              <p className="text-white/60 text-xs">Ente</p>
              <p className="text-white font-bold">HERMES</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-4">
            Menu Principale
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    if (item.route !== '#') {
                      navigate(item.route);
                      setSidebarOpen(false);
                    }
                  }}
                  disabled={item.route === '#'}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                    isActive(item.route)
                      ? "bg-white/15 text-white border-l-4 border-white -ml-1 pl-4"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                    item.route === '#' && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header - Blue Europa */}
        <header className="bg-[#003399] h-16 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 text-white/70 hover:text-white"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div>
              <h1 className="text-white font-bold text-lg">
                <span className="font-bold">HERMES</span> – Terzo Settore
              </h1>
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-1 text-sm text-white/60">
                  <Link to="/istituzionale/dashboard" className="hover:text-white transition-colors">
                    Home
                  </Link>
                  {breadcrumbs.map((crumb, index) => (
                    <span key={index} className="flex items-center gap-1">
                      <ChevronRight className="w-4 h-4" />
                      {crumb.href ? (
                        <Link to={crumb.href} className="hover:text-white transition-colors">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="text-white/80">{crumb.label}</span>
                      )}
                    </span>
                  ))}
                </nav>
              )}
            </div>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-white text-sm font-medium">{userName}</p>
              <p className="text-white/60 text-xs">(Funzionario)</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-white/60 hover:text-white text-sm hidden sm:block"
            >
              | Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
};
