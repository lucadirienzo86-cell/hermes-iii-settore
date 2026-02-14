import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, ClipboardList, Home, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageTransition } from '@/components/app/PageTransition';
import { SplashScreen } from '@/components/app/SplashScreen';
import { OfflineIndicator } from '@/components/app/OfflineIndicator';
import { PushNotificationPrompt } from '@/components/app/PushNotificationPrompt';
import { UpdatePrompt } from '@/components/app/UpdatePrompt';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  customHeader?: ReactNode;
}

export const AppLayout = ({ children, title, showBack = false, customHeader }: AppLayoutProps) => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash only on first load in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const hasShownSplash = sessionStorage.getItem('sonyc_splash_shown');
    return isStandalone && !hasShownSplash;
  });

  useEffect(() => {
    if (showSplash) {
      sessionStorage.setItem('sonyc_splash_shown', 'true');
    }
  }, [showSplash]);

  const navItems = [
    { path: '/app/dashboard', icon: Home, label: 'Home' },
    { path: '/app/fondi', icon: Wallet, label: 'Fondi' },
    { path: '/app/pratiche', icon: ClipboardList, label: 'Pratiche' },
  ];

  return (
    <>
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <OfflineIndicator />
      <PushNotificationPrompt />
      <UpdatePrompt />
      <div className="min-h-screen bg-background">
      {/* App Container */}
      <div className="max-w-lg mx-auto bg-background min-h-screen flex flex-col relative">
        {/* Header - Hers style: clean and minimal */}
        {customHeader ? (
          customHeader
        ) : (
          <header className="bg-background sticky top-0 z-40 px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 w-12">
                {showBack && (
                  <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-foreground" />
                  </button>
                )}
              </div>
              
              <div className="flex-1 flex justify-center">
                <span className="text-lg font-bold text-foreground tracking-tight">Sonyc</span>
              </div>
              
              <div className="w-12 flex justify-end">
                <button
                  onClick={() => navigate('/app/profilo')}
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
                >
                  <User className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* Main Content with Page Transition */}
        <main className="flex-1 px-5 py-4 pb-24">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              {title && (
                <motion.h1 
                  className="text-2xl font-bold text-foreground mb-6"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  {title}
                </motion.h1>
              )}
              {children}
            </PageTransition>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation - Hers style */}
        <nav className="bottom-nav max-w-lg mx-auto z-50">
          <div className="flex justify-around items-center h-16 relative">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                (item.path === '/app/dashboard' && location.pathname === '/app') ||
                (item.path === '/app/fondi' && location.pathname.startsWith('/app/fondi'));
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "bottom-nav-item relative flex-1 h-full",
                    isActive && "active"
                  )}
                >
                  {isActive && (
                    <span className="bottom-nav-indicator" />
                  )}
                  <Icon className={cn(
                    "nav-icon w-6 h-6 transition-transform duration-200",
                    isActive && "text-primary"
                  )} />
                  <span className={cn(
                    "text-[11px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
    </>
  );
};
