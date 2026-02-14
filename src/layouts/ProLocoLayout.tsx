import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  FileText, 
  Send, 
  CreditCard,
  LogOut,
  Home,
  Settings,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProLocoLayoutProps {
  children: ReactNode;
}

const ProLocoLayout = ({ children }: ProLocoLayoutProps) => {
  const { signOut, profile } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/pro-loco/dashboard', label: 'Dashboard', icon: Home },
    { path: '/pro-loco/profilo', label: 'Profilo', icon: Building2 },
    { path: '/pro-loco/associazioni', label: 'Associazioni', icon: Users },
    { path: '/pro-loco/inviti', label: 'Inviti', icon: Send },
    { path: '/trova-bandi', label: 'Trova Bandi', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/pro-loco/dashboard" className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">Pro Loco</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {profile?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden border-b bg-card px-4 py-2 overflow-x-auto">
        <div className="flex gap-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
};

export default ProLocoLayout;
