export interface BotConfig {
  botToken: string;
  botId: number;
  botUsername: string;
  botName: string;
  ownerTelegramId: number;
  inviteToken: string;
  createdAt: string;
}

export interface ChatMeta {
  botId: number;
  participantChatId: number;
  participantName: string;
  participantFirstName?: string;
  participantLastName?: string;
  participantUsername?: string;
  participantPhotoFileId?: string;
  lastMessageText?: string;
  lastMessageMediaType?: Message['mediaType'];
  lastMessageFrom?: Message['from'];
  messageLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessages {
  messages: Message[];
}

export interface Message {
  id: string;
  text: string;
  from: 'user' | 'operator';
  timestamp: string;
  seq?: number;
  mediaType?: 'photo' | 'video' | 'voice' | 'document' | 'video_note';
  mediaFileId?: string;
  mediaUrl?: string;
  botId?: number;
}

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PushPresence {
  clientId: string;
  subscriptionId: string;
  activeChatId: number | null;
  updatedAt: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: 'private' | 'group' | 'supergroup' | 'channel';
    };
    text?: string;
    photo?: Array<{ file_id: string }>;
    video?: { file_id: string };
    voice?: { file_id: string };
    document?: { file_id: string };
    audio?: { file_id: string };
    sticker?: { file_id: string };
    animation?: { file_id: string };
    video_note?: { file_id: string };
    contact?: Record<string, unknown>;
    location?: Record<string, unknown>;
    venue?: Record<string, unknown>;
    poll?: Record<string, unknown>;
    dice?: Record<string, unknown>;
    game?: Record<string, unknown>;
    invoice?: Record<string, unknown>;
    caption?: string;
  };
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface BotInfo {
  id: number;
  is_bot: boolean;
  first_name: string;
  username: string;
}
