import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerUpdateState {
  needRefresh: boolean;
  updateServiceWorker: () => void;
  offlineReady: boolean;
}

export const useServiceWorkerUpdate = (): ServiceWorkerUpdateState => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if we're in a browser that supports service workers
    if (!('serviceWorker' in navigator)) {
      return;
    }

    const handleControllerChange = () => {
      // When the controlling service worker changes, reload the page
      window.location.reload();
    };

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);

          // Check if there's a waiting service worker
          if (reg.waiting) {
            setNeedRefresh(true);
          }

          // Listen for new service workers
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New content is available
                  setNeedRefresh(true);
                } else if (newWorker.state === 'activated') {
                  // Content is cached for offline use
                  setOfflineReady(true);
                }
              });
            }
          });
        }

        // Listen for controller changes
        navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      } catch (error) {
        console.error('Error registering service worker:', error);
      }
    };

    registerSW();

    // Periodically check for updates (every 60 seconds)
    const intervalId = setInterval(() => {
      if (registration) {
        registration.update().catch(console.error);
      }
    }, 60 * 1000);

    return () => {
      clearInterval(intervalId);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, [registration]);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else {
      // If no waiting worker, just reload
      window.location.reload();
    }
  }, [registration]);

  return {
    needRefresh,
    updateServiceWorker,
    offlineReady,
  };
};
