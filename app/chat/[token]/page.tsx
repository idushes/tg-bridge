import { getChatByInviteToken, listBotChats } from '@/lib/blob';
import ChatListClient from './ChatListClient';

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const chatData = await getChatByInviteToken(token);
  
  if (!chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Ссылка недействительна</h1>
          <p className="text-zinc-600">Попросите отправить новую ссылку</p>
        </div>
      </div>
    );
  }

  const chats = await listBotChats(chatData.botId);
  const botConfig = chatData.config;

  return <ChatListClient token={token} botName={botConfig.botName} chats={chats} />;
}
