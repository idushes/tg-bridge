import { getChatByInviteToken, listBotChats } from '@/lib/blob';
import ChatClient from './ChatClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }: { params: Promise<{ token: string; chatId: string }> }) {
  const { token, chatId } = await params;
  const participantChatId = parseInt(chatId);
  
  const chatData = await getChatByInviteToken(token);
  
  if (!chatData || isNaN(participantChatId)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Чат не найден</h1>
          <p className="text-zinc-600">Ссылка может быть недействительна</p>
        </div>
      </div>
    );
  }

  const chats = await listBotChats(chatData.botId);
  const activeChat = chats.find((chat) => chat.participantChatId === participantChatId);
  const partnerName = activeChat?.participantFirstName || activeChat?.participantUsername || `Чат ${participantChatId}`;

  return (
    <ChatClient 
      inviteToken={token}
      botId={chatData.botId}
      chatId={participantChatId}
      initialMessages={[]} 
      partnerName={partnerName} 
      chats={chats}
    />
  );
}
