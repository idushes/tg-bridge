import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getBotInfo, setWebhook } from '@/lib/telegram';
import { 
  saveBotConfig, 
  getBotConfig, 
  listUserBots, 
  saveChatMeta
} from '@/lib/blob';
import type { BotConfig, ChatMeta } from '@/lib/types';

const DEFAULT_MESSAGE_LIMIT = parseInt(process.env.DEFAULT_MESSAGE_LIMIT || '100');

export async function GET(request: NextRequest) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bots = await listUserBots(parseInt(telegramId));
  return NextResponse.json({ bots });
}

export async function POST(request: NextRequest) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { botToken, partnerName } = body;

    if (!botToken || !partnerName) {
      return NextResponse.json({ error: 'Missing botToken or partnerName' }, { status: 400 });
    }

    const botInfo = await getBotInfo(botToken);
    if (!botInfo) {
      return NextResponse.json({ error: 'Invalid bot token' }, { status: 400 });
    }

    const existingConfig = await getBotConfig(botInfo.id);
    if (existingConfig) {
      return NextResponse.json({ error: 'Bot already registered' }, { status: 400 });
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhook/${botInfo.id}`;
    const webhookSet = await setWebhook(botToken, webhookUrl);
    if (!webhookSet) {
      console.error('Failed to set webhook for bot', botInfo.id);
    }

    const config: BotConfig = {
      botToken,
      botId: botInfo.id,
      botUsername: botInfo.username,
      botName: botInfo.first_name,
      ownerTelegramId: parseInt(telegramId),
      createdAt: new Date().toISOString(),
    };

    await saveBotConfig(botInfo.id, config);

    const inviteToken = uuidv4();
    const meta: ChatMeta = {
      botId: botInfo.id,
      inviteToken,
      partnerName,
      participantChatId: 0,
      messageLimit: DEFAULT_MESSAGE_LIMIT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveChatMeta(inviteToken, meta);

    return NextResponse.json({ 
      success: true, 
      bot: { id: botInfo.id, name: botInfo.first_name, username: botInfo.username },
      inviteToken,
      inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${inviteToken}`,
    });
  } catch (error) {
    console.error('Error adding bot:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}