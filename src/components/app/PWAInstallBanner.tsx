import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, X, Download, Share, Plus } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { Button } from '@/components/ui/button';

export const PWAInstallBanner = () => {
  const { isInstallable, isInstalled, isDismissed, isIOS, installApp, dismissBanner } = usePWAInstall();

  // Don't show if already installed, dismissed, or not installable
  if (isInstalled || isDismissed || !isInstallable) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-5 shadow-lg border border-primary/20"
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        
        {/* Close button */}
        <button
          onClick={dismissBanner}
          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label="Chiudi banner"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
            >
              <Smartphone className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Installa Sonyc
              </h3>
              <p className="text-sm text-white/80">
                Accesso rapido dalla tua home
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-white/90 mb-4 leading-relaxed">
            Aggiungi l'app alla schermata home per accedere più velocemente ai tuoi bandi e agevolazioni!
          </p>

          {isIOS ? (
            // iOS Instructions
            <div className="space-y-3">
              <div className="bg-white/15 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm text-white">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</div>
                  <span>Tocca</span>
                  <Share className="w-4 h-4" />
                  <span>Condividi in basso</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</div>
                  <span>Seleziona</span>
                  <Plus className="w-4 h-4" />
                  <span>"Aggiungi a Home"</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-white">
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</div>
                  <span>Conferma toccando "Aggiungi"</span>
                </div>
              </div>
              <Button
                onClick={dismissBanner}
                className="w-full bg-white text-primary hover:bg-white/90 font-semibold rounded-xl h-11"
              >
                ✓ Ho capito
              </Button>
            </div>
          ) : (
            // Android/Chrome Install Button
            <Button
              onClick={installApp}
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold rounded-xl h-11 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              Installa l'app
            </Button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
