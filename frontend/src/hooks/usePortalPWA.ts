import { useEffect, useState } from 'react';

export type PortalType = 'consumer' | 'vendor' | 'rider';

interface PortalConfig {
  manifestUrl: string;
  themeColor: string;
  appTitle: string;
}

const PORTAL_CONFIGS: Record<PortalType, PortalConfig> = {
  consumer: {
    manifestUrl: '/manifest.json',
    themeColor: '#0f0f13',
    appTitle: 'OneMed',
  },
  vendor: {
    manifestUrl: '/manifest-vendor.json',
    themeColor: '#10b981',
    appTitle: 'OneMed Vendor',
  },
  rider: {
    manifestUrl: '/manifest-rider.json',
    themeColor: '#06b6d4',
    appTitle: 'OneMed Rider',
  },
};

export function usePortalPWA(portal: PortalType) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const config = PORTAL_CONFIGS[portal];
    if (!config) return;

    // Dynamically update <link rel="manifest">
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.rel = 'manifest';
      document.head.appendChild(manifestLink);
    }
    manifestLink.href = config.manifestUrl;

    // Dynamically update <meta name="theme-color">
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = config.themeColor;

    // Dynamically update Apple mobile web app title
    let appleTitleMeta = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    if (!appleTitleMeta) {
      appleTitleMeta = document.createElement('meta');
      appleTitleMeta.name = 'apple-mobile-web-app-title';
      document.head.appendChild(appleTitleMeta);
    }
    appleTitleMeta.content = config.appTitle;

    // Track online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [portal]);

  return { isOnline };
}
