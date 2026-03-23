import { NextRequest, NextResponse } from 'next/server';
import { getChatMeta, getChatMessages, addMessageToChat, getBotConfig } from '@/lib/blob';
import { sendMessageToChat } from '@/lib/telegram';
import type { Message } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  
  const meta = await getChatMeta(chatId);
  if (!meta) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  if (!meta.parentTelegramId) {
    return NextResponse.json({ error: 'Parent not connected yet' }, { status: 400 });
  }

  const botConfig = await getBotConfig(meta.botId);
  if (!botConfig) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { text } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    const sent = await sendMessageToChat(botConfig.botToken, meta.parentTelegramId, text);
    if (!sent) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    const message: Message = {
      id: uuidv4(),
      text: text.trim(),
      from: 'operator',
      timestamp: new Date().toISOString(),
    };

    await addMessageToChat(chatId, message, meta.messageLimit);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}