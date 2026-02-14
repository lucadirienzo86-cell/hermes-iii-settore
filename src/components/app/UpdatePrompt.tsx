import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';
import { useState } from 'react';

export const UpdatePrompt = () => {
  const { needRefresh, updateServiceWorker } = useServiceWorkerUpdate();
  const [dismissed, setDismissed] = useState(false);

  const showPrompt = needRefresh && !dismissed;

  const handleUpdate = () => {
    updateServiceWorker();
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30 
          }}
          className="fixed bottom-20 left-4 right-4 z-[100] max-w-lg mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">
                  Nuova versione disponibile!
                </h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  Aggiorna per ottenere le ultime funzionalità
                </p>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleUpdate}
                    className="flex-1 bg-primary text-primary-foreground text-sm font-medium py-2 px-4 rounded-xl hover:bg-primary/90 transition-colors"
                  >
                    Aggiorna ora
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
