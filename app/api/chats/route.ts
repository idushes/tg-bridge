import { NextRequest, NextResponse } from 'next/server';
import { getChatByInviteToken, listUserBots, listBotChats } from '@/lib/blob';
import { backfillChatAvatars } from '@/lib/chatAvatars';

// GET /api/chats?botId=123 - list all chats for a bot
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const inviteToken = searchParams.get('inviteToken');

  if (inviteToken) {
    const chatData = await getChatByInviteToken(inviteToken);
    if (!chatData) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    const chats = await backfillChatAvatars(chatData.config.botToken, await listBotChats(chatData.botId));
    return NextResponse.json(
      { chats },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' } }
    );
  }

  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

  const chats = await backfillChatAvatars(bot.botToken, await listBotChats(parseInt(botId)));
  return NextResponse.json({ chats });
}
