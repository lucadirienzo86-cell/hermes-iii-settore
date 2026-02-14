import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, BellRing, CheckCircle2 } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { HersButton } from './HersButton';

const DISMISS_KEY = 'sonyc_push_prompt_dismissed';

export const PushNotificationPrompt = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isSupported, isSubscribed, permission, subscribe, isLoading } = usePushNotifications();

  useEffect(() => {
    // Show prompt after a delay if not subscribed and not dismissed
    const dismissed = localStorage.getItem(DISMISS_KEY);
    const shouldShow = isSupported && !isSubscribed && permission !== 'denied' && dismissed !== 'true';

    if (shouldShow) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, isSubscribed, permission]);

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
        setShowSuccess(false);
      }, 2000);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-20 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          {/* Header gradient */}
          <div className="bg-gradient-to-r from-primary to-primary/80 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <BellRing className="w-5 h-5" />
              <span className="font-semibold">Attiva le notifiche</span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {showSuccess ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center py-4 gap-3"
              >
                <CheckCircle2 className="w-12 h-12 text-success" />
                <p className="font-medium text-foreground">Notifiche attivate!</p>
              </motion.div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Ricevi una notifica quando ci sono nuovi bandi o avvisi compatibili con la tua azienda. Non perderti nessuna opportunità!
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Dopo
                  </button>
                  <HersButton
                    onClick={handleSubscribe}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    {isLoading ? 'Attivando...' : 'Attiva'}
                  </HersButton>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
