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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f8efe1_0%,#f5ede2_42%,#ede5d8_100%)] text-[#243142] transition-colors dark:bg-[radial-gradient(circle_at_top,#22334d_0%,#121b2a_48%,#0a1220_100%)] dark:text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-10 flex justify-end">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-4 py-2 text-sm font-medium text-[#5b6470] shadow-[0_10px_30px_rgba(97,79,53,0.08)] backdrop-blur hover:bg-white dark:border-white/10 dark:bg-white/8 dark:text-[#d2d9e4] dark:hover:bg-white/12"
          >
            <span>{darkMode ? '☀️' : '🌙'}</span>
            <span>{darkMode ? 'Светлая тема' : 'Тёмная тема'}</span>
          </button>
        </div>

        <header className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="rounded-[2rem] border border-white/55 bg-white/72 p-8 shadow-[0_30px_80px_rgba(96,76,48,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-10">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-[#e7eff8] px-4 py-2 text-sm font-medium text-[#44688f] dark:bg-[#1b3048] dark:text-[#9fc4eb]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#6fa6d9] to-[#376fb3] text-white shadow-[0_10px_20px_rgba(55,111,179,0.3)]">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </span>
              Telegram Bridge
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[#213041] dark:text-white sm:text-5xl lg:text-6xl">
              Связь с близкими через Telegram без сложной настройки.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f6c78] dark:text-[#a9b6c7] sm:text-xl">
              Вы создаете бота и отправляете ссылку. Родители или родственники просто открывают страницу и пишут вам как в привычном чате.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/admin"
                className="inline-flex items-center justify-center rounded-full bg-[#3f78ba] px-7 py-3.5 text-base font-semibold text-white shadow-[0_18px_40px_rgba(63,120,186,0.34)] transition hover:bg-[#3567a1] dark:bg-[#4f8fd0] dark:hover:bg-[#5e9cda]"
              >
                Войти через Telegram
              </Link>
              <p className="text-sm text-[#6f7b86] dark:text-[#95a6bb]">
                Без регистрации для получателя, нужен только Telegram у вас.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#f6efe5] px-4 py-4 dark:bg-white/6">
                <div className="text-2xl font-semibold text-[#213041] dark:text-white">1 мин</div>
                <div className="mt-1 text-sm text-[#6c756e] dark:text-[#9fb0bf]">чтобы запустить первого бота</div>
              </div>
              <div className="rounded-2xl bg-[#ecf3ea] px-4 py-4 dark:bg-white/6">
                <div className="text-2xl font-semibold text-[#213041] dark:text-white">0 логинов</div>
                <div className="mt-1 text-sm text-[#6c756e] dark:text-[#9fb0bf]">для родителей и родственников</div>
              </div>
              <div className="rounded-2xl bg-[#e7eef8] px-4 py-4 dark:bg-white/6">
                <div className="text-2xl font-semibold text-[#213041] dark:text-white">100</div>
                <div className="mt-1 text-sm text-[#6c756e] dark:text-[#9fb0bf]">последних сообщений сохраняются</div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/45 bg-[#fffaf2]/78 p-5 shadow-[0_30px_80px_rgba(96,76,48,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="rounded-[1.6rem] bg-[#f3ebdf] p-4 dark:bg-[#121e2e]">
              <div className="flex items-center justify-between rounded-[1.3rem] bg-[#fffdf9] px-4 py-3 shadow-[0_12px_30px_rgba(98,77,49,0.08)] dark:bg-[#1a2a3d] dark:shadow-none">
                <div>
                  <div className="text-sm font-medium text-[#7b6a57] dark:text-[#90a5bc]">Чат для родителей</div>
                  <div className="mt-1 text-lg font-semibold text-[#243142] dark:text-white">Мама</div>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#72a7d9] to-[#4279bc] text-white shadow-[0_12px_24px_rgba(66,121,188,0.28)]">
                  М
                </div>
              </div>

              <div className="mt-4 space-y-3 rounded-[1.5rem] bg-[linear-gradient(180deg,#f7f0e5_0%,#efe5d8_100%)] p-4 dark:bg-[linear-gradient(180deg,#142033_0%,#101b2b_100%)]">
                <div className="flex justify-center">
                  <div className="rounded-full bg-white/75 px-3 py-1 text-[11px] font-medium text-[#7f6d59] dark:bg-white/10 dark:text-[#9eb2c8]">
                    Сегодня
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-[1.2rem] rounded-br-md bg-[#4a83c6] px-4 py-3 text-sm text-white shadow-[0_12px_24px_rgba(74,131,198,0.28)]">
                    Привет! Как у вас дела? Пишу прямо из Telegram.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[78%] rounded-[1.2rem] rounded-bl-md bg-[#fffdf9] px-4 py-3 text-sm text-[#2d3947] shadow-[0_12px_24px_rgba(98,77,49,0.06)] dark:bg-[#1b2a3d] dark:text-[#edf3fb] dark:shadow-none">
                    Все хорошо. Очень удобно, что можно просто открыть ссылку и написать.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[78%] rounded-[1.2rem] rounded-br-md bg-[#dbe9cf] px-4 py-3 text-sm text-[#294226] shadow-[0_12px_24px_rgba(82,110,60,0.12)] dark:bg-[#28547b] dark:text-white dark:shadow-none">
                    Отлично. Если что, отвечу сразу в Telegram.
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-[1.3rem] bg-[#fffdf9] px-4 py-3 shadow-[0_12px_30px_rgba(98,77,49,0.08)] dark:bg-[#1a2a3d] dark:shadow-none">
                <div className="flex-1 rounded-full bg-[#f3ebdf] px-4 py-3 text-sm text-[#8a7761] dark:bg-[#101b2a] dark:text-[#7f93a9]">
                  Напишите сообщение
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3f78ba] text-white shadow-[0_12px_24px_rgba(63,120,186,0.28)] dark:bg-[#4f8fd0]">
                  ➤
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-16 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.8rem] border border-white/50 bg-white/70 p-7 shadow-[0_20px_60px_rgba(96,76,48,0.1)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e7eff8] text-[#45719f] dark:bg-[#1b3048] dark:text-[#9fc4eb]">+</div>
            <h2 className="text-xl font-semibold text-[#233141] dark:text-white">Как это работает</h2>
            <p className="mt-3 text-sm leading-7 text-[#62707b] dark:text-[#9fb0bf]">
              Создайте бота через `@BotFather`, добавьте токен в админке и поделитесь персональной ссылкой с близкими.
            </p>
          </div>
          <div className="rounded-[1.8rem] border border-white/50 bg-white/70 p-7 shadow-[0_20px_60px_rgba(96,76,48,0.1)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecf3ea] text-[#6c8b5f] dark:bg-[#213423] dark:text-[#a9d09a]">↗</div>
            <h2 className="text-xl font-semibold text-[#233141] dark:text-white">Зачем это нужно</h2>
            <p className="mt-3 text-sm leading-7 text-[#62707b] dark:text-[#9fb0bf]">
              Получатель открывает простую страницу без паролей, VPN и установки новых приложений. Все ответы приходят вам в Telegram.
            </p>
          </div>
          <div className="rounded-[1.8rem] border border-white/50 bg-white/70 p-7 shadow-[0_20px_60px_rgba(96,76,48,0.1)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6eadc] text-[#b1723f] dark:bg-[#402918] dark:text-[#efb07b]">💬</div>
            <h2 className="text-xl font-semibold text-[#233141] dark:text-white">Для семьи</h2>
            <p className="mt-3 text-sm leading-7 text-[#62707b] dark:text-[#9fb0bf]">
              Интерфейс сделан максимально понятным для родителей и пожилых родственников: открыть ссылку, увидеть чат, написать сообщение.
            </p>
          </div>
        </section>

        <section className="mt-16 rounded-[2rem] border border-white/50 bg-white/70 p-8 shadow-[0_20px_60px_rgba(96,76,48,0.1)] backdrop-blur dark:border-white/10 dark:bg-white/6 dark:shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold text-[#233141] dark:text-white">Почему это удобно</h2>
              <p className="mt-4 text-base leading-8 text-[#62707b] dark:text-[#9fb0bf]">
                TG Bridge закрывает разрыв между привычным вам Telegram и максимально простым браузерным интерфейсом для близких.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f6efe5] p-5 dark:bg-white/6">
                <div className="text-sm font-semibold text-[#233141] dark:text-white">Обход блокировок</div>
                <p className="mt-2 text-sm leading-6 text-[#66737f] dark:text-[#9fb0bf]">Ваши близкие из России могут писать вам через браузер, а вы отвечаете в Telegram.</p>
              </div>
              <div className="rounded-2xl bg-[#eef4ea] p-5 dark:bg-white/6">
                <div className="text-sm font-semibold text-[#233141] dark:text-white">Без лишних шагов</div>
                <p className="mt-2 text-sm leading-6 text-[#66737f] dark:text-[#9fb0bf]">Никаких аккаунтов, логинов и инструкций на десять пунктов.</p>
              </div>
              <div className="rounded-2xl bg-[#e8eef8] p-5 dark:bg-white/6">
                <div className="text-sm font-semibold text-[#233141] dark:text-white">Быстрый старт</div>
                <p className="mt-2 text-sm leading-6 text-[#66737f] dark:text-[#9fb0bf]">Добавляете бота, копируете ссылку и сразу начинаете переписку.</p>
              </div>
              <div className="rounded-2xl bg-[#f2eadf] p-5 dark:bg-white/6">
                <div className="text-sm font-semibold text-[#233141] dark:text-white">Понятный интерфейс</div>
                <p className="mt-2 text-sm leading-6 text-[#66737f] dark:text-[#9fb0bf]">Список чатов, крупные элементы и привычные пузырьки сообщений.</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-8 pt-12 text-center text-sm text-[#7a827f] dark:text-[#8194a9]">
          TG Bridge - помогаем близким оставаться на связи
        </footer>
      </div>
    </div>
  );
}
