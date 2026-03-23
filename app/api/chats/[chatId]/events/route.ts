import { NextRequest } from 'next/server';
import { getChatByInviteToken, getChatMessagesSince } from '@/lib/blob';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  const { chatId } = await params;
  const participantChatId = parseInt(chatId);

  if (isNaN(participantChatId)) {
    return new Response('Invalid chat ID', { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const inviteToken = searchParams.get('inviteToken');
  const lastSeq = Number(searchParams.get('lastSeq') ?? '0');

  if (!inviteToken) {
    return new Response('Missing inviteToken', { status: 400 });
  }

  const chatData = await getChatByInviteToken(inviteToken);
  if (!chatData) {
    return new Response('Invalid invite token', { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let active = true;
      let currentSeq = Number.isFinite(lastSeq) ? lastSeq : 0;

      const close = () => {
        active = false;
        try {
          controller.close();
        } catch {
          // ignore
        }
      };

      request.signal.addEventListener('abort', close);

      controller.enqueue(encoder.encode(': connected\n\n'));

      while (active) {
        const nextMessages = await getChatMessagesSince(chatData.botId, participantChatId, currentSeq);

        for (const message of nextMessages.messages) {
          currentSeq = Math.max(currentSeq, message.seq ?? 0);
          controller.enqueue(
            encoder.encode(`event: message\ndata: ${JSON.stringify(message)}\n\n`)
          );
        }

        controller.enqueue(encoder.encode(': heartbeat\n\n'));
        await wait(1500);
      }
    },
    cancel() {
      // noop
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Connection: 'keep-alive',
    },
  });
}
