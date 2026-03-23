import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-4xl font-bold text-zinc-900 mb-4">
            TG Bridge
          </h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
            Общение с близкими через Telegram без ограничений
          </p>
        </header>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-6 text-center">
            Как это работает
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">1</div>
              <h3 className="font-semibold text-zinc-900 mb-2">Добавьте бота</h3>
              <p className="text-zinc-600 text-sm">
                Создайте бота через @BotFather в Telegram и получите токен
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">2</div>
              <h3 className="font-semibold text-zinc-900 mb-2">Создайте ссылку</h3>
              <p className="text-zinc-600 text-sm">
                Войдите в админку, добавьте токен бота и сгенерируйте ссылку для близких
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-3xl mb-3">3</div>
              <h3 className="font-semibold text-zinc-900 mb-2">Общайтесь</h3>
              <p className="text-zinc-600 text-sm">
                Отправьте ссылку родственникам — они смогут писать вам прямо через браузер
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-zinc-900 mb-6 text-center">
            Зачем это нужно
          </h2>
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <ul className="space-y-4 text-zinc-700">
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

        <section className="text-center mb-16">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-colors"
          >
            Войти через Telegram
          </Link>
          <p className="mt-4 text-sm text-zinc-500">
            Требуется Telegram для авторизации
          </p>
        </section>

        <footer className="text-center text-sm text-zinc-400">
          <p>TG Bridge — помогаем близким оставаться на связи</p>
        </footer>
      </div>
    </div>
  );
}