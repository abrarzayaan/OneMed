import React, { useEffect, useState } from 'react';
import { Download, X, Store, Check, Share2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const VendorPWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
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

      const dismissedTime = localStorage.getItem('pwa_vendor_dismissed');
      // Show if not dismissed within last 2 days
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 86400000 * 2) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show after 2.5s for iOS if not dismissed
    if (iosDevice && !isStandalone) {
      const timer = setTimeout(() => {
        const dismissedTime = localStorage.getItem('pwa_vendor_dismissed');
        if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 86400000 * 2) {
          setShowPrompt(true);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        alert(
          'To install OneMed Vendor App on iOS:\n1. Tap the Share button in Safari/Chrome (icon with arrow)\n2. Scroll down and tap "Add to Home Screen" 📲'
        );
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
    localStorage.setItem('pwa_vendor_dismissed', Date.now().toString());
  };

  if (installed || !showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 left-3 sm:left-auto sm:w-[420px] z-50 rounded-2xl bg-[#12141c]/95 backdrop-blur-xl border border-emerald-500/30 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_20px_rgba(16,185,129,0.15)]"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 text-white">
            <Store className="w-6 h-6" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="text-sm font-bold text-white tracking-tight">
                  OneMed Partner Portal
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Vendor PWA
                </span>
              </div>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
              Install the partner app for real-time order alerts, lightning-fast inventory updates, and full offline caching.
            </p>

            <div className="flex items-center gap-2 mt-3.5">
              <button
                onClick={handleInstallClick}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs py-2 px-3.5 rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                {isIOS ? (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    How to Install (iOS)
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Install Partner App
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-xs text-gray-400 hover:text-gray-200 border border-gray-700/60 rounded-xl hover:bg-white/5 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
