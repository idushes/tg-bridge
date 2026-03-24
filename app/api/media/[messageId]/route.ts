import { NextRequest, NextResponse } from 'next/server';
import { getChatByInviteToken, getMessageById, getBotConfig } from '@/lib/blob';
import { downloadFile, getFile } from '@/lib/telegram';

function inferContentType(filePath: string, mediaType?: string) {
  const extension = filePath.split('.').pop()?.toLowerCase();

  if (extension) {
    if (extension === 'webm') {
      return mediaType === 'audio' || mediaType === 'voice' ? 'audio/webm' : 'video/webm';
    }

    const extensionMap: Record<string, string> = {
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      ogg: 'audio/ogg',
      oga: 'audio/ogg',
      mp4: 'video/mp4',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };

    if (extensionMap[extension]) {
      return extensionMap[extension];
    }
  }

  const contentTypeMap: Record<string, string> = {
    photo: 'image/jpeg',
    video: 'video/mp4',
    voice: 'audio/ogg',
    video_note: 'video/mp4',
    audio: 'audio/mpeg',
    document: 'application/octet-stream',
  };

  return mediaType ? contentTypeMap[mediaType] || 'application/octet-stream' : 'application/octet-stream';
}

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

  return new Response(fileData as unknown as BodyInit, {
    headers: {
      'Content-Type': inferContentType(filePath, message.mediaType),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
