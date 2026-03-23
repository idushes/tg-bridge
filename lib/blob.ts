import { put, del, list, head } from '@vercel/blob';
import type { BotConfig, ChatMeta, ChatMessages, Message } from './types';

function getToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }
  return token;
}

async function fetchJson<T>(pathname: string): Promise<T | null> {
  try {
    const result = await head(pathname, { token: getToken() });
    if (!result) return null;

    const response = await fetch(result.url, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
      },
    });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function saveBotConfig(botId: number, config: BotConfig): Promise<void> {
  await put(`bots/${botId}/config.json`, JSON.stringify(config), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    token: getToken(),
  });
}

export async function getBotConfig(botId: number): Promise<BotConfig | null> {
  return await fetchJson<BotConfig>(`bots/${botId}/config.json`);
}

export async function deleteBotConfig(botId: number): Promise<void> {
  try {
    await del(`bots/${botId}/config.json`, { token: getToken() });
  } catch {
    // ignore
  }
}

export async function saveChatMeta(inviteToken: string, meta: ChatMeta): Promise<void> {
  await put(`chats/${inviteToken}/meta.json`, JSON.stringify(meta), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    token: getToken(),
  });
}

export async function getChatMeta(inviteToken: string): Promise<ChatMeta | null> {
  return await fetchJson<ChatMeta>(`chats/${inviteToken}/meta.json`);
}

export async function deleteChatMeta(inviteToken: string): Promise<void> {
  try {
    await del(`chats/${inviteToken}/meta.json`, { token: getToken() });
  } catch {
    // ignore
  }
}

export async function getChatMessages(inviteToken: string): Promise<ChatMessages> {
  const result = await fetchJson<ChatMessages>(`chats/${inviteToken}/messages.json`);
  return result ?? { messages: [] };
}

export async function saveChatMessages(inviteToken: string, messages: ChatMessages): Promise<void> {
  await put(`chats/${inviteToken}/messages.json`, JSON.stringify(messages), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    token: getToken(),
  });
}

export async function addMessageToChat(
  inviteToken: string,
  message: Message,
  messageLimit: number
): Promise<void> {
  const chat = await getChatMessages(inviteToken);
  chat.messages.push(message);
  
  if (chat.messages.length > messageLimit) {
    chat.messages = chat.messages.slice(-messageLimit);
  }
  
  await saveChatMessages(inviteToken, chat);
}

export async function deleteChatData(inviteToken: string): Promise<void> {
  try {
    await del(`chats/${inviteToken}/meta.json`, { token: getToken() });
    await del(`chats/${inviteToken}/messages.json`, { token: getToken() });
  } catch {
    // ignore
  }
}

export async function listUserBots(ownerTelegramId: number): Promise<BotConfig[]> {
  const result = await list({ prefix: 'bots/', token: getToken() });
  const bots: BotConfig[] = [];
  
  for (const blob of result.blobs) {
    if (!blob.pathname.endsWith('/config.json')) continue;
    const config = await fetchJson<BotConfig>(blob.pathname);
    if (config && config.ownerTelegramId === ownerTelegramId) {
      bots.push(config);
    }
  }
  
  return bots;
}

export async function listUserChats(ownerTelegramId: number): Promise<ChatMeta[]> {
  const bots = await listUserBots(ownerTelegramId);
  const botIds = new Set(bots.map(b => b.botId));
  
  const result = await list({ prefix: 'chats/', token: getToken() });
  const chats: ChatMeta[] = [];
  
  for (const blob of result.blobs) {
    if (!blob.pathname.endsWith('/meta.json')) continue;
    const config = await fetchJson<ChatMeta>(blob.pathname);
    if (config && botIds.has(config.botId)) {
      chats.push(config);
    }
  }
  
  return chats;
}