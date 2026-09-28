import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineBannerProps {
  portalName?: string;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ portalName }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 text-black px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
            <span>
              <strong>Offline Mode:</strong> No internet connection. {portalName ? `${portalName} is` : "You're"} running from local cache.
            </span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-1 px-2.5 py-1 bg-black/20 hover:bg-black/30 rounded text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-emerald-600/95 text-white px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 shadow-lg backdrop-blur-md"
        >
          <Wifi className="w-4 h-4 shrink-0" />
          <span>Connection restored. Back online!</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
