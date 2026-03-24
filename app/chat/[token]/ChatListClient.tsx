'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { ChatMeta } from '@/lib/types';
import { useChatNotifications } from './useChatNotifications';

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
  chats: ChatMeta[];
}

export default function ChatListClient({ token, botName, chats }: ChatListClientProps) {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [search, setSearch] = useState('');

  useChatNotifications({ token });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return chats;
    }

    return chats.filter((chat) => {
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
  }, [chats, search]);

  return (
    <div className="min-h-screen bg-[#d7e3ec] dark:bg-[#0e1621] transition-colors">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row md:px-4 md:py-5">
        <aside className="w-full shrink-0 border-r border-black/5 bg-white/90 backdrop-blur dark:border-white/5 dark:bg-[#17212b]/95 md:max-w-sm md:rounded-[28px] md:shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="border-b border-black/5 px-4 pb-4 pt-5 dark:border-white/5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7f91a4] dark:text-[#6c8299]">
                  Telegram Bridge
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-[#182533] dark:text-[#f5f7fb]">{botName}</h1>
              </div>
              <button
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem('darkMode', String(newMode));
                }}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#eef4fa] text-lg text-[#4b6178] transition hover:bg-[#dfeaf5] dark:bg-[#22303d] dark:text-[#a6c4de] dark:hover:bg-[#2a3a49]"
                aria-label="Переключить тему"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>

            <label className="flex items-center gap-3 rounded-2xl bg-[#f1f6fb] px-4 py-3 text-[#6d8194] dark:bg-[#22303d] dark:text-[#8ea7bf]">
              <span className="text-sm">⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Поиск"
                className="w-full bg-transparent text-sm outline-none placeholder:text-[#91a4b7] dark:placeholder:text-[#65809a]"
              />
            </label>
          </div>

          <div className="px-2 py-2 md:h-[calc(100vh-3rem-134px)] md:overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="flex min-h-72 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#d7e2ed] px-8 text-center dark:border-[#2a3947]">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eff5fb] text-2xl text-[#5f7c97] dark:bg-[#22303d] dark:text-[#88a9c7]">
                  ✈️
                </div>
                <h2 className="text-lg font-semibold text-[#223244] dark:text-[#f4f7fb]">Чаты появятся здесь</h2>
                <p className="mt-2 text-sm leading-6 text-[#718499] dark:text-[#88a0b7]">
                  Попросите близкого написать боту в Telegram. Когда появится первый диалог, он будет выглядеть как привычный список чатов.
                </p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const chatName = getChatName(chat);

                return (
                  <Link
                    key={chat.participantChatId}
                    href={`/chat/${token}/${chat.participantChatId}`}
                    prefetch
                    scroll={false}
                    className="flex items-center gap-3 rounded-[22px] px-3 py-3 transition hover:bg-[#edf4fa] dark:hover:bg-[#22303d]"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#56a7f5] to-[#3d7bff] text-base font-semibold text-white shadow-[0_10px_20px_rgba(61,123,255,0.28)]">
                      {getInitials(chatName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-[15px] font-semibold text-[#1d2a39] dark:text-[#f5f7fb]">{chatName}</p>
                        <span className="ml-auto shrink-0 text-[11px] font-medium text-[#8ea0b2] dark:text-[#6d8298]">
                          {formatUpdatedAt(chat.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[13px] text-[#73879c] dark:text-[#8ba2b8]">{getChatSubtitle(chat)}</p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </aside>

        <section className="hidden flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.75),_transparent_55%),linear-gradient(180deg,_rgba(222,232,240,0.65)_0%,_rgba(215,227,236,0.4)_100%)] px-8 dark:bg-[radial-gradient(circle_at_top,_rgba(43,57,72,0.46),_transparent_55%),linear-gradient(180deg,_rgba(14,22,33,0.92)_0%,_rgba(18,28,41,0.88)_100%)] md:flex">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] bg-white/75 text-4xl shadow-[0_20px_60px_rgba(15,23,42,0.12)] dark:bg-[#17212b]/90">
              💬
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#1f3143] dark:text-[#eef5fb]">Выберите диалог</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#698096] dark:text-[#8fa7bc]">
              Интерфейс адаптирован под Telegram: список чатов слева, разговор справа. На телефоне экран списка и сам чат работают как в мобильном приложении.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
