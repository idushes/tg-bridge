import webpush, { type PushSubscription } from 'web-push';
import { createHash } from 'crypto';
import { deletePushSubscription, listPushPresence, listPushSubscriptions } from './blob';
import type { Message, PushPresence, StoredPushSubscription } from './types';

let configured = false;

function ensureConfigured() {
  if (configured) {
    return;
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    throw new Error('VAPID keys are not configured');
  }

  webpush.setVapidDetails('mailto:noreply@tg-bridge.local', publicKey, privateKey);
  configured = true;
}

export function getPushSubscriptionId(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex');
}

export function normalizePushSubscription(subscription: PushSubscriptionJSON): StoredPushSubscription {
  if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
    throw new Error('Invalid push subscription');
  }

  const now = new Date().toISOString();

  return {
    id: getPushSubscriptionId(subscription.endpoint),
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    createdAt: now,
    updatedAt: now,
  };
}

function toWebPushSubscription(subscription: StoredPushSubscription): PushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };
}

function hasActiveChatPresence(
  presenceItems: PushPresence[],
  subscriptionId: string,
  chatId: number
): boolean {
  const freshnessThreshold = Date.now() - 45_000;

  return presenceItems.some((presence) => (
    presence.subscriptionId === subscriptionId &&
    presence.activeChatId === chatId &&
    new Date(presence.updatedAt).getTime() >= freshnessThreshold
  ));
}

export async function sendChatPushNotifications(
  inviteToken: string,
  chatId: number,
  partnerName: string,
  message: Message
) {
  ensureConfigured();

  const subscriptions = await listPushSubscriptions(inviteToken);
  const presenceItems = await listPushPresence(inviteToken);
  const body = message.text || 'Фото';

  await Promise.all(subscriptions.map(async (subscription) => {
    if (hasActiveChatPresence(presenceItems, subscription.id, chatId)) {
      return;
    }

    try {
      await webpush.sendNotification(
        toWebPushSubscription(subscription),
        JSON.stringify({
          title: partnerName,
          body,
          url: `/chat/${inviteToken}/${chatId}`,
          chatId,
        })
      );
    } catch (error) {
      const statusCode = typeof error === 'object' && error && 'statusCode' in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;

      if (statusCode === 404 || statusCode === 410) {
        await deletePushSubscription(inviteToken, subscription.id);
      }
    }
  }));
}
