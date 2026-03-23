import { NextRequest, NextResponse } from 'next/server';
import { getChatMeta, getChatMessages, getBotConfig } from '@/lib/blob';
import { downloadFile } from '@/lib/telegram';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const { messageId } = await params;
  const url = new URL(request.url);
  const inviteToken = url.searchParams.get('chat');

  if (!inviteToken) {
    return NextResponse.json({ error: 'Missing chat parameter' }, { status: 400 });
  }

  const meta = await getChatMeta(inviteToken);
  if (!meta) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const messages = await getChatMessages(inviteToken);
  const message = messages.messages.find(m => m.id === messageId);

  if (!message || !message.mediaFileId || !message.botId) {
    return NextResponse.json({ error: 'Media not found' }, { status: 404 });
  }

  const botConfig = await getBotConfig(message.botId);
  if (!botConfig) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  const filePath = await downloadFile(botConfig.botToken, message.mediaFileId);
  if (!filePath) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
  }

  const contentTypeMap: Record<string, string> = {
    photo: 'image/jpeg',
    video: 'video/mp4',
    voice: 'audio/ogg',
    document: 'application/octet-stream',
  };

  return new Response(filePath as unknown as BodyInit, {
    headers: {
      'Content-Type': contentTypeMap[message.mediaType!] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}