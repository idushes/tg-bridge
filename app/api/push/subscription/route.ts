import { NextRequest, NextResponse } from 'next/server';
import { getChatByInviteToken, savePushSubscription, deletePushSubscription } from '@/lib/blob';
import { getPushSubscriptionId, normalizePushSubscription } from '@/lib/push';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      inviteToken?: string;
      subscription?: PushSubscriptionJSON;
    };

    if (!body.inviteToken || !body.subscription) {
      return NextResponse.json({ error: 'Missing inviteToken or subscription' }, { status: 400 });
    }

    const chatData = await getChatByInviteToken(body.inviteToken);
    if (!chatData) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    const normalized = normalizePushSubscription(body.subscription);
    await savePushSubscription(body.inviteToken, normalized);

    return NextResponse.json({ success: true, subscriptionId: normalized.id });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json() as {
      inviteToken?: string;
      endpoint?: string;
    };

    if (!body.inviteToken || !body.endpoint) {
      return NextResponse.json({ error: 'Missing inviteToken or endpoint' }, { status: 400 });
    }

    const chatData = await getChatByInviteToken(body.inviteToken);
    if (!chatData) {
      return NextResponse.json({ error: 'Invalid invite token' }, { status: 404 });
    }

    await deletePushSubscription(body.inviteToken, getPushSubscriptionId(body.endpoint));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
