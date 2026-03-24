'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ChatMeta } from '@/lib/types';
import { getUnreadCount, markChatAsRead } from './chatReadState';
import { useInstallPrompt } from './useInstallPrompt';
import { useChatNotifications } from './useChatNotifications';
import { useLiveChats } from './useLiveChats';

function getInitialDarkMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = localStorage.getItem('darkMode');
  if (stored !== null) {
    return stored === 'true';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  return 'Готов к диалогу в Telegram';
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

interface ChatListClientProps {
  token: string;
  botName: string;
  botUsername: string;
  chats: ChatMeta[];
}

export default function ChatListClient({ token, botName, botUsername, chats }: ChatListClientProps) {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const { liveChats } = useLiveChats({ token, initialChats: chats });
  const { canInstall, promptInstall } = useInstallPrompt();

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
    <div className="min-h-screen bg-[#ebe4d8] dark:bg-[#0e1621] transition-colors">
      <div className="min-h-screen pb-[max(env(safe-area-inset-bottom),0px)] pt-[max(env(safe-area-inset-top),0px)]">
        <aside className="min-h-screen w-full bg-[#fbf7f0] dark:bg-[#17212b]">
          <div className="border-b border-[#ddd2c3] px-4 pb-4 pt-5 dark:border-[#1e2b38] md:px-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8a7966] dark:text-[#6c8299]">
                  Telegram Bridge
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[#293241] dark:text-[#f5f7fb]">{botName}</h1>
              </div>
              <button
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem('darkMode', String(newMode));
                }}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#f1e7da] text-lg text-[#746958] transition hover:bg-[#e8dccd] dark:bg-[#22303d] dark:text-[#a6c4de] dark:hover:bg-[#2a3a49]"
                aria-label="Переключить тему"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>

            <label className="flex items-center gap-3 rounded-xl bg-[#f2e9de] px-4 py-3 text-[#766c60] dark:bg-[#22303d] dark:text-[#8ea7bf]">
              <span className="text-sm">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#a0907d] dark:placeholder:text-[#65809a]"
              />
            </label>

            <button
              type="button"
              onClick={copyBotLink}
              className="mt-3 inline-flex max-w-full items-center gap-2 rounded-xl bg-[#f2e9de] px-3 py-2 text-[13px] font-medium text-[#6c6f75] transition hover:bg-[#eadfce] dark:bg-[#22303d] dark:text-[#9db9d1] dark:hover:bg-[#293847]"
            >
              <span className="truncate">{copied ? 'Ссылка скопирована' : `Скопировать @${botUsername}`}</span>
              <span className="shrink-0">{copied ? '✓' : '⧉'}</span>
            </button>

            {canInstall && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#4f8fd0] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#437bb3]"
              >
                <span>Установить как приложение</span>
                <span className="ml-3 shrink-0">＋</span>
              </button>
            )}
          </div>

          <div className="px-2 py-2 md:px-3 md:py-3">
            {filteredChats.length === 0 ? (
              <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center border border-dashed border-[#ddd2c3] px-8 text-center dark:border-[#2a3947] md:rounded-[24px]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2e9de] text-2xl text-[#7a6d5b] dark:bg-[#22303d] dark:text-[#88a9c7]">
                  ✈️
                </div>
                <h2 className="text-lg font-semibold text-[#323843] dark:text-[#f4f7fb]">Чаты появятся здесь</h2>
                <p className="mt-2 text-sm leading-6 text-[#7f7468] dark:text-[#88a0b7]">
                  Попросите близкого написать боту в Telegram. Когда появится первый диалог, он будет выглядеть как привычный список чатов.
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const chatName = getChatName(chat);

                return (
                  <Link
                    key={chat.participantChatId}
                    href={`/chat/${token}`}
                    prefetch
                    scroll={false}
                    onClick={() => markChatAsRead(token, chat)}
                      className="relative overflow-hidden flex items-center gap-3 rounded-xl px-3 py-3 transition active:scale-[0.992] active:bg-[#ece2d4] hover:bg-[#f2e9de] before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_center,rgba(79,143,208,0.16),transparent_62%)] before:opacity-0 before:transition before:duration-200 active:before:opacity-100 dark:active:bg-[#22303d] dark:hover:bg-[#1f2c39] dark:before:bg-[radial-gradient(circle_at_center,rgba(95,176,255,0.16),transparent_62%)]"
                  >
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#72a7d9] to-[#4f8fd0] text-base font-semibold text-white shadow-[0_10px_20px_rgba(79,143,208,0.24)]">
                      {getInitials(chatName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-[15px] font-semibold text-[#293241] dark:text-[#f5f7fb]">{chatName}</p>
                        <span className="ml-auto shrink-0 text-[11px] font-medium text-[#9a8c7a] dark:text-[#6d8298]">
                          {formatUpdatedAt(chat.updatedAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-[13px] text-[#7b7164] dark:text-[#8ba2b8]">{getChatSubtitle(chat)}</p>
                        {getUnreadCount(token, chat) > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#4f8fd0] px-1.5 text-[11px] font-semibold text-white shadow-[0_6px_12px_rgba(79,143,208,0.3)]">
                            {getUnreadCount(token, chat)}
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
