import { NextRequest, NextResponse } from 'next/server';
import { getChatMeta, saveChatMeta, getBotConfig, deleteChatData } from '@/lib/blob';
import type { ChatMeta } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const meta = await getChatMeta(chatId);
  
  if (!meta) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  return NextResponse.json({ 
    chat: {
      inviteToken: meta.inviteToken,
      partnerName: meta.partnerName,
      messageLimit: meta.messageLimit,
      createdAt: meta.createdAt,
    }
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  const meta = await getChatMeta(chatId);
  
  if (!meta) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const botConfig = await getBotConfig(meta.botId);
  if (!botConfig || botConfig.ownerTelegramId !== parseInt(telegramId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { partnerName, messageLimit, regenerateLink } = body;

    if (regenerateLink) {
      const { v4: uuidv4 } = await import('uuid');
      const newToken = uuidv4();
      await deleteChatData(chatId);
      
      const newMeta: ChatMeta = {
        ...meta,
        inviteToken: newToken,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      await saveChatMeta(newToken, newMeta);
      
      return NextResponse.json({ 
        success: true, 
        inviteToken: newToken,
        inviteUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/chat/${newToken}`,
      });
    }

    const updatedMeta: ChatMeta = {
      ...meta,
      ...(partnerName && { partnerName }),
      ...(messageLimit && { messageLimit }),
      updatedAt: new Date().toISOString(),
    };

    await saveChatMeta(chatId, updatedMeta);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await params;
  const meta = await getChatMeta(chatId);
  
  if (!meta) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const botConfig = await getBotConfig(meta.botId);
  if (!botConfig || botConfig.ownerTelegramId !== parseInt(telegramId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deleteChatData(chatId);
  return NextResponse.json({ success: true });
}