import { NextRequest, NextResponse } from 'next/server';
import { getChatMeta, getChatMessages } from '@/lib/blob';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const meta = await getChatMeta(chatId);
  
  if (!meta) {
    return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
  }

  const messages = await getChatMessages(chatId);
  return NextResponse.json({ messages: messages.messages });
}