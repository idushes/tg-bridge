import { NextRequest, NextResponse } from 'next/server';
import { getBotInfo } from '@/lib/telegram';
import { deleteChatData, getBotConfig } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { botToken?: string; chatIds?: unknown };
    const botToken = body.botToken?.trim();
    const rawChatIds = Array.isArray(body.chatIds) ? body.chatIds : [];

    if (!botToken || rawChatIds.length === 0) {
      return NextResponse.json({ error: 'Missing botToken or chatIds' }, { status: 400 });
    }

    const chatIds = rawChatIds
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (chatIds.length === 0) {
      return NextResponse.json({ error: 'No valid chatIds provided' }, { status: 400 });
    }

    const botInfo = await getBotInfo(botToken);
    if (!botInfo) {
      return NextResponse.json({ error: 'Invalid bot token' }, { status: 401 });
    }

    const botConfig = await getBotConfig(botInfo.id);
    if (!botConfig || botConfig.botToken !== botToken) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    await Promise.all(chatIds.map((chatId) => deleteChatData(botInfo.id, chatId)));

    return NextResponse.json({ success: true, deletedChatIds: chatIds });
  } catch (error) {
    console.error('Error cleaning chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
