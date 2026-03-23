import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getChatByInviteToken, getChatMeta, addMessageToChat } from '@/lib/blob';
import { sendMessageToChat, sendPhotoFile } from '@/lib/telegram';
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
    const contentType = request.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');
    const body = isMultipart ? await request.formData() : await request.json();
    const text = isMultipart
      ? String(body.get('text') || '').trim()
      : String(body.text || '').trim();
    const photo = isMultipart ? body.get('photo') : null;

    if (!text && !(photo instanceof File)) {
      return NextResponse.json({ error: 'Empty message' }, { status: 400 });
    }

    if (photo instanceof File && !photo.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are supported' }, { status: 400 });
    }

    let mediaType: Message['mediaType'];
    let mediaFileId: string | undefined;

    if (photo instanceof File) {
      const uploaded = await sendPhotoFile(chatData.config.botToken, participantChatId, photo, text || undefined);
      if (!uploaded.ok) {
        return NextResponse.json({ error: 'Failed to send photo to Telegram' }, { status: 500 });
      }

      mediaType = 'photo';
      mediaFileId = uploaded.fileId;
    } else {
      const sent = await sendMessageToChat(chatData.config.botToken, participantChatId, text);
      if (!sent) {
        return NextResponse.json({ error: 'Failed to send message to Telegram' }, { status: 500 });
      }
    }

    const message: Message = {
      id: uuidv4(),
      text,
      from: 'user',
      timestamp: new Date().toISOString(),
      mediaType,
      mediaFileId,
    };

    const chatMeta = await getChatMeta(chatData.botId, participantChatId);
    const messageLimit = chatMeta?.messageLimit ?? parseInt(process.env.DEFAULT_MESSAGE_LIMIT || '100');

    await addMessageToChat(chatData.botId, participantChatId, message, messageLimit);

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
