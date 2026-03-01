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
  Upload,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface IstituzionaleLayoutProps {
  children: ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}

const menuSections = [
  {
    label: 'GESTIONE ALBO',
    items: [
      { id: 'scrivania', label: 'Scrivania', icon: LayoutDashboard, route: '/istituzionale/dashboard' },
      { id: 'anagrafe', label: 'Anagrafe Associazioni', icon: Users, route: '/istituzionale/associazioni' },
    ],
  },
  {
    label: 'BANDI & FONDI',
    items: [
      { id: 'trova-bandi', label: 'Bandi per Associazioni', icon: FileText, route: '/istituzionale/bandi' },
      { id: 'bandi-comune', label: 'Bandi per il Comune', icon: Globe, route: '/istituzionale/bandi-comune' },
      { id: 'bandi', label: 'Gestione Bandi & Avvisi', icon: FileText, route: '/istituzionale/progetti' },
    ],
  },
  {
    label: 'REPORTISTICA',
    items: [
      { id: 'reportistica', label: 'Reportistica', icon: BarChart3, route: '/istituzionale/notifiche' },
    ],
  },
  {
    label: 'SISTEMA',
    items: [
      { id: 'impostazioni', label: 'Impostazioni', icon: Settings, route: '#' },
    ],
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — dark teal */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#0D3D3D] flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header — Logo Ente */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {enteLogo ? (
              <img
                src={enteLogo}
                alt="Logo Ente"
                className="w-10 h-10 object-contain rounded-lg bg-white p-1"
              />
            ) : (
              <label className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                <Upload className="w-4 h-4 text-white/60" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </label>
            )}
            <div>
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Piattaforma</p>
              <p className="text-white font-bold text-base leading-tight">HERMES</p>
              <p className="text-white/50 text-[10px]">Terzo Settore</p>
            </div>
          </div>
        </div>

        {/* Menu con sezioni */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-5">
          {menuSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-2">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => (
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
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                        isActive(item.route)
                          ? "bg-[#14B8A6]/20 text-white border-l-2 border-[#14B8A6] pl-[10px]"
                          : "text-white/60 hover:bg-white/8 hover:text-white",
                        item.route === '#' && "opacity-40 cursor-not-allowed"
                      )}
                    >
                      <item.icon className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive(item.route) ? "text-[#14B8A6]" : "text-white/50"
                      )} />
                      <span className="font-medium">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-[#14B8A6]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#14B8A6] text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userName}</p>
              <p className="text-white/40 text-[10px]">Funzionario comunale</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:bg-white/8 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 text-sm text-gray-500">
                <Link to="/istituzionale/dashboard" className="hover:text-gray-800 transition-colors font-medium">
                  Home
                </Link>
                {breadcrumbs.map((crumb, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    {crumb.href ? (
                      <Link to={crumb.href} className="hover:text-gray-800 transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-gray-800 font-medium">{crumb.label}</span>
                    )}
                  </span>
                ))}
              </nav>
            )}
          </div>

          {/* User badge */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 rounded-full bg-[#0D9488] flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700">{userName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
