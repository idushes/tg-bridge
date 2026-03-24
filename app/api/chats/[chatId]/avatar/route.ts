import { NextRequest, NextResponse } from 'next/server';
import { getBotConfig, getChatByInviteToken, getChatMeta } from '@/lib/blob';
import { downloadFile, getFile } from '@/lib/telegram';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const participantChatId = Number(chatId);
  const inviteToken = new URL(request.url).searchParams.get('inviteToken');

  if (!inviteToken || Number.isNaN(participantChatId)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const chatData = await getChatByInviteToken(inviteToken);
  if (!chatData) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
  }

  const chat = await getChatMeta(chatData.botId, participantChatId);
  if (!chat?.participantPhotoFileId) {
    return NextResponse.json({ error: 'Avatar not found' }, { status: 404 });
  }

  const botConfig = await getBotConfig(chatData.botId);
  if (!botConfig) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  const filePath = await getFile(botConfig.botToken, chat.participantPhotoFileId);
  if (!filePath) {
    return NextResponse.json({ error: 'Failed to resolve avatar' }, { status: 500 });
  }

  const fileData = await downloadFile(botConfig.botToken, filePath);
  if (!fileData) {
    return NextResponse.json({ error: 'Failed to download avatar' }, { status: 500 });
  }

  return new Response(fileData as unknown as BodyInit, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
