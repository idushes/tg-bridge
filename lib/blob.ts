import { getSql, initDb } from './db';
import type {
  BotConfig,
  ChatMeta,
  ChatMessages,
  Message,
  PushPresence,
  StoredPushSubscription,
} from './types';

type BotRow = {
  bot_id: string | number;
  bot_token: string;
  bot_username: string;
  bot_name: string;
  owner_telegram_id: string | number;
  invite_token: string;
  created_at: string | Date;
};

type ChatRow = {
  id: string | number;
  bot_id: string | number;
  participant_chat_id: string | number;
  participant_name: string;
  participant_first_name: string | null;
  participant_last_name: string | null;
  participant_username: string | null;
  participant_photo_file_id: string | null;
  last_message_text: string | null;
  last_message_media_type: Message['mediaType'] | null;
  last_message_from: Message['from'] | null;
  message_limit: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type MessageRow = {
  id: string;
  seq: string | number;
  sender_role: 'user' | 'operator';
  text: string;
  media_type: Message['mediaType'] | null;
  media_file_id: string | null;
  media_url: string | null;
  created_at: string | Date;
};

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string | Date;
  updated_at: string | Date;
};

type PushPresenceRow = {
  client_id: string;
  subscription_id: string | null;
  active_chat_id: string | number | null;
  updated_at: string | Date;
};

function toIsoString(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapBot(row: BotRow): BotConfig {
  return {
    botToken: row.bot_token,
    botId: toNumber(row.bot_id),
    botUsername: row.bot_username,
    botName: row.bot_name,
    ownerTelegramId: toNumber(row.owner_telegram_id),
    inviteToken: row.invite_token,
    createdAt: toIsoString(row.created_at),
  };
}

function mapChat(row: ChatRow): ChatMeta {
  return {
    botId: toNumber(row.bot_id),
    participantChatId: toNumber(row.participant_chat_id),
    participantName: row.participant_name,
    participantFirstName: row.participant_first_name ?? undefined,
    participantLastName: row.participant_last_name ?? undefined,
    participantUsername: row.participant_username ?? undefined,
    participantPhotoFileId: row.participant_photo_file_id ?? undefined,
    lastMessageText: row.last_message_text ?? undefined,
    lastMessageMediaType: row.last_message_media_type ?? undefined,
    lastMessageFrom: row.last_message_from ?? undefined,
    messageLimit: row.message_limit,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  };
}

function mapMessage(row: MessageRow): Message {
  return {
    id: row.id,
    text: row.text,
    from: row.sender_role,
    timestamp: toIsoString(row.created_at),
    mediaType: row.media_type ?? undefined,
    mediaFileId: row.media_file_id ?? undefined,
    mediaUrl: row.media_url ?? undefined,
    seq: toNumber(row.seq),
  };
}

async function getChatRow(botId: number, participantChatId: number): Promise<ChatRow | null> {
  await initDb();
  const sql = getSql();

  const rows = await sql<ChatRow[]>`
    select *
    from chats
    where bot_id = ${botId} and participant_chat_id = ${participantChatId}
    limit 1
  `;

  return rows[0] ?? null;
}

async function pruneMessages(chatRowId: number, messageLimit: number) {
  if (messageLimit <= 0) {
    return;
  }

  const sql = getSql();

  await sql`
    delete from messages
    where chat_row_id = ${chatRowId}
      and id in (
        select id
        from messages
        where chat_row_id = ${chatRowId}
        order by seq desc
        offset ${messageLimit}
      )
  `;
}

export async function saveBotConfig(botId: number, config: BotConfig): Promise<void> {
  await initDb();
  const sql = getSql();

  await sql`
    insert into bots (bot_id, bot_token, bot_username, bot_name, owner_telegram_id, invite_token, created_at)
    values (
      ${botId},
      ${config.botToken},
      ${config.botUsername},
      ${config.botName},
      ${config.ownerTelegramId},
      ${config.inviteToken}::uuid,
      ${config.createdAt}
    )
    on conflict (bot_id) do update set
      bot_token = excluded.bot_token,
      bot_username = excluded.bot_username,
      bot_name = excluded.bot_name,
      owner_telegram_id = excluded.owner_telegram_id,
      invite_token = excluded.invite_token
  `;
}

export async function getBotConfig(botId: number): Promise<BotConfig | null> {
  await initDb();
  const sql = getSql();

  const rows = await sql<BotRow[]>`select * from bots where bot_id = ${botId} limit 1`;
  return rows[0] ? mapBot(rows[0]) : null;
}

export async function deleteBotConfig(botId: number): Promise<void> {
  await initDb();
  const sql = getSql();
  await sql`delete from bots where bot_id = ${botId}`;
}

export async function listUserBots(ownerTelegramId: number): Promise<BotConfig[]> {
  await initDb();
  const sql = getSql();

  const rows = await sql<BotRow[]>`
    select *
    from bots
    where owner_telegram_id = ${ownerTelegramId}
    order by created_at desc
  `;

  return rows.map(mapBot);
}

export async function saveChatMeta(botId: number, participantChatId: number, meta: ChatMeta): Promise<void> {
  await initDb();
  const sql = getSql();

  await sql`
    insert into chats (
      bot_id,
      participant_chat_id,
      participant_name,
      participant_first_name,
      participant_last_name,
      participant_username,
      participant_photo_file_id,
      last_message_text,
      last_message_media_type,
      last_message_from,
      message_limit,
      created_at,
      updated_at
    )
    values (
      ${botId},
      ${participantChatId},
      ${meta.participantName},
      ${meta.participantFirstName ?? null},
      ${meta.participantLastName ?? null},
      ${meta.participantUsername ?? null},
      ${meta.participantPhotoFileId ?? null},
      ${meta.lastMessageText ?? null},
      ${meta.lastMessageMediaType ?? null},
      ${meta.lastMessageFrom ?? null},
      ${meta.messageLimit},
      ${meta.createdAt},
      ${meta.updatedAt}
    )
    on conflict (bot_id, participant_chat_id) do update set
      participant_name = excluded.participant_name,
      participant_first_name = excluded.participant_first_name,
      participant_last_name = excluded.participant_last_name,
      participant_username = excluded.participant_username,
      participant_photo_file_id = excluded.participant_photo_file_id,
      last_message_text = excluded.last_message_text,
      last_message_media_type = excluded.last_message_media_type,
      last_message_from = excluded.last_message_from,
      message_limit = excluded.message_limit,
      updated_at = excluded.updated_at
  `;
}

export async function getChatMeta(botId: number, participantChatId: number): Promise<ChatMeta | null> {
  const row = await getChatRow(botId, participantChatId);
  return row ? mapChat(row) : null;
}

export async function getChatByInviteToken(inviteToken: string): Promise<{ botId: number; config: BotConfig } | null> {
  await initDb();
  const sql = getSql();

  const rows = await sql<BotRow[]>`
    select *
    from bots
    where invite_token = ${inviteToken}::uuid
    limit 1
  `;

  if (!rows[0]) {
    return null;
  }

  const config = mapBot(rows[0]);
  return { botId: config.botId, config };
}

export async function getChatMessages(botId: number, participantChatId: number): Promise<ChatMessages> {
  const chatRow = await getChatRow(botId, participantChatId);
  if (!chatRow) {
    return { messages: [] };
  }

  const sql = getSql();

  const rows = await sql<MessageRow[]>`
    select id, seq, sender_role, text, media_type, media_file_id, media_url, created_at
    from messages
    where chat_row_id = ${toNumber(chatRow.id)}
    order by seq asc
  `;

  return { messages: rows.map(mapMessage) };
}

export async function getChatMessagesSince(botId: number, participantChatId: number, afterSeq: number): Promise<ChatMessages> {
  const chatRow = await getChatRow(botId, participantChatId);
  if (!chatRow) {
    return { messages: [] };
  }

  const sql = getSql();

  const rows = await sql<MessageRow[]>`
    select id, seq, sender_role, text, media_type, media_file_id, media_url, created_at
    from messages
    where chat_row_id = ${toNumber(chatRow.id)} and seq > ${afterSeq}
    order by seq asc
  `;

  return { messages: rows.map(mapMessage) };
}

export async function getMessageById(messageId: string): Promise<Message | null> {
  await initDb();
  const sql = getSql();

  const rows = await sql<MessageRow[]>`
    select id, seq, sender_role, text, media_type, media_file_id, media_url, created_at
    from messages
    where id = ${messageId}
    limit 1
  `;

  return rows[0] ? mapMessage(rows[0]) : null;
}

export async function saveChatMessages(botId: number, participantChatId: number, messages: ChatMessages): Promise<void> {
  await initDb();
  const sql = getSql();

  const chatRow = await getChatRow(botId, participantChatId);
  if (!chatRow) {
    return;
  }

  const chatRowId = toNumber(chatRow.id);

  await sql`delete from messages where chat_row_id = ${chatRowId}`;

  for (const message of messages.messages) {
    await sql`
      insert into messages (id, chat_row_id, sender_role, text, media_type, media_file_id, media_url, created_at)
      values (
        ${message.id},
        ${chatRowId},
        ${message.from},
        ${message.text},
        ${message.mediaType ?? null},
        ${message.mediaFileId ?? null},
        ${message.mediaUrl ?? null},
        ${message.timestamp}
      )
    `;
  }
}

export async function addMessageToChat(
  botId: number,
  participantChatId: number,
  message: Message,
  messageLimit: number
): Promise<Message> {
  await initDb();
  const sql = getSql();

  const chatRow = await getChatRow(botId, participantChatId);
  if (!chatRow) {
    throw new Error('Chat not found');
  }

  const inserted = await sql<MessageRow[]>`
    insert into messages (id, chat_row_id, sender_role, text, media_type, media_file_id, media_url, created_at)
    values (
      ${message.id},
      ${toNumber(chatRow.id)},
      ${message.from},
      ${message.text},
      ${message.mediaType ?? null},
      ${message.mediaFileId ?? null},
      ${message.mediaUrl ?? null},
      ${message.timestamp}
    )
    returning id, seq, sender_role, text, media_type, media_file_id, media_url, created_at
  `;

  await sql`
    update chats
    set updated_at = ${message.timestamp}, message_limit = ${messageLimit}
    where id = ${toNumber(chatRow.id)}
  `;

  await pruneMessages(toNumber(chatRow.id), messageLimit);

  return mapMessage(inserted[0]);
}

export async function deleteChatData(botId: number, participantChatId: number): Promise<void> {
  await initDb();
  const sql = getSql();
  await sql`delete from chats where bot_id = ${botId} and participant_chat_id = ${participantChatId}`;
}

export async function listBotChats(botId: number): Promise<ChatMeta[]> {
  await initDb();
  const sql = getSql();

  const rows = await sql<ChatRow[]>`
    select *
    from chats
    where bot_id = ${botId}
    order by updated_at desc
  `;

  return rows.map(mapChat);
}

export async function savePushSubscription(botId: number, subscription: StoredPushSubscription): Promise<void> {
  await initDb();
  const sql = getSql();

  await sql`
    insert into push_subscriptions (id, bot_id, endpoint, p256dh, auth, created_at, updated_at)
    values (
      ${subscription.id},
      ${botId},
      ${subscription.endpoint},
      ${subscription.keys.p256dh},
      ${subscription.keys.auth},
      ${subscription.createdAt},
      ${subscription.updatedAt}
    )
    on conflict (id) do update set
      endpoint = excluded.endpoint,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      updated_at = excluded.updated_at
  `;
}

export async function deletePushSubscription(botId: number, subscriptionId: string): Promise<void> {
  await initDb();
  const sql = getSql();
  await sql`delete from push_subscriptions where bot_id = ${botId} and id = ${subscriptionId}`;
}

export async function listPushSubscriptions(botId: number): Promise<StoredPushSubscription[]> {
  await initDb();
  const sql = getSql();

  const rows = await sql<PushSubscriptionRow[]>`
    select id, endpoint, p256dh, auth, created_at, updated_at
    from push_subscriptions
    where bot_id = ${botId}
    order by updated_at desc
  `;

  return rows.map((row) => ({
    id: row.id,
    endpoint: row.endpoint,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }));
}

export async function savePushPresence(botId: number, presence: PushPresence): Promise<void> {
  await initDb();
  const sql = getSql();

  await sql`
    insert into push_presence (bot_id, client_id, subscription_id, active_chat_id, updated_at)
    values (
      ${botId},
      ${presence.clientId},
      ${presence.subscriptionId},
      ${presence.activeChatId ?? null},
      ${presence.updatedAt}
    )
    on conflict (bot_id, client_id) do update set
      subscription_id = excluded.subscription_id,
      active_chat_id = excluded.active_chat_id,
      updated_at = excluded.updated_at
  `;
}

export async function deletePushPresence(botId: number, clientId: string): Promise<void> {
  await initDb();
  const sql = getSql();
  await sql`delete from push_presence where bot_id = ${botId} and client_id = ${clientId}`;
}

export async function listPushPresence(botId: number): Promise<PushPresence[]> {
  await initDb();
  const sql = getSql();

  const rows = await sql<PushPresenceRow[]>`
    select client_id, subscription_id, active_chat_id, updated_at
    from push_presence
    where bot_id = ${botId}
  `;

  return rows.map((row) => ({
    clientId: row.client_id,
    subscriptionId: row.subscription_id ?? '',
    activeChatId: row.active_chat_id === null ? null : toNumber(row.active_chat_id),
    updatedAt: toIsoString(row.updated_at),
  }));
}
