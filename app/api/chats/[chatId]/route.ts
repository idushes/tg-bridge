import { NextRequest, NextResponse } from 'next/server';
import { getBotConfig, listBotChats, getChatMessages, getChatByInviteToken } from '@/lib/blob';

// GET /api/chats/[chatId]?botId=123 - get chat messages
// chatId here is participantChatId
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const participantChatId = parseInt(chatId);
  
  if (isNaN(participantChatId)) {
    return NextResponse.json({ error: 'Invalid chat ID' }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const botId = searchParams.get('botId');
  const inviteToken = searchParams.get('inviteToken');

  // Access via invite token (parent web interface)
  if (inviteToken) {
    const chatData = await getChatByInviteToken(inviteToken);
    if (!chatData) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }
    
    const messages = await getChatMessages(chatData.botId, participantChatId);
    return NextResponse.json({ 
      messages: messages.messages,
      botId: chatData.botId 
    });
  }

  // Access via bot ownership (admin interface)
  if (!botId) {
    return NextResponse.json({ error: 'Missing botId or inviteToken' }, { status: 400 });
  }

  const messages = await getChatMessages(parseInt(botId), participantChatId);
  return NextResponse.json({ messages: messages.messages });
}