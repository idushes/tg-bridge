'use client';

import { useState, useEffect } from 'react';
import type { BotConfig, ChatMeta } from '@/lib/types';
import Link from 'next/link';

interface BotWithChats extends BotConfig {
  chats: ChatMeta[];
}

export default function AdminClient() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);
  const [bots, setBots] = useState<BotWithChats[]>([]);
  const [showAddBot, setShowAddBot] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [parentName, setParentName] = useState('');
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
    if (user) return;

    const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID;
    if (!botId) return;

    const existingScript = document.querySelector('script[src*="telegram-widget.js"][data-telegram-login]');
    if (existingScript) return;

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?21';
    script.setAttribute('data-telegram-login', botId);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '10');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.async = true;

    const container = document.getElementById('telegram-login');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, [user]);

  const checkAuth = async () => {
    const tgId = localStorage.getItem('telegram_id');
    const tgName = localStorage.getItem('telegram_name');
    
    if (!tgId) {
      setLoading(false);
      return;
    }
    
    setUser({ id: parseInt(tgId), name: tgName || 'Пользователь' });
    await fetchBots(parseInt(tgId));
  };

  const fetchBots = async (tgId: number) => {
    try {
      const response = await fetch('/api/bots', {
        headers: { 'x-telegram-id': tgId.toString() },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        const botsWithChats: BotWithChats[] = [];
        for (const bot of data.bots) {
          const chatsResponse = await fetch('/api/chats', {
            headers: { 'x-telegram-id': tgId.toString() },
          });
          
          if (chatsResponse.ok) {
            const chatsData = await chatsResponse.json();
            const botChats = chatsData.chats.filter((c: ChatMeta) => c.botId === bot.botId);
            botsWithChats.push({ ...bot, chats: botChats });
          }
        }
        
        setBots(botsWithChats);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    }
  };

  const handleTelegramLogin = () => {
    const widget = (window as unknown as { Telegram?: { Login?: { auth: (config: { bot_id: string; request_access: string; return_url: string }, callback: (user: unknown) => void) => void } } }).Telegram;
    
    if (!widget?.Login?.auth) {
      alert('Telegram виджет не загружен. Подождите немного и попробуйте снова.');
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
    if (!botToken || !parentName) {
      setError('Заполните все поля');
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
        body: JSON.stringify({ botToken, parentName }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Ошибка при добавлении бота');
        return;
      }

      setBotToken('');
      setParentName('');
      setShowAddBot(false);
      await fetchBots(parseInt(tgId!));
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

  const regenerateLink = async (chatId: string) => {
    const tgId = localStorage.getItem('telegram_id');
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'PATCH',
      headers: { 'x-telegram-id': tgId || '' },
      body: JSON.stringify({ regenerateLink: true }),
    });

    if (response.ok) {
      await fetchBots(parseInt(tgId!));
    }
  };

  const deleteChat = async (chatId: string) => {
    if (!confirm('Удалить чат?')) return;

    const tgId = localStorage.getItem('telegram_id');
    const response = await fetch(`/api/chats/${chatId}`, {
      method: 'DELETE',
      headers: { 'x-telegram-id': tgId || '' },
    });

    if (response.ok) {
      await fetchBots(parseInt(tgId!));
    }
  };

  const copyLink = (url: string) => {
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
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <p className="text-zinc-600 dark:text-zinc-400">Загрузка...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Вход</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">Войдите через Telegram для управления ботами</p>
          
          <div className="flex justify-center" id="telegram-login" />
          
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Link href="/" className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
              ← На главную
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900">
      <header className="bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Панель управления</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Привет, {user.name}!</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
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
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + Добавить бота
          </button>
        </div>

        {showAddBot && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-6 mb-6">
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
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Имя родителя
                </label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Мама, Папа, Бабушка..."
                  className="w-full px-4 py-2 border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={addBot}
                  disabled={adding}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {adding ? 'Добавление...' : 'Добавить'}
                </button>
                <button
                  onClick={() => {
                    setShowAddBot(false);
                    setError('');
                    setBotToken('');
                    setParentName('');
                  }}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {bots.length === 0 ? (
          <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-8 text-center">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">У вас пока нет ботов</p>
            <button
              onClick={() => setShowAddBot(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              Добавить первого бота →
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {bots.map((bot) => (
              <div key={bot.botId} className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{bot.botName}</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">@{bot.botUsername}</p>
                  </div>
                  <button
                    onClick={() => deleteBot(bot.botId)}
                    className="text-red-500 hover:text-red-600 text-sm"
                  >
                    Удалить бота
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Чаты:</h4>
                  {bot.chats.length === 0 ? (
                    <p className="text-sm text-zinc-400">Нет чатов</p>
                  ) : (
                    bot.chats.map((chat) => (
                      <div
                        key={chat.inviteToken}
                        className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-zinc-900 dark:text-white">{chat.parentName}</p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            Лимит: {chat.messageLimit} сообщений
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyLink(chat.inviteToken ? `${window.location.origin}/chat/${chat.inviteToken}` : '')}
                            className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                          >
                            Копировать ссылку
                          </button>
                          <button
                            onClick={() => regenerateLink(chat.inviteToken)}
                            className="px-3 py-1 text-sm bg-zinc-100 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-500 transition-colors"
                          >
                            Новую ссылку
                          </button>
                          <button
                            onClick={() => deleteChat(chat.inviteToken)}
                            className="px-3 py-1 text-sm text-red-500 hover:text-red-600"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/" className="block mt-6 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 text-center">
          ← На главную
        </Link>
      </main>
    </div>
  );
}