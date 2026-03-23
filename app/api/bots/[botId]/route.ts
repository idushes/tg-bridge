import { NextRequest, NextResponse } from 'next/server';
import { deleteBotConfig, getBotConfig, listUserChats, deleteChatData } from '@/lib/blob';
import { deleteWebhook } from '@/lib/telegram';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ botId: string }> }
) {
  const telegramId = request.headers.get('x-telegram-id');
  if (!telegramId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { botId } = await params;
  const botIdNum = parseInt(botId);

  if (isNaN(botIdNum)) {
    return NextResponse.json({ error: 'Invalid bot ID' }, { status: 400 });
  }

  const botConfig = await getBotConfig(botIdNum);
  if (!botConfig) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
  }

  if (botConfig.ownerTelegramId !== parseInt(telegramId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const chats = await listUserChats(parseInt(telegramId));
  for (const chat of chats) {
    if (chat.botId === botIdNum) {
      await deleteChatData(chat.inviteToken);
    }
  }

  await deleteWebhook(botConfig.botToken);
  await deleteBotConfig(botIdNum);

  return NextResponse.json({ success: true });
}