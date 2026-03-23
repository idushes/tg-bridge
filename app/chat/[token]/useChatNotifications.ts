'use client';

import { useEffect, useMemo, useRef } from 'react';

interface UseChatNotificationsOptions {
  token: string;
  currentChatId?: number;
}

function getClientId() {
  const existing = sessionStorage.getItem('tg-bridge-client-id');
  if (existing) {
    return existing;
  }

  const clientId = crypto.randomUUID();
  sessionStorage.setItem('tg-bridge-client-id', clientId);
  return clientId;
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function useChatNotifications({ token, currentChatId }: UseChatNotificationsOptions) {
  const clientId = useMemo(() => {
    if (typeof window === 'undefined') {
      return '';
    }

    return getClientId();
  }, []);

  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      return;
    }

    let cancelled = false;

    const setupPush = async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');

      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      if (Notification.permission !== 'granted' || cancelled) {
        return;
      }

      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const response = await fetch('/api/push/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken: token,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok || cancelled) {
        return;
      }

      const data = await response.json() as { subscriptionId?: string };
      subscriptionIdRef.current = data.subscriptionId ?? null;
    };

    void setupPush();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!clientId) {
      return;
    }

    let interval: number | undefined;

    const sendPresence = async () => {
      if (!subscriptionIdRef.current) {
        return;
      }

      await fetch('/api/push/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteToken: token,
          clientId,
          subscriptionId: subscriptionIdRef.current,
          activeChatId: document.visibilityState === 'visible' ? currentChatId ?? null : null,
        }),
      });
    };

    const clearPresence = async () => {
      await fetch('/api/push/presence', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteToken: token, clientId }),
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void sendPresence();
        return;
      }

      void clearPresence();
    };

    const start = () => {
      void sendPresence();
      interval = window.setInterval(() => {
        void sendPresence();
      }, 20_000);
    };

    start();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', clearPresence);

    return () => {
      if (interval) {
        window.clearInterval(interval);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', clearPresence);
      void clearPresence();
    };
  }, [clientId, currentChatId, token]);
}
