import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "TG Bridge - Общение с близкими через Telegram",
  description: "Обходите блокировки и общайтесь с близкими через Telegram без ограничений",
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
          async
          src="https://telegram.org/js/telegram-widget.js?21"
          data-telegram-login={process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID || "your_bot"}
          data-request-access="write"
          data-auth-url={process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL || ""}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}