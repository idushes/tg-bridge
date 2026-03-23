import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getBotConfig, getChatMeta, addMessageToChat, listUserChats } from '@/lib/blob';
import { extractMessageFromUpdate, sendMessageToChat } from '@/lib/telegram';
import type { Message, TelegramUpdate } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const { botId } = await params;
  const botIdNum = parseInt(botId);

  if (isNaN(botIdNum)) {
    return NextResponse.json({ error: 'Invalid bot ID' }, { status: 400 });
  }

  const botConfig = await getBotConfig(botIdNum);
  if (!botConfig) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  try {
    const update = await request.json() as TelegramUpdate;
    const messageData = extractMessageFromUpdate(update);

    if (!messageData) {
      return NextResponse.json({ ok: true });
    }

    const chats = await listUserChats(botConfig.ownerTelegramId);
    const chat = chats.find(c => c.botId === botIdNum);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not configured' }, { status: 404 });
    }

    const message: Message = {
      id: uuidv4(),
      text: messageData.text,
      from: 'user',
      timestamp: new Date().toISOString(),
      mediaType: messageData.mediaType,
      mediaFileId: messageData.mediaFileId,
      botId: botIdNum,
    };

    await addMessageToChat(chat.inviteToken, message, chat.messageLimit);

    const isFirstMessage = chat.parentTelegramId === 0;
    if (isFirstMessage) {
      const { saveChatMeta } = await import('@/lib/blob');
      const updatedMeta = {
        ...chat,
        parentTelegramId: messageData.chatId,
        updatedAt: new Date().toISOString(),
      };
      await saveChatMeta(chat.inviteToken, updatedMeta);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}