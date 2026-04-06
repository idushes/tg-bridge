'use client';

import { useState, useEffect } from 'react';
import type { BotConfig } from '@/lib/types';
import Link from 'next/link';

export default function AdminClient() {
  const telegramBotId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [showAddBot, setShowAddBot] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (loading || user) {
      return;
    }

    const container = document.getElementById('telegram-login-btn');
    if (!container) {
      return;
    }

    container.innerHTML = '';

    if (!telegramBotId) {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', telegramBotId);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '999');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-userpic', 'false');

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [loading, telegramBotId, user]);

  const checkAuth = async () => {
    const tgId = localStorage.getItem('telegram_id');
    const tgName = localStorage.getItem('telegram_name');
    
    if (!tgId) {
      setLoading(false);
      return;
    }
    
    setUser({ id: parseInt(tgId), name: tgName || 'Пользователь' });
    await fetchBots(parseInt(tgId));
    setLoading(false);
  };

  const fetchBots = async (tgId: number) => {
    try {
      const response = await fetch('/api/bots', {
        headers: { 'x-telegram-id': tgId.toString() },
      });
      
      if (response.ok) {
        const data = await response.json();
        setBots(data.bots);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  };

  const handleTelegramLogin = () => {
    const widget = (window as unknown as { Telegram?: { Login?: { auth: (config: { bot_id: string; request_access: string; return_url: string }, callback: (user: unknown) => void) => void } } }).Telegram;
    
    if (!widget?.Login?.auth) {
      alert('Виджет входа не загружен. Подождите немного и попробуйте снова.');
      return;
    }

    const script = document.querySelector('script[src*="telegram-widget.js"]');
    const botId = script?.getAttribute('data-telegram-login');
    
    if (!botId) {
      alert('Не удалось получить ID бота. Проверьте настройки.');
      return;
    }
    
    widget.Login.auth({
      bot_id: botId,
      request_access: 'write',
      return_url: window.location.href,
    }, (telegramUser: unknown) => {
      if (telegramUser && typeof telegramUser === 'object' && 'id' in telegramUser) {
        const user = telegramUser as { id: number; first_name?: string; last_name?: string; username?: string };
        localStorage.setItem('telegram_id', user.id.toString());
        localStorage.setItem('telegram_name', user.first_name || user.username || 'Пользователь');
        setUser({ id: user.id, name: user.first_name || user.username || 'Пользователь' });
        fetchBots(user.id);
      }
    });
  };

  const addBot = async () => {
    if (!botToken) {
      setError('Введите токен бота');
      return;
    }

    setAdding(true);
    setError('');

    try {
      const tgId = localStorage.getItem('telegram_id');
      const response = await fetch('/api/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-id': tgId || '',
        },
        body: JSON.stringify({ botToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при добавлении бота');
        return;
      }

      setBotToken('');
      setShowAddBot(false);
      if (tgId) {
        await fetchBots(parseInt(tgId));
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setAdding(false);
    }
  };

  const deleteBot = async (botId: number) => {
    if (!confirm('Удалить бота и все связанные чаты?')) return;

    const tgId = localStorage.getItem('telegram_id');
    const response = await fetch(`/api/bots/${botId}`, {
      method: 'DELETE',
      headers: { 'x-telegram-id': tgId || '' },
    });

    if (response.ok) {
      await fetchBots(parseInt(tgId!));
    }
  };

  const copyLink = (inviteToken: string) => {
    const url = `${window.location.origin}/chat/${inviteToken}`;
    navigator.clipboard.writeText(url);
    alert('Ссылка скопирована!');
  };

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', String(newMode));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3ede3] dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3ede3] dark:bg-zinc-900">
        <div className="w-full max-w-md rounded-xl bg-[#fffaf4] p-8 text-center shadow-[0_18px_40px_rgba(73,61,41,0.06)] dark:bg-zinc-800">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#72a7d9] to-[#4f8fd0]">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Вход</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">Войдите для управления ботами</p>
          
          <div className="flex justify-center mb-4">
            <div id="telegram-login-btn" />
          </div>

          {!telegramBotId && (
            <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
              Не задан `NEXT_PUBLIC_TELEGRAM_BOT_ID`, поэтому кнопка входа не может загрузиться.
            </p>
          )}
          
          <div className="border-t border-[#e4d8ca] pt-4 dark:border-zinc-700">
            <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer">
              ← На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3ede3] dark:bg-zinc-900">
      <header className="border-b border-[#e4d8ca] bg-[#fffaf4] px-4 py-4 dark:border-zinc-700 dark:bg-zinc-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Панель управления</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Привет, {user.name}!</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="cursor-pointer rounded-lg bg-[#efe3d4] p-2 text-[#6f665b] hover:bg-[#e5d7c5] dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600 transition-colors"
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('telegram_id');
                localStorage.removeItem('telegram_name');
                setUser(null);
                setBots([]);
              }}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 cursor-pointer"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Ваши боты</h2>
          <button
            onClick={() => setShowAddBot(true)}
            className="cursor-pointer rounded-lg bg-[#4f8fd0] px-4 py-2 font-medium text-white hover:bg-[#437bb3] transition-colors"
          >
            + Добавить бота
          </button>
        </div>

        {showAddBot && (
          <div className="mb-6 rounded-xl bg-[#fffaf4] p-6 shadow-[0_18px_40px_rgba(73,61,41,0.06)] dark:bg-zinc-800">
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-4">Добавить нового бота</h3>
            
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Токен бота
                </label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                   className="w-full rounded-lg border border-[#e4d8ca] bg-[#fffdf9] px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#4f8fd0] dark:border-zinc-600 dark:bg-zinc-700 dark:text-white"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={addBot}
                  disabled={adding}
                  className="cursor-pointer rounded-lg bg-[#4f8fd0] px-4 py-2 font-medium text-white hover:bg-[#437bb3] disabled:opacity-50 transition-colors"
                >
                  {adding ? 'Добавление...' : 'Добавить'}
                </button>
                <button
                  onClick={() => {
                    setShowAddBot(false);
                    setError('');
                    setBotToken('');
                  }}
                  className="cursor-pointer rounded-lg border border-[#e4d8ca] px-4 py-2 font-medium text-zinc-700 hover:bg-[#f7efe5] dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {bots.length === 0 ? (
          <div className="rounded-xl bg-[#fffaf4] p-8 text-center shadow-[0_18px_40px_rgba(73,61,41,0.06)] dark:bg-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">У вас пока нет ботов</p>
            <button
              onClick={() => setShowAddBot(true)}
              className="cursor-pointer font-medium text-[#4f8fd0] hover:text-[#437bb3] dark:text-blue-400 dark:hover:text-blue-300"
            >
              Добавить первого бота →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bots.map((bot) => (
              <div key={bot.botId} className="rounded-xl bg-[#fffaf4] p-6 shadow-[0_18px_40px_rgba(73,61,41,0.06)] dark:bg-zinc-800">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{bot.botName}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">@{bot.botUsername}</p>
                  </div>
                  <button
                    onClick={() => deleteBot(bot.botId)}
                    className="text-red-500 hover:text-red-600 text-sm cursor-pointer"
                  >
                    Удалить бота
                  </button>
                </div>

                <div className="mb-4 rounded-lg bg-[#f7efe5] p-3 dark:bg-zinc-700">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Ссылка для родителя:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm text-zinc-900 dark:text-white flex-1 overflow-hidden text-ellipsis">
                      {`${window.location.origin}/chat/${bot.inviteToken}`}
                    </code>
                    <button
                      onClick={() => copyLink(bot.inviteToken)}
                      className="cursor-pointer rounded-lg bg-[#e8f1fb] px-3 py-1 text-sm text-[#4f8fd0] hover:bg-[#dce9f7] dark:bg-blue-900 dark:text-blue-400 dark:hover:bg-blue-800 transition-colors"
                    >
                      Копировать
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/" className="block mt-6 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-center cursor-pointer">
          ← На главную
        </Link>
      </main>
    </div>
  );
}
