import { put, del, list, head } from '@vercel/blob';
import type { BotConfig, ChatMeta, ChatMessages, Message } from './types';

function getToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN is not set');
  }
  return token;
}

async function fetchBlobJson<T>(url: string): Promise<T | null> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return await response.json() as T;
}

// Bot configuration
export async function saveBotConfig(botId: number, config: BotConfig): Promise<void> {
  await put(`bots/${botId}/config.json`, JSON.stringify(config), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: getToken(),
  });
}

export async function getBotConfig(botId: number): Promise<BotConfig | null> {
  try {
    const result = await head(`bots/${botId}/config.json`, { token: getToken() });
    if (!result) return null;
    return await fetchBlobJson<BotConfig>(result.url);
  } catch {
    return null;
  }
}

export async function deleteBotConfig(botId: number): Promise<void> {
  try {
    await del(`bots/${botId}/config.json`, { token: getToken() });
  } catch {
    // ignore
  }
}

export async function listUserBots(ownerTelegramId: number): Promise<BotConfig[]> {
  const result = await list({ prefix: 'bots/', token: getToken() });
  const bots: BotConfig[] = [];
  
  for (const blob of result.blobs) {
    if (!blob.pathname.endsWith('/config.json')) continue;
    try {
      const headResult = await head(blob.pathname, { token: getToken() });
      if (!headResult) continue;
      const config = await fetchBlobJson<BotConfig>(headResult.url);
      if (!config) continue;
      if (config.ownerTelegramId === ownerTelegramId) {
        bots.push(config);
      }
    } catch {
      // ignore
    }
  }
  
  return bots;
}

// Chat operations - using botId_participantChatId as key
function getChatKey(botId: number, participantChatId: number): string {
  return `chats/${botId}_${participantChatId}`;
}

export async function saveChatMeta(botId: number, participantChatId: number, meta: ChatMeta): Promise<void> {
  await put(`${getChatKey(botId, participantChatId)}/meta.json`, JSON.stringify(meta), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: getToken(),
  });
}

export async function getChatMeta(botId: number, participantChatId: number): Promise<ChatMeta | null> {
  try {
    const result = await head(`${getChatKey(botId, participantChatId)}/meta.json`, { token: getToken() });
    if (!result) return null;
    return await fetchBlobJson<ChatMeta>(result.url);
  } catch {
    return null;
  }
}

// Get chat by invite token (for parent web interface)
export async function getChatByInviteToken(inviteToken: string): Promise<{ botId: number; config: BotConfig } | null> {
  const result = await list({ prefix: 'bots/', token: getToken() });
  
  for (const blob of result.blobs) {
    if (!blob.pathname.endsWith('/config.json')) continue;
    try {
      const headResult = await head(blob.pathname, { token: getToken() });
      if (!headResult) continue;
      const config = await fetchBlobJson<BotConfig>(headResult.url);
      if (!config) continue;
      if (config.inviteToken === inviteToken) {
        return { botId: config.botId, config };
      }
    } catch {
      // ignore
    }
  }
  
  return null;
}

export async function getChatMessages(botId: number, participantChatId: number): Promise<ChatMessages> {
  try {
    const result = await head(`${getChatKey(botId, participantChatId)}/messages.json`, { token: getToken() });
    if (!result) return { messages: [] };
    return await fetchBlobJson<ChatMessages>(result.url) ?? { messages: [] };
  } catch {
    return { messages: [] };
  }
}

export async function saveChatMessages(botId: number, participantChatId: number, messages: ChatMessages): Promise<void> {
  await put(`${getChatKey(botId, participantChatId)}/messages.json`, JSON.stringify(messages), {
    contentType: 'application/json',
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    token: getToken(),
  });
}

export async function addMessageToChat(
  botId: number,
  participantChatId: number,
  message: Message,
  messageLimit: number
): Promise<void> {
  const chat = await getChatMessages(botId, participantChatId);
  chat.messages.push(message);
  
  if (chat.messages.length > messageLimit) {
    chat.messages = chat.messages.slice(-messageLimit);
  }
  
  await saveChatMessages(botId, participantChatId, chat);
}

export async function deleteChatData(botId: number, participantChatId: number): Promise<void> {
  try {
    await del(`${getChatKey(botId, participantChatId)}/meta.json`, { token: getToken() });
    await del(`${getChatKey(botId, participantChatId)}/messages.json`, { token: getToken() });
  } catch {
    // ignore
  }
}

// List all chats for a bot
export async function listBotChats(botId: number): Promise<ChatMeta[]> {
  const result = await list({ prefix: `chats/${botId}_`, token: getToken() });
  const chats: ChatMeta[] = [];
  
  for (const blob of result.blobs) {
    if (!blob.pathname.endsWith('/meta.json')) continue;
    try {
      const headResult = await head(blob.pathname, { token: getToken() });
      if (!headResult) continue;
      const meta = await fetchBlobJson<ChatMeta>(headResult.url);
      if (!meta) continue;
      chats.push(meta);
    } catch {
      // ignore
    }
  }
  
  return chats.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
