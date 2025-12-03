import { useState, useEffect } from 'react';
import { RefreshCw, X } from 'lucide-react';

export const PWAUpdatePrompt = () => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) return;

    const handleUpdate = (reg: ServiceWorkerRegistration) => {
      setRegistration(reg);
      setShowUpdatePrompt(true);
    };

    // Listen for service worker updates
    const checkForUpdates = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        
        // Check if there's a waiting worker
        if (reg.waiting) {
          handleUpdate(reg);
        }

        // Listen for new service worker installing
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                handleUpdate(reg);
              }
            });
          }
        });
      } catch (error) {
        // Silent fail - PWA update check failed
      }
    };

    checkForUpdates();

    // Listen for controllerchange to reload when SW takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    setShowUpdatePrompt(false);
  };

  const handleDismiss = () => {
    setShowUpdatePrompt(false);
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[10000] animate-fade-in">
      <div className="bg-primary text-primary-foreground rounded-xl p-4 shadow-lg flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Update Available</p>
          <p className="text-xs opacity-90">A new version of RhinoFit is ready</p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleUpdate}
            className="px-3 py-1.5 bg-primary-foreground text-primary rounded-lg text-sm font-medium 
                       hover:opacity-90 active:scale-95 transition-all"
          >
            Update
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-primary-foreground/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
