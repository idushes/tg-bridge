import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    TELEGRAM_BOT_ID: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID,
    BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    DATABASE_URL: !!(process.env.DATABASE_URL ?? process.env.POSTGRES_URL),
    VAPID_PUBLIC_KEY: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: !!process.env.VAPID_PRIVATE_KEY,
    MESSAGE_LIMIT: !!process.env.DEFAULT_MESSAGE_LIMIT,
    DEFAULT_MESSAGE_LIMIT: process.env.DEFAULT_MESSAGE_LIMIT ?? null,
  });
}
