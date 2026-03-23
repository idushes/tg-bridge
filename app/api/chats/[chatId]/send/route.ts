import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getChatByInviteToken, getChatMeta, addMessageToChat } from '@/lib/blob';
import { sendMessageToChat } from '@/lib/telegram';
import type { Message } from '@/lib/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const participantChatId = parseInt(chatId);
  
  if (isNaN(participantChatId)) {
    return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const inviteToken = searchParams.get('inviteToken');
  
  if (!inviteToken) {
    return NextResponse.json({ error: 'Missing inviteToken' }, { status: 400 });
  }

  const chatData = await getChatByInviteToken(inviteToken);
  if (!chatData) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    // Send message to Telegram
    const sent = await sendMessageToChat(chatData.config.botToken, participantChatId, text);
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send message to Telegram' }, { status: 500 });
    }

    // Save message to chat
    const message: Message = {
      id: uuidv4(),
      text: text.trim(),
      from: 'user', // Message from parent (web user)
      timestamp: new Date().toISOString(),
    };

    const chatMeta = await getChatMeta(chatData.botId, participantChatId);
    const messageLimit = chatMeta?.messageLimit ?? parseInt(process.env.DEFAULT_MESSAGE_LIMIT || '100');

    await addMessageToChat(chatData.botId, participantChatId, message, messageLimit);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
