import { NextRequest, NextResponse } from 'next/server';
import { getBotConfig, getChatMeta, saveChatMeta, addMessageToChat } from '@/lib/blob';
import { sendChatPushNotifications } from '@/lib/push';
import { extractMessageFromUpdate, getUserProfilePhotoFileId, sendMessage } from '@/lib/telegram';
import type { Message, TelegramUpdate, ChatMeta } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

const UNSUPPORTED_MESSAGE_TEXT = 'Этот тип сообщения пока не поддерживается в веб-чате. Отправьте текст, фото, видео, голосовое или документ.';

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

    let existingChat = await getChatMeta(botIdNum, messageData.chatId);
    const participantPhotoFileId = existingChat?.participantPhotoFileId
      ?? await getUserProfilePhotoFileId(botConfig.botToken, messageData.chatId);

    // Create new chat if doesn't exist
    if (!existingChat) {
      const newChat: ChatMeta = {
        botId: botIdNum,
        participantChatId: messageData.chatId,
        participantName: update.message?.from?.first_name || update.message?.from?.username || 'User',
        participantFirstName: update.message?.from?.first_name,
        participantLastName: update.message?.from?.last_name,
        participantUsername: update.message?.from?.username,
        participantPhotoFileId: participantPhotoFileId ?? undefined,
        lastMessageText: undefined,
        lastMessageMediaType: undefined,
        lastMessageFrom: undefined,
        messageLimit: 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveChatMeta(botIdNum, messageData.chatId, newChat);
      existingChat = newChat;
    }

    // Filter out commands like /start
    const isCommand = messageData.text?.startsWith('/');
    if (isCommand) {
      // Just update chat timestamp, don't save command
      const updatedMeta: ChatMeta = {
        ...existingChat,
        participantPhotoFileId: participantPhotoFileId ?? existingChat.participantPhotoFileId,
        updatedAt: new Date().toISOString(),
      };
      await saveChatMeta(botIdNum, messageData.chatId, updatedMeta);
      return NextResponse.json({ ok: true });
    }

    if (messageData.unsupportedMessageType) {
      const notified = await sendMessage(botConfig.botToken, messageData.chatId, UNSUPPORTED_MESSAGE_TEXT);
      if (!notified) {
        console.error('Failed to send unsupported message notice:', {
          botId: botIdNum,
          chatId: messageData.chatId,
          unsupportedMessageType: messageData.unsupportedMessageType,
        });
      }

      const updatedMeta: ChatMeta = {
        ...existingChat,
        participantPhotoFileId: participantPhotoFileId ?? existingChat.participantPhotoFileId,
        updatedAt: new Date().toISOString(),
      };
      await saveChatMeta(botIdNum, messageData.chatId, updatedMeta);

      return NextResponse.json({ ok: true });
    }

    const message: Message = {
      id: uuidv4(),
      text: messageData.text,
      from: 'operator', // Message from Telegram user
      timestamp: new Date().toISOString(),
      mediaType: messageData.mediaType,
      mediaFileId: messageData.mediaFileId,
      botId: botIdNum,
    };

    const savedMessage = await addMessageToChat(botIdNum, messageData.chatId, message, existingChat.messageLimit);

    // Update chat metadata
    const updatedMeta: ChatMeta = {
      ...existingChat,
      participantPhotoFileId: participantPhotoFileId ?? existingChat.participantPhotoFileId,
      lastMessageText: message.text,
      lastMessageMediaType: message.mediaType,
      lastMessageFrom: message.from,
      updatedAt: new Date().toISOString(),
    };
    await saveChatMeta(botIdNum, messageData.chatId, updatedMeta);

    await sendChatPushNotifications(
      botIdNum,
      botConfig.inviteToken,
      messageData.chatId,
      updatedMeta.participantFirstName || updatedMeta.participantUsername || updatedMeta.participantName,
      savedMessage
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', {
      botId: botIdNum,
      error,
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
