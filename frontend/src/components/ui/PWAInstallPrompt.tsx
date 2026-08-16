import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, Check, Share } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setInstalled(true);
      return;
    }

    // Detect iOS
    const ua = window.navigator.userAgent;
    const iosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user dismissed prompt recently
      const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 86400000 * 2) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after 3s for iOS if not already installed
    if (iosDevice && !isStandalone) {
      const timer = setTimeout(() => {
        const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
        if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 86400000 * 3) {
          setShowPrompt(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert('To install OneMed on iPhone/iPad: Tap the Share button in Chrome/Safari, then select "Add to Home Screen" 📲');
      }
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (installed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-16 sm:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 shadow-2xl rounded-2xl bg-bg-surface/95 backdrop-blur-xl border border-primary-500/30 p-4 glow-primary"
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shrink-0 shadow-lg text-white font-bold text-xl">
            <Smartphone className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-content-primary flex items-center gap-1.5 font-head">
                Install OneMed App
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  PWA
                </span>
              </h4>
              <button
                onClick={handleDismiss}
                className="text-content-muted hover:text-content-primary p-1 rounded-lg hover:bg-bg-hover transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-content-secondary mt-1 line-clamp-2">
              Install our high-speed mobile app for instant ordering, order updates, and offline access directly from Chrome!
            </p>

            <div className="flex items-center gap-2 mt-3">
              <Button
                onClick={handleInstallClick}
                size="sm"
                variant="glow"
                className="w-full justify-center text-xs py-1.5 font-semibold"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Install App Now
              </Button>

              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-content-muted hover:text-content-secondary border border-bg-border rounded-lg hover:bg-bg-hover transition-colors whitespace-nowrap"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
