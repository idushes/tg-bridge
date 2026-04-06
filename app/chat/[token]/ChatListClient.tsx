'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ChatMeta } from '@/lib/types';
import { getUnreadCount, markChatAsRead } from './chatReadState';
import { useInstallPrompt } from './useInstallPrompt';
import { useChatNotifications } from './useChatNotifications';
import { useLiveChats } from './useLiveChats';

function getPreferredDarkMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = localStorage.getItem('darkMode');
  if (stored !== null) {
    return stored === 'true';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function subscribeToHydration() {
  return () => {};
}

function getChatName(chat: ChatMeta) {
  return chat.participantFirstName || chat.participantUsername || `Чат ${chat.participantChatId}`;
}

function getChatSubtitle(chat: ChatMeta) {
  if (chat.lastMessageMediaType) {
    const mediaLabel = {
      photo: 'Фото',
      video: 'Видео',
      voice: 'Голосовое',
      audio: 'Аудио',
      video_note: 'Кружочек',
      document: 'Документ',
    }[chat.lastMessageMediaType];

    if (chat.lastMessageText) {
      return `${mediaLabel}: ${chat.lastMessageText}`;
    }

    return mediaLabel;
  }

  if (chat.lastMessageText) {
    return chat.lastMessageText;
  }

  if (chat.participantUsername) {
    return `@${chat.participantUsername}`;
  }

  return 'Готов к диалогу';
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TG';
}

function formatUpdatedAt(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function getChatAvatarUrl(token: string, chat: ChatMeta) {
  if (!chat.participantPhotoFileId) {
    return null;
  }

  return `/api/chats/${chat.participantChatId}/avatar?inviteToken=${encodeURIComponent(token)}&v=${encodeURIComponent(chat.updatedAt)}`;
}

interface ChatListClientProps {
  token: string;
  botName: string;
  botUsername: string;
  chats: ChatMeta[];
}

export default function ChatListClient({ token, botName, botUsername, chats }: ChatListClientProps) {
  const hydrated = useSyncExternalStore(subscribeToHydration, () => true, () => false);
  const [darkModeOverride, setDarkModeOverride] = useState<boolean | null>(null);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [failedAvatarIds, setFailedAvatarIds] = useState<Record<number, boolean>>({});
  const { liveChats } = useLiveChats({ token, initialChats: chats });
  const { canInstall, promptInstall } = useInstallPrompt();
  const darkMode = darkModeOverride ?? (hydrated ? getPreferredDarkMode() : false);

  useChatNotifications({ token });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return liveChats;
    }

    return liveChats.filter((chat) => {
      const haystack = [
        chat.participantFirstName,
        chat.participantLastName,
        chat.participantUsername,
        chat.participantName,
        String(chat.participantChatId),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [liveChats, search]);

  const copyBotLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://t.me/${botUsername}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#dfe8f1] dark:bg-[#0e1621] transition-colors">
      {copied && (
        <div className="pointer-events-none fixed left-1/2 top-5 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/92 px-3 py-1.5 text-xs font-medium text-[#496783] shadow-[0_12px_32px_rgba(76,143,202,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#22303d]/96 dark:text-[#c1d6ea]">
          <span className="text-[11px] text-[#419fd9] dark:text-[#72bbff]">✓</span>
          <span>Ссылка скопирована</span>
        </div>
      )}
      <div className="min-h-screen pb-[max(env(safe-area-inset-bottom),0px)] pt-[max(env(safe-area-inset-top),0px)]">
        <aside className="min-h-screen w-full bg-[#f4f8fb] dark:bg-[#17212b]">
          <div className="border-b border-[#d8e3ec] px-4 pb-3 pt-4 dark:border-[#1e2b38] md:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7e95ab] dark:text-[#6c8299]">
                  Family Bridge
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[#233547] dark:text-[#f5f7fb]">{botName}</h1>
              </div>
              <button
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkModeOverride(newMode);
                  localStorage.setItem('darkMode', String(newMode));
                }}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#e8f0f7] text-lg text-[#5f7e99] transition hover:bg-[#dce9f4] dark:bg-[#22303d] dark:text-[#a6c4de] dark:hover:bg-[#2a3a49]"
                aria-label="Переключить тему"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>

            <label className="flex items-center gap-3 rounded-full bg-[#e8f0f7] px-4 py-2.5 text-[#7190aa] dark:bg-[#22303d] dark:text-[#8ea7bf]">
              <span className="text-sm">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск"
                className="w-full bg-transparent text-sm text-[#233547] outline-none placeholder:text-[#90a5b8] dark:text-white dark:placeholder:text-[#65809a]"
              />
            </label>

            <div className="mt-3 inline-flex">
              <button
                type="button"
                onClick={copyBotLink}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0f7] text-[15px] text-[#5f7e99] transition hover:bg-[#dce9f4] dark:bg-[#22303d] dark:text-[#9db9d1] dark:hover:bg-[#293847]"
                aria-label={copied ? 'Ссылка скопирована' : `Скопировать ссылку на бота @${botUsername}`}
                title={copied ? 'Ссылка скопирована' : `Скопировать ссылку на бота @${botUsername}`}
              >
                <span className="shrink-0 leading-none">{copied ? '✓' : '⧉'}</span>
              </button>
            </div>

            {canInstall && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-full bg-[#419fd9] px-3.5 text-sm font-medium text-white transition hover:bg-[#3793cc] dark:bg-[#3b82c4] dark:hover:bg-[#4a8ecb]"
              >
                <span className="text-base leading-none">↓</span>
                <span>Установить</span>
              </button>
            )}
          </div>

          <div className="px-1.5 py-2 md:px-2 md:py-2">
            {filteredChats.length === 0 ? (
              <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center border border-dashed border-[#ddd2c3] px-8 text-center dark:border-[#2a3947] md:rounded-[24px]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e9de] text-2xl text-[#7a6d5b] dark:bg-[#22303d] dark:text-[#88a9c7]">
                  ✈️
                </div>
                <h2 className="text-lg font-semibold text-[#323843] dark:text-[#f4f7fb]">Чаты появятся здесь</h2>
                <p className="mt-2 text-sm leading-6 text-[#7f7468] dark:text-[#88a0b7]">
                  Попросите близкого написать боту. Когда появится первый диалог, он будет выглядеть как привычный список чатов.
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const chatName = getChatName(chat);
                const unreadCount = hydrated ? getUnreadCount(token, chat) : 0;

                return (
                  <Link
                    key={chat.participantChatId}
                    href={`/chat/${token}`}
                    prefetch
                    scroll={false}
                    onClick={() => markChatAsRead(token, chat)}
                      className="relative flex items-center gap-3 rounded-[0.85rem] px-3 py-2.5 transition hover:bg-[#e8f0f7] dark:hover:bg-[#1f2c39]"
                  >
                      <div className="relative flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#68a7db] to-[#4c8fca] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(76,143,202,0.2)]">
                        {chat.participantPhotoFileId && !failedAvatarIds[chat.participantChatId] ? (
                          <Image
                            src={getChatAvatarUrl(token, chat)!}
                            alt={chatName}
                            fill
                            unoptimized
                            sizes="52px"
                            className="object-cover"
                            onError={() => {
                              setFailedAvatarIds((current) => ({ ...current, [chat.participantChatId]: true }));
                            }}
                          />
                        ) : (
                          getInitials(chatName)
                        )}
                     </div>
                     <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-3">
                        <p className="truncate text-[15px] font-medium text-[#233547] dark:text-[#f5f7fb]">{chatName}</p>
                         <span className="ml-auto shrink-0 text-[11px] font-medium text-[#7b93aa] dark:text-[#6d8298]" suppressHydrationWarning>
                          {hydrated ? formatUpdatedAt(chat.updatedAt) : ''}
                         </span>
                       </div>
                       <div className="mt-0.5 flex items-center gap-2">
                         <p className="min-w-0 flex-1 truncate text-[13px] text-[#6f8498] dark:text-[#8ba2b8]">{getChatSubtitle(chat)}</p>
                         {unreadCount > 0 && (
                           <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#419fd9] px-1.5 text-[11px] font-semibold text-white shadow-[0_6px_12px_rgba(65,159,217,0.28)]">
                             {unreadCount}
                           </span>
                         )}
                       </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
