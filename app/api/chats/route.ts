import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getBotConfig, saveChatMeta, listUserChats } from '@/lib/blob';
import type { ChatMeta } from '@/lib/types';

export async function GET(request: NextRequest) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const chats = await listUserChats(parseInt(telegramId));
  return NextResponse.json({ chats });
}

export async function POST(request: NextRequest) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { botId, partnerName } = body;

    if (!botId || !partnerName) {
      return NextResponse.json({ error: 'Missing botId or partnerName' }, { status: 400 });
    }

    const botConfig = await getBotConfig(parseInt(botId));
    if (!botConfig) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    if (botConfig.ownerTelegramId !== parseInt(telegramId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const inviteToken = uuidv4();
    const meta: ChatMeta = {
      botId: parseInt(botId),
      inviteToken,
      partnerName,
      participantChatId: 0,
      messageLimit: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveChatMeta(inviteToken, meta);

    return NextResponse.json({ 
      success: true, 
      inviteToken,
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${inviteToken}`,
    });
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}