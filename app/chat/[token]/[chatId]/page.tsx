import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ChatPage({ params }: { params: Promise<{ token: string; chatId: string }> }) {
  const { token } = await params;
  redirect(`/chat/${token}`);
}
