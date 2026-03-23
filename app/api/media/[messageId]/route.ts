import { NextRequest, NextResponse } from 'next/server';
import { getChatByInviteToken, getMessageById, getBotConfig } from '@/lib/blob';
import { downloadFile, getFile } from '@/lib/telegram';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('inviteToken');
  const botId = url.searchParams.get('botId');

  if (!inviteToken || !botId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  const chatData = await getChatByInviteToken(inviteToken);
  if (!chatData) {
    return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
  }

  if (chatData.botId !== parseInt(botId)) {
    return NextResponse.json({ error: 'Invalid bot' }, { status: 403 });
  }

  const message = await getMessageById(messageId);

  if (!message || !message.mediaFileId) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  const botConfig = await getBotConfig(chatData.botId);
  if (!botConfig) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  const filePath = await getFile(botConfig.botToken, message.mediaFileId);
  if (!filePath) {
    return NextResponse.json({ error: 'Failed to resolve file path' }, { status: 500 });
  }

  const fileData = await downloadFile(botConfig.botToken, filePath);
  if (!fileData) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }

  const contentTypeMap: Record<string, string> = {
    photo: 'image/jpeg',
    video: 'video/mp4',
    voice: 'audio/ogg',
    document: 'application/octet-stream',
  };

  return new Response(fileData as unknown as BodyInit, {
    headers: {
      'Content-Type': contentTypeMap[message.mediaType!] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
