import { getChatByInviteToken, listBotChats, getChatMessages } from '@/lib/blob';

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

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-xl font-bold text-zinc-900 mb-4">{botConfig.botName}</h1>
        <p className="text-zinc-600 mb-4">Выберите чат для общения:</p>
        
        {chats.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-zinc-500">Пока没有人 не писал боту</p>
            <p className="text-zinc-400 text-sm mt-2">Отправьте /start боту в Telegram</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chats.map((chat) => (
              <a
                key={chat.participantChatId}
                href={`/chat/${token}/${chat.participantChatId}`}
                className="block bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-zinc-900">
                      {chat.participantFirstName || chat.participantUsername || `Чат ${chat.participantChatId}`}
                    </h3>
                    <p className="text-sm text-zinc-500">
                      {chat.participantUsername && `@${chat.participantUsername}`}
                    </p>
                  </div>
                  <span className="text-zinc-400">→</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}