'use client';

import { useEffect, useRef } from 'react';
import type { ChatMeta } from '@/lib/types';

interface UseChatNotificationsOptions {
  token: string;
  initialChats: ChatMeta[];
  currentChatId?: number;
}

export function useChatNotifications({ token, initialChats, currentChatId }: UseChatNotificationsOptions) {
  const chatsRef = useRef<Map<number, string>>(new Map());
  const readyRef = useRef(false);

  useEffect(() => {
    chatsRef.current = new Map(
      initialChats.map((chat) => [chat.participantChatId, chat.updatedAt])
    );
  }, [initialChats]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'default') {
      void Notification.requestPermission();
    }

    const pollChats = async () => {
      try {
        const response = await fetch(`/api/chats?inviteToken=${token}&t=${Date.now()}`, {
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json() as { chats: ChatMeta[] };
        const nextMap = new Map<number, string>();

        for (const chat of data.chats) {
          nextMap.set(chat.participantChatId, chat.updatedAt);

          const previousUpdatedAt = chatsRef.current.get(chat.participantChatId);
          const isNewMessage = !!previousUpdatedAt && previousUpdatedAt !== chat.updatedAt;
          const isCurrentChat = currentChatId === chat.participantChatId;

          if (
            readyRef.current &&
            isNewMessage &&
            !isCurrentChat &&
            Notification.permission === 'granted'
          ) {
            const title = chat.participantFirstName || chat.participantUsername || 'Новый чат';
            const body = `Новое сообщение в чате ${title}`;
            const notification = new Notification(title, { body });

            notification.onclick = () => {
              window.focus();
              window.location.href = `/chat/${token}/${chat.participantChatId}`;
            };
          }
        }

        chatsRef.current = nextMap;
        readyRef.current = true;
      } catch {
        // ignore notification polling failures
      }
    };

    void pollChats();
    const interval = window.setInterval(pollChats, 3000);

    return () => window.clearInterval(interval);
  }, [currentChatId, token]);
}
