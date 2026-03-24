import { saveChatMeta } from './blob';
import { getUserProfilePhotoFileId } from './telegram';
import type { ChatMeta } from './types';

export async function backfillChatAvatars(botToken: string, chats: ChatMeta[]): Promise<ChatMeta[]> {
  const updatedChats = await Promise.all(
    chats.map(async (chat) => {
      if (chat.participantPhotoFileId) {
        return chat;
      }

      const participantPhotoFileId = await getUserProfilePhotoFileId(botToken, chat.participantChatId);
      if (!participantPhotoFileId) {
        return chat;
      }

      const updatedChat = {
        ...chat,
        participantPhotoFileId,
      };

      await saveChatMeta(chat.botId, chat.participantChatId, updatedChat);
      return updatedChat;
    })
  );

  return updatedChats;
}
