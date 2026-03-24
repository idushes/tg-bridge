'use client';

import { useEffect, useState } from 'react';
import type { ChatMeta } from '@/lib/types';

interface UseLiveChatsOptions {
  token: string;
  initialChats: ChatMeta[];
}

export function useLiveChats({ token, initialChats }: UseLiveChatsOptions) {
  const [liveChats, setLiveChats] = useState(initialChats);

  useEffect(() => {
    setLiveChats(initialChats);
  }, [initialChats]);

  useEffect(() => {
    let cancelled = false;

    const syncChats = async () => {
      try {
        const response = await fetch(`/api/chats?inviteToken=${token}&t=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok || cancelled) {
          return;
        }

        const data = await response.json() as { chats: ChatMeta[] };
        if (!cancelled) {
          setLiveChats(data.chats);
        }
      } catch {
        // ignore chat list sync failures
      }
    };

    void syncChats();
    const interval = window.setInterval(() => {
      void syncChats();
    }, 2500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncChats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [token]);

  return { liveChats, setLiveChats };
}
