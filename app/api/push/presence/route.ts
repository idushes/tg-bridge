import { NextRequest, NextResponse } from 'next/server';
import { deletePushPresence, getChatByInviteToken, savePushPresence } from '@/lib/blob';
import type { PushPresence } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      inviteToken?: string;
      clientId?: string;
      subscriptionId?: string;
      activeChatId?: number | null;
    };

    if (!body.inviteToken || !body.clientId || !body.subscriptionId) {
      return NextResponse.json({ error: 'Missing presence fields' }, { status: 400 });
    }

    const chatData = await getChatByInviteToken(body.inviteToken);
    if (!chatData) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    const presence: PushPresence = {
      clientId: body.clientId,
      subscriptionId: body.subscriptionId,
      activeChatId: typeof body.activeChatId === 'number' ? body.activeChatId : null,
      updatedAt: new Date().toISOString(),
    };

    await savePushPresence(chatData.botId, presence);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as {
      inviteToken?: string;
      clientId?: string;
    };

    if (!body.inviteToken || !body.clientId) {
      return NextResponse.json({ error: 'Missing inviteToken or clientId' }, { status: 400 });
    }

    const chatData = await getChatByInviteToken(body.inviteToken);
    if (!chatData) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    await deletePushPresence(chatData.botId, body.clientId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
