import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ServiceWorkerRegistration from "./ServiceWorkerRegistration";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Telegram Bridge",
  description: "Обходите блокировки и общайтесь с близкими через Telegram без ограничений",
  manifest: "/manifest.webmanifest",
  applicationName: "Telegram Bridge",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Telegram Bridge",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function onTelegramAuth(user) {
                localStorage.setItem('telegram_id', user.id.toString());
                localStorage.setItem('telegram_name', user.first_name || user.username || 'Пользователь');
                window.location.reload();
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
