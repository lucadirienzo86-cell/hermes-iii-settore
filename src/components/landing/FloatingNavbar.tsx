import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, Check, Share } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const FloatingNavbar = () => {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();

  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-6 left-0 right-0 mx-auto z-50 w-[90%] max-w-5xl"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-card/80 backdrop-blur-xl rounded-full border border-border/50 shadow-lg">
        {/* Logo + PWA Install */}
        <div className="flex items-center gap-1 w-[180px]">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:inline">Sonyc</span>
          </Link>

          {/* PWA Install Button */}
          {(isInstallable || isInstalled) && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full ml-1"
                    onClick={isIOS ? undefined : installApp}
                    disabled={isInstalled}
                  >
                    {isInstalled ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : isIOS ? (
                      <Share className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isInstalled 
                    ? "App installata" 
                    : isIOS 
                      ? "Tocca Condividi → Aggiungi a Home" 
                      : "Installa l'app"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        {/* Nav Links - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-6">
          <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Per Aziende
          </a>
          <a href="#docenti" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Per Docenti
          </a>
          <a href="#deminimis" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            De Minimis
          </a>
          <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Come Funziona
          </a>
        </div>

        {/* CTA Button */}
        <div className="flex items-center justify-end">
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-foreground px-4 min-h-[44px]">
              Accedi
            </Button>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default FloatingNavbar;
