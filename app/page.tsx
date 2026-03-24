'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Sun, 
  Moon, 
  MessageCircle, 
  Smartphone, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Bot,
  Link as LinkIcon,
  CheckCircle2,
  Users
} from 'lucide-react';

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#f8f4ed_0%,#f0e6d6_100%)] text-[#1e293b] transition-colors dark:bg-[radial-gradient(ellipse_at_top,#1a2235_0%,#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        
        {/* Header / Theme Toggle */}
        <div className="mb-12 flex justify-end">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white/60 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm backdrop-blur transition-all hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span>{darkMode ? 'Светлая' : 'Тёмная'} тема</span>
          </button>
        </div>

        {/* Hero Section */}
        <header className="mb-24 grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          
          {/* Hero Text */}
          <div className="flex flex-col items-start">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#4a83c6]/20 bg-[#4a83c6]/10 px-3 py-1.5 text-sm font-medium text-[#3b6ea8] dark:border-[#5fa3ed]/20 dark:bg-[#5fa3ed]/10 dark:text-[#8cbbf0]">
              <Zap className="h-4 w-4 fill-current" />
              Готово за 1 минуту
            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.1]">
              Связь с близкими <br className="hidden sm:block" />
              <span className="text-[#4a83c6] dark:text-[#5fa3ed]">без VPN и регистраций</span>
            </h1>
            
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              Они открывают простую ссылку в браузере, а вы получаете сообщения прямо в свой Telegram. Никаких новых приложений и сложных настроек для родителей.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/admin"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#4a83c6] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#4a83c6]/25 transition-all hover:-translate-y-0.5 hover:bg-[#3b6ea8] hover:shadow-xl hover:shadow-[#4a83c6]/30 dark:bg-[#5fa3ed] dark:text-slate-900 dark:shadow-[#5fa3ed]/20 dark:hover:bg-[#7db4f5]"
              >
                Создать свой чат
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Безопасный вход через Telegram
              </div>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[#4a83c6]/20 to-transparent blur-2xl dark:from-[#5fa3ed]/20"></div>
            
            <div className="relative flex flex-col gap-6 rounded-[2rem] border border-white/50 bg-white/40 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/40">
              
              {/* Browser Chat (Web) */}
              <div className="rounded-2xl border border-slate-200 bg-[#f8f9fa] shadow-sm dark:border-slate-800 dark:bg-[#0f172a]">
                <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-400/80"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-400/80"></div>
                  </div>
                  <div className="flex-1 rounded-md bg-white px-3 py-1 text-center text-xs text-slate-400 dark:bg-slate-800/50">
                    telegram.lisacorp.com/chat/dsf43tgf2
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                      Привет! Проверяю связь. Тут очень удобно писать.
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Indicator */}
              <div className="flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4a83c6]/10 text-[#4a83c6] dark:bg-[#5fa3ed]/10 dark:text-[#5fa3ed]">
                  <ArrowRight className="h-5 w-5 rotate-90 lg:rotate-0" />
                </div>
              </div>

              {/* Telegram Chat (App) */}
              <div className="rounded-2xl border border-slate-200 bg-[#e3f0fa] shadow-sm dark:border-slate-800 dark:bg-[#152336]">
                <div className="flex items-center gap-3 border-b border-[#c8e1f5] px-4 py-3 dark:border-slate-800">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4a83c6] text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Екатерина Андреевна</div>
                    <div className="text-xs text-[#4a83c6] dark:text-[#5fa3ed]">kate_mama_bot</div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-end mb-3">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#4a83c6] px-4 py-2.5 text-sm text-white shadow-sm dark:bg-[#3b6ea8]">
                      <span className="text-xs font-semibold opacity-70 block mb-0.5">Мама</span>
                      Привет! Проверяю связь. Тут очень удобно писать.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                      Супер! Я вижу это прямо в Telegram 🚀
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </header>

        {/* How it Works / The Concept */}
        <section className="mb-24">
          <h2 className="text-center text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            Как устроен мост
          </h2>
          <p className="mt-4 text-center text-slate-600 dark:text-slate-400">
            Один сервис, который соединяет два разных мира
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-6 lg:flex-row lg:gap-12">
            
            {/* Telegram Side */}
            <div className="flex w-full max-w-xs flex-col items-center rounded-3xl bg-white p-8 text-center shadow-lg shadow-slate-200/50 dark:bg-slate-900/50 dark:shadow-none lg:w-1/3">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400">
                <Smartphone className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Для вас</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Вы не устанавливаете новые приложения. Все сообщения от родных приходят в <strong>ваш Telegram</strong> через специального бота.
              </p>
            </div>

            {/* Bridge */}
            <div className="flex items-center text-slate-300 dark:text-slate-700 lg:rotate-0 rotate-90">
              <ArrowRight className="h-12 w-12" />
            </div>

            {/* Web Side */}
            <div className="flex w-full max-w-xs flex-col items-center rounded-3xl bg-white p-8 text-center shadow-lg shadow-slate-200/50 dark:bg-slate-900/50 dark:shadow-none lg:w-1/3">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Globe className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Для близких</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Родные открывают <strong>простую ссылку в браузере</strong> на телефоне или компьютере. Им не нужен VPN, регистрация или пароли.
              </p>
            </div>

          </div>
        </section>

        {/* Setup Steps */}
        <section className="mb-24 rounded-[3rem] bg-white/50 px-6 py-16 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-xl dark:bg-slate-900/30 dark:ring-white/10 sm:p-16">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              Настройка за 3 простых шага
            </h2>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Не нужно быть программистом. Вам потребуется всего 1 минута.
            </p>
          </div>

          <div className="mx-auto max-w-4xl space-y-5">
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 p-6 dark:bg-slate-800/50 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex items-center gap-4 sm:w-64 sm:flex-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white dark:bg-white dark:text-slate-900">
                    1
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4a83c6]/10 text-[#4a83c6] dark:bg-[#5fa3ed]/10 dark:text-[#5fa3ed]">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Создайте бота</h3>
                </div>
                <div className="flex-1 text-slate-600 dark:text-slate-400">
                  <p className="leading-7">
                    Напишите <strong>@BotFather</strong> в Telegram и отправьте команду <code>/newbot</code>. Сначала укажите имя родственника на русском, например <code>Екатерина Андреевна</code>, затем задайте username на английском с нижними подчеркиваниями, например <code>kate_mama_bot</code> - слово <code>bot</code> в конце обязательно.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center py-1 text-slate-300 dark:text-slate-600">
              <ArrowRight className="h-8 w-8 rotate-90" />
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 p-6 dark:bg-slate-800/50 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex items-center gap-4 sm:w-64 sm:flex-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white dark:bg-white dark:text-slate-900">
                    2
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4a83c6]/10 text-[#4a83c6] dark:bg-[#5fa3ed]/10 dark:text-[#5fa3ed]">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Добавьте токен</h3>
                </div>
                <div className="flex-1 text-slate-600 dark:text-slate-400">
                  <p className="leading-7">
                    Авторизуйтесь на этом сайте через свой Telegram и вставьте скопированный токен в панель управления. Никаких паролей или сложной регистрации не нужно.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center py-1 text-slate-300 dark:text-slate-600">
              <ArrowRight className="h-8 w-8 rotate-90" />
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 p-6 dark:bg-slate-800/50 sm:p-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="flex items-center gap-4 sm:w-64 sm:flex-none">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-lg font-bold text-white dark:bg-white dark:text-slate-900">
                    3
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4a83c6]/10 text-[#4a83c6] dark:bg-[#5fa3ed]/10 dark:text-[#5fa3ed]">
                    <LinkIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Отправьте ссылку</h3>
                </div>
                <div className="flex-1 text-slate-600 dark:text-slate-400">
                  <p className="leading-7">
                    Скопируйте вашу персональную ссылку на чат и отправьте маме, бабушке или любому близкому человеку. Они просто откроют страницу и смогут сразу написать вам.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 flex justify-center">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:scale-105 dark:bg-white dark:text-slate-900"
            >
              Начать настройку
            </Link>
          </div>
        </section>

        {/* Ideal for / Use Cases */}
        <section className="mb-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
                Идеально подходит для семьи
              </h2>
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Обход блокировок</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Если в регионе ваших близких блокируют мессенджеры, браузерная версия часто продолжает работать без сбоев.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Для пожилых людей</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Крупный шрифт, привычные &quot;пузырьки&quot; сообщений, никаких лишних кнопок. Только окно чата.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Сообщения приходят сразу</h3>
                    <p className="mt-1 text-slate-600 dark:text-slate-400">Близкие пишут в простом окне браузера, а вы отвечаете им из привычного Telegram без переключения между сервисами.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-amber-100 to-orange-50 p-8 dark:from-slate-800 dark:to-slate-900 sm:p-12">
               <div className="relative z-10 text-center">
                 <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-4xl shadow-xl dark:bg-slate-800">
                   👵
                 </div>
                 <blockquote className="text-xl italic leading-relaxed text-slate-700 dark:text-slate-300">
                   «Я просто нажимаю на закладку в телефоне, и сразу могу написать сыну. Очень удобно, не нужно просить соседей настраивать VPN!»
                 </blockquote>
               </div>
               {/* Decorative background shapes */}
               <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-orange-200/50 blur-3xl dark:bg-blue-900/30"></div>
               <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-amber-200/50 blur-3xl dark:bg-purple-900/30"></div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-900/5 pb-8 pt-12 text-center dark:border-white/5">
          <div className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900 dark:text-white mb-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#6fa6d9] to-[#376fb3] text-white">
              <Zap className="h-4 w-4" />
            </span>
            Telegram Bridge
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Делаем общение с близкими проще, вне зависимости от расстояний и блокировок.
          </p>
        </footer>

      </div>
    </div>
  );
}
