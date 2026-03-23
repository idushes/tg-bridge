import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    TELEGRAM_BOT_ID: !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID,
    BASE_URL: !!process.env.NEXT_PUBLIC_BASE_URL,
    BLOB_TOKEN: !!process.env.BLOB_READ_WRITE_TOKEN,
    MESSAGE_LIMIT: !!process.env.DEFAULT_MESSAGE_LIMIT,
    DEFAULT_MESSAGE_LIMIT: process.env.DEFAULT_MESSAGE_LIMIT ?? null,
  });
}
