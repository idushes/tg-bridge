'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

export function useInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const updateInstalledState = () => {
      const iosNavigator = window.navigator as IOSNavigator;
      setIsInstalled(mediaQuery.matches || iosNavigator.standalone === true);
    };

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallEvent(null);
      setIsInstalled(true);
    };

    updateInstalledState();
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    mediaQuery.addEventListener('change', updateInstalledState);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
      mediaQuery.removeEventListener('change', updateInstalledState);
    };
  }, []);

  const promptInstall = async () => {
    if (!installEvent) {
      return false;
    }

    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === 'accepted') {
      setInstallEvent(null);
      setIsInstalled(true);
      return true;
    }

    return false;
  };

  return {
    canInstall: !!installEvent && !isInstalled,
    isInstalled,
    promptInstall,
  };
}
