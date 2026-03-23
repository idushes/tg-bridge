import type { BotInfo, TelegramUpdate } from './types';

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export async function getBotInfo(botToken: string): Promise<BotInfo | null> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getMe`);
    if (!response.ok) return null;
    const data = await response.json() as { ok: boolean; result: BotInfo };
    if (!data.ok) return null;
    return data.result;
  } catch {
    return null;
  }
}

export async function sendMessage(
  botToken: string,
  chatId: number,
  text: string
): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    });
    const data = await response.json() as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

export async function sendMedia(
  botToken: string,
  chatId: number,
  mediaType: 'photo' | 'video' | 'voice' | 'document',
  fileId: string,
  caption?: string
): Promise<boolean> {
  try {
    const methodMap = {
      photo: 'sendPhoto',
      video: 'sendVideo',
      voice: 'sendVoice',
      document: 'sendDocument',
    };
    
    const method = methodMap[mediaType];
    const body: Record<string, unknown> = {
      chat_id: chatId,
      [mediaType === 'voice' ? 'voice' : mediaType]: fileId,
    };
    
    if (caption) {
      body.caption = caption;
    }
    
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json() as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

export async function setWebhook(botToken: string, webhookUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl }),
    });
    const data = await response.json() as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

export async function deleteWebhook(botToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/deleteWebhook`);
    const data = await response.json() as { ok: boolean };
    return data.ok;
  } catch {
    return false;
  }
}

export async function getFile(botToken: string, fileId: string): Promise<string | null> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/getFile?file_id=${fileId}`);
    const data = await response.json() as { ok: boolean; result?: { file_path: string } };
    if (!data.ok || !data.result) return null;
    return data.result.file_path;
  } catch {
    return null;
  }
}

export async function downloadFile(botToken: string, filePath: string): Promise<Uint8Array | null> {
  try {
    const response = await fetch(`${TELEGRAM_API_BASE}/file/bot${botToken}/${filePath}`);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch {
    return null;
  }
}

export async function sendPhotoFile(
  botToken: string,
  chatId: number,
  file: File,
  caption?: string
): Promise<{ ok: boolean; fileId?: string }> {
  try {
    const formData = new FormData();
    formData.set('chat_id', String(chatId));
    formData.set('photo', file);

    if (caption) {
      formData.set('caption', caption);
    }

    const response = await fetch(`${TELEGRAM_API_BASE}/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json() as {
      ok: boolean;
      result?: {
        photo?: Array<{ file_id: string }>;
      };
    };

    if (!data.ok) {
      return { ok: false };
    }

    const photo = data.result?.photo;
    const fileId = photo && photo.length > 0 ? photo[photo.length - 1].file_id : undefined;

    return { ok: true, fileId };
  } catch {
    return { ok: false };
  }
}

export function extractMessageFromUpdate(update: TelegramUpdate): {
  chatId: number;
  text: string;
  mediaType?: 'photo' | 'video' | 'voice' | 'document';
  mediaFileId?: string;
} | null {
  if (!update.message) return null;
  
  const msg = update.message;
  let text = msg.text || '';
  let mediaType: 'photo' | 'video' | 'voice' | 'document' | undefined;
  let mediaFileId: string | undefined;
  
  if (msg.photo && msg.photo.length > 0) {
    mediaType = 'photo';
    mediaFileId = msg.photo[msg.photo.length - 1].file_id;
    if (!text && msg.caption) {
      text = msg.caption;
    }
  } else if (msg.video) {
    mediaType = 'video';
    mediaFileId = msg.video.file_id;
    if (!text && msg.caption) {
      text = msg.caption;
    }
  } else if (msg.voice) {
    mediaType = 'voice';
    mediaFileId = msg.voice.file_id;
  } else if (msg.document) {
    mediaType = 'document';
    mediaFileId = msg.document.file_id;
    if (!text && msg.caption) {
      text = msg.caption;
    }
  }
  
  if (!text && !mediaFileId) return null;
  
  return {
    chatId: msg.chat.id,
    text,
    mediaType,
    mediaFileId,
  };
}

export async function sendMessageToChat(
  botToken: string,
  chatId: number,
  text: string,
  mediaType?: 'photo' | 'video' | 'voice' | 'document',
  mediaFileId?: string
): Promise<boolean> {
  if (mediaFileId && mediaType) {
    return sendMedia(botToken, chatId, mediaType, mediaFileId, text || undefined);
  }
  return sendMessage(botToken, chatId, text);
}
