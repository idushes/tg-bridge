'use client';

import { useEffect, useState } from 'react';
import type { ChatMeta } from '@/lib/types';
import { useChatNotifications } from './useChatNotifications';

interface ChatListClientProps {
  token: string;
  botName: string;
  chats: ChatMeta[];
}

export default function ChatListClient({ token, botName, chats }: ChatListClientProps) {
  const [darkMode, setDarkMode] = useState(false);

  useChatNotifications({ token });

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
      return;
    }

    setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 transition-colors">
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">{botName}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Выберите чат для общения:</p>
          </div>
          <button
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem('darkMode', String(newMode));
            }}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-sm"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>

        {chats.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400">Пока никто не писал боту</p>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Отправьте /start боту в Telegram</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <a
                key={chat.participantChatId}
                href={`/chat/${token}/${chat.participantChatId}`}
                className="block bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {chat.participantFirstName || chat.participantUsername || `Чат ${chat.participantChatId}`}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {chat.participantUsername && `@${chat.participantUsername}`}
                    </p>
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-500">→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
