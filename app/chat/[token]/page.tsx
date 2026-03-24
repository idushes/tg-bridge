import { getChatByInviteToken, listBotChats } from '@/lib/blob';
import { backfillChatAvatars } from '@/lib/chatAvatars';
import ChatListClient from './ChatListClient';
import ChatClient from './[chatId]/ChatClient';

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

  const botConfig = chatData.config;
  const chats = await backfillChatAvatars(botConfig.botToken, await listBotChats(chatData.botId));

  if (chats.length > 0) {
    const initialChat = chats[0];
    const partnerName = initialChat.participantFirstName || initialChat.participantUsername || `Чат ${initialChat.participantChatId}`;

    return (
      <ChatClient
        inviteToken={token}
        botId={chatData.botId}
        chatId={initialChat.participantChatId}
        initialMessages={[]}
        partnerName={partnerName}
        chats={chats}
        botUsername={botConfig.botUsername}
      />
    );
  }

  return <ChatListClient token={token} botName={botConfig.botName} botUsername={botConfig.botUsername} chats={chats} />;
}
