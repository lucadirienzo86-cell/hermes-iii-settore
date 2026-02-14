import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isDismissed: boolean;
  isIOS: boolean;
  justInstalled: boolean;
  installApp: () => Promise<void>;
  dismissBanner: () => void;
  resetDismiss: () => void;
}

const DISMISS_KEY = 'sonyc_pwa_banner_dismissed';

export const usePWAInstall = (): PWAInstallState => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // Detect iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

  useEffect(() => {
    // Check if already installed (standalone mode)
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone);
    };
    
    checkInstalled();

    // Check localStorage for dismissed state
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setJustInstalled(true);
      setDeferredPrompt(null);
      
      // Reset justInstalled after animation completes
      setTimeout(() => {
        setJustInstalled(false);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setJustInstalled(true);
        
        // Reset justInstalled after animation completes
        setTimeout(() => {
          setJustInstalled(false);
        }, 3000);
      }
      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  }, []);

  const resetDismiss = useCallback(() => {
    setIsDismissed(false);
    localStorage.removeItem(DISMISS_KEY);
  }, []);

  return {
    isInstallable: !!deferredPrompt || isIOS,
    isInstalled,
    isDismissed,
    isIOS,
    justInstalled,
    installApp,
    dismissBanner,
    resetDismiss,
  };
};
