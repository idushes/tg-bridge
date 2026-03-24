'use client';

import type { ChatMeta } from '@/lib/types';

function getStorageKey(token: string) {
  return `tg-bridge-read-chats:${token}`;
}

export function getReadChatMap(token: string): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(getStorageKey(token));
    return raw ? JSON.parse(raw) as Record<string, string> : {};
  } catch {
    return {};
  }
}

export function markChatAsRead(token: string, chat: ChatMeta) {
  if (typeof window === 'undefined') {
    return;
  }

  const current = getReadChatMap(token);
  current[String(chat.participantChatId)] = chat.updatedAt;
  localStorage.setItem(getStorageKey(token), JSON.stringify(current));
}

export function getUnreadCount(token: string, chat: ChatMeta) {
  const current = getReadChatMap(token);
  const readTimestamp = current[String(chat.participantChatId)];

  if (!readTimestamp) {
    return 1;
  }

  return new Date(chat.updatedAt).getTime() > new Date(readTimestamp).getTime() ? 1 : 0;
}
