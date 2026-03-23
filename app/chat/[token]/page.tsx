import { getChatMeta, getChatMessages } from '@/lib/blob';
import ChatClient from './ChatClient';

export default async function ChatPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const meta = await getChatMeta(token);
  
  if (!meta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Чат не найден</h1>
          <p className="text-zinc-600">Ссылка может быть недействительна</p>
        </div>
      </div>
    );
  }

  const messages = await getChatMessages(token);

  return <ChatClient chatToken={token} initialMessages={messages.messages} partnerName={meta.partnerName} />;
}