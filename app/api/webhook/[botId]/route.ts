import { NextRequest, NextResponse } from 'next/server';
import { getBotConfig, listUserChats, saveChatMeta } from '@/lib/blob';
import { extractMessageFromUpdate } from '@/lib/telegram';
import type { Message, TelegramUpdate, ChatMeta } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

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

    // Find chat for this bot
    const chats = await listUserChats(botConfig.ownerTelegramId);
    const chat = chats.find(c => c.botId === botIdNum) ?? null;

    if (!chat) {
      return NextResponse.json({ error: 'Chat not configured' }, { status: 404 });
    }

    const message: Message = {
      id: uuidv4(),
      text: messageData.text,
      from: 'operator', // Message from Telegram user (son/participant)
      timestamp: new Date().toISOString(),
      mediaType: messageData.mediaType,
      mediaFileId: messageData.mediaFileId,
      botId: botIdNum,
    };

    const { addMessageToChat } = await import('@/lib/blob');
    await addMessageToChat(chat.inviteToken, message, chat.messageLimit);

    // Update participantChatId if first message
    if (chat.participantChatId === 0) {
      const updatedMeta: ChatMeta = {
        ...chat,
        participantChatId: messageData.chatId,
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