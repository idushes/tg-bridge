'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

export default function Home() {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            TG Bridge
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Общение с близкими через Telegram без ограничений
          </p>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="mt-4 p-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
          >
            {darkMode ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
          </button>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6 text-center">
            Как это работает
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Добавьте бота</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Создайте бота через @BotFather в Telegram и получите токен
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Создайте ссылку</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Войдите в админку, добавьте токен бота и сгенерируйте ссылку для близких
              </p>
            </div>
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-xl shadow-sm">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">Общайтесь</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Отправьте ссылку родственникам — они смогут писать вам прямо через браузер
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6 text-center">
            Зачем это нужно
          </h2>
          <div className="bg-white dark:bg-zinc-800 p-8 rounded-xl shadow-sm">
            <ul className="space-y-4 text-zinc-700 dark:text-zinc-300">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>Обходите блокировки — ваши близкие из России могут общаться с вами через Telegram без VPN</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>Простой интерфейс — достаточно открыть ссылку, никакой регистрации и паролей</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>Идеально для пожилых — сын настраивает, родители просто нажимают на ссылку</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl">✓</span>
                <span>История сообщений — сохраняются последние 100 сообщений каждого чата</span>
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white mb-6 text-center">
            Скриншоты
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-700 p-4 border-b border-zinc-200 dark:border-zinc-600">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Чат для родителей</p>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-2xl px-4 py-2 max-w-[70%]">
                    <p className="text-sm">Привет! Как дела?</p>
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-2xl px-4 py-2 max-w-[70%]">
                    <p className="text-sm text-zinc-900 dark:text-white">Привет, сынок! Всё хорошо, скучаем!</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-zinc-100 dark:bg-zinc-700 p-4 border-b border-zinc-200 dark:border-zinc-600">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Панель управления</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Мама</p>
                    <p className="text-xs text-zinc-500">@mamaBot</p>
                  </div>
                  <button className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg">
                    Копировать ссылку
                  </button>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg">
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-white">Папа</p>
                    <p className="text-xs text-zinc-500">@papaBot</p>
                  </div>
                  <button className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-lg">
                    Копировать ссылку
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="text-center mb-16">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
          >
            Войти через Telegram
          </Link>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Требуется Telegram для авторизации
          </p>
        </section>

        <footer className="text-center text-sm text-zinc-400 dark:text-zinc-500">
          <p>TG Bridge — помогаем близким оставаться на связи</p>
        </footer>
      </div>
    </div>
  );
}
