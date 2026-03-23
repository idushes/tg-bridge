import { NextRequest, NextResponse } from 'next/server';
import { listUserBots, listBotChats } from '@/lib/blob';

// GET /api/chats?botId=123 - list all chats for a bot
export async function GET(request: NextRequest) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');

  if (!botId) {
    return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
  }

  // Verify ownership
  const bots = await listUserBots(parseInt(telegramId));
  const bot = bots.find(b => b.botId === parseInt(botId));
  if (!bot) {
    return NextResponse.json({ error: 'Bot not found or not owned by user' }, { status: 404 });
  }

  const chats = await listBotChats(parseInt(botId));
  return NextResponse.json({ chats });
}