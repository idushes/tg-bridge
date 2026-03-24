'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChatMeta, Message } from '@/lib/types';
import { getUnreadCount, markChatAsRead } from '../chatReadState';
import { useInstallPrompt } from '../useInstallPrompt';
import { useChatNotifications } from '../useChatNotifications';
import { useLiveChats } from '../useLiveChats';

const ACTIVE_CHAT_HISTORY_KEY = 'tgBridgeActiveChatId';

function getActiveChatStorageKey(inviteToken: string) {
  return `tgBridgeActiveChat:${inviteToken}`;
}

function getMessageCacheKey(inviteToken: string, chatId: number) {
  return `tgBridgeChatMessages:${inviteToken}:${chatId}`;
}

function readCachedMessages(inviteToken: string, chatId: number): Message[] {
  try {
    const cached = sessionStorage.getItem(getMessageCacheKey(inviteToken, chatId));
    return cached ? JSON.parse(cached) as Message[] : [];
  } catch {
    return [];
  }
}

function writeCachedMessages(inviteToken: string, chatId: number, messages: Message[]) {
  try {
    sessionStorage.setItem(getMessageCacheKey(inviteToken, chatId), JSON.stringify(messages));
  } catch {
    // ignore cache write failures
  }
}

interface PendingMessage {
  clientId: string;
  optimisticMessage: Message;
  serverMessage?: Message;
}

function getMaxSeq(messages: Message[]) {
  return messages.reduce((max, message) => Math.max(max, message.seq ?? 0), 0);
}

function upsertMessage(messages: Message[], nextMessage: Message) {
  const existingIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (existingIndex === -1) {
    return [...messages, nextMessage].sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
  }

  const updated = [...messages];
  updated[existingIndex] = nextMessage;
  return updated.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0));
}

function getInitialDarkMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const stored = localStorage.getItem('darkMode');
  if (stored !== null) {
    return stored === 'true';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getChatName(chat: ChatMeta) {
  return chat.participantFirstName || chat.participantUsername || `Чат ${chat.participantChatId}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TG';
}

function getChatPreview(chat: ChatMeta) {
  if (chat.lastMessageMediaType) {
    const mediaLabel = {
      photo: 'Фото',
      video: 'Видео',
      voice: 'Голосовое',
      document: 'Документ',
    }[chat.lastMessageMediaType];

    return chat.lastMessageText ? `${mediaLabel}: ${chat.lastMessageText}` : mediaLabel;
  }

  return chat.lastMessageText || (chat.participantUsername ? `@${chat.participantUsername}` : 'Открыть переписку');
}

function formatSidebarTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMessageTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getMessageStatus(message: Message) {
  if (message.id.startsWith('local-')) {
    return 'pending';
  }

  return 'sent';
}

function MessageStatusIcon({ status, compact = false }: { status: 'pending' | 'sent'; compact?: boolean }) {
  if (status === 'pending') {
    return (
      <svg viewBox="0 0 16 16" className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} opacity-90`} aria-hidden="true">
        <circle cx="8" cy="8" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 4.5v3.8l2.4 1.45" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} opacity-95`} aria-hidden="true">
      <path d="M2.6 8.5 5.2 11l3.1-4.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M7.4 8.5 10 11l3.4-4.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </svg>
  );
}

function formatDayLabel(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function sameDay(left: string, right: string) {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  );
}

interface ChatClientProps {
  inviteToken: string;
  botId: number;
  chatId: number;
  initialMessages: Message[];
  partnerName: string;
  chats: ChatMeta[];
  botUsername: string;
}

export default function ChatClient({
  inviteToken,
  botId,
  chatId,
  initialMessages,
  partnerName,
  chats,
  botUsername,
}: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { liveChats, setLiveChats } = useLiveChats({ token: inviteToken, initialChats: chats });
  const [activeChatId, setActiveChatId] = useState(chatId);
  const [copiedBotLink, setCopiedBotLink] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [hydrated, setHydrated] = useState(false);
  const [loadedMediaIds, setLoadedMediaIds] = useState<Record<string, boolean>>({});
  const [expandedPhoto, setExpandedPhoto] = useState<{ src: string; alt: string } | null>(null);
  const [freshMessageIds, setFreshMessageIds] = useState<string[]>([]);
  const [shouldStickToBottom, setShouldStickToBottom] = useState(true);
  const previousMessageCountRef = useRef(initialMessages.length);
  const latestSeqRef = useRef(getMaxSeq(initialMessages));
  const messageIdsRef = useRef<Set<string>>(new Set(initialMessages.map((message) => message.id)));
  const reconnectTimeoutRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { canInstall, promptInstall } = useInstallPrompt();

  const activeChat = useMemo(
    () => liveChats.find((chat) => chat.participantChatId === activeChatId) ?? null,
    [activeChatId, liveChats]
  );

  const visibleMessages = useMemo(() => {
    const merged = [...messages];

    for (const pending of pendingMessages) {
      merged.push(pending.serverMessage ?? pending.optimisticMessage);
    }

    const byId = new Map<string, Message>();
    for (const message of merged) {
      byId.set(message.id, message);
    }

    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messages, pendingMessages]);

  const revokePreviewUrl = (message?: Message) => {
    if (message?.mediaUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(message.mediaUrl);
    }
  };

  useChatNotifications({ token: inviteToken, currentChatId: activeChatId });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!expandedPhoto) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpandedPhoto(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedPhoto]);

  useEffect(() => {
    if (activeChat) {
      markChatAsRead(inviteToken, activeChat);
    }
  }, [activeChat, inviteToken]);

  useEffect(() => {
    setActiveChatId(chatId);
  }, [chatId]);

  useEffect(() => {
    const state = window.history.state as Record<string, unknown> | null;
    const historyChatId = Number(state?.[ACTIVE_CHAT_HISTORY_KEY]);

    if (!Number.isNaN(historyChatId) && liveChats.some((chat) => chat.participantChatId === historyChatId)) {
      setActiveChatId(historyChatId);
      return;
    }

    const storedChatId = Number(sessionStorage.getItem(getActiveChatStorageKey(inviteToken)));
    if (!Number.isNaN(storedChatId) && liveChats.some((chat) => chat.participantChatId === storedChatId)) {
      setActiveChatId(storedChatId);
    }
  }, [inviteToken, liveChats]);

  useEffect(() => {
    const state = window.history.state && typeof window.history.state === 'object'
      ? window.history.state as Record<string, unknown>
      : {};

    window.history.replaceState(
      {
        ...state,
        [ACTIVE_CHAT_HISTORY_KEY]: activeChatId,
      },
      ''
    );

    sessionStorage.setItem(getActiveChatStorageKey(inviteToken), String(activeChatId));
  }, [activeChatId, inviteToken]);

  useEffect(() => {
    setLiveChats(chats);
  }, [chats, setLiveChats]);

  useEffect(() => {
    const baseMessages = activeChatId === chatId ? initialMessages : [];
    const cachedMessages = activeChatId === chatId && baseMessages.length > 0
      ? baseMessages
      : readCachedMessages(inviteToken, activeChatId);

    setMessages(cachedMessages);
    setPendingMessages([]);
    setLoadedMediaIds({});
    setFreshMessageIds([]);
    latestSeqRef.current = getMaxSeq(cachedMessages);
    messageIdsRef.current = new Set(cachedMessages.map((message) => message.id));
    previousMessageCountRef.current = cachedMessages.length;
  }, [activeChatId, chatId, initialMessages, inviteToken]);

  useEffect(() => {
    writeCachedMessages(inviteToken, activeChatId, messages);
  }, [activeChatId, inviteToken, messages]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) {
      return;
    }

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [newMessage]);

  const syncMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/chats/${activeChatId}/messages?inviteToken=${inviteToken}&botId=${botId}&t=${Date.now()}`,
        { cache: 'no-store' }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const previousIds = messageIdsRef.current;
      setMessages(data.messages);
      messageIdsRef.current = new Set(data.messages.map((message: Message) => message.id));
      latestSeqRef.current = getMaxSeq(data.messages);
      setFreshMessageIds((current) => {
        const nextFreshIds = data.messages
          .filter((message: Message) => !previousIds.has(message.id))
          .map((message: Message) => message.id);
        return nextFreshIds.length > 0 ? [...current, ...nextFreshIds] : current;
      });
      setPendingMessages((current) => {
        const serverIds = new Set<string>(data.messages.map((message: Message) => message.id));
        return current.filter((pending) => {
          const resolved = !!pending.serverMessage && serverIds.has(pending.serverMessage.id);
          if (resolved) {
            revokePreviewUrl(pending.optimisticMessage);
          }
          return !resolved;
        });
      });
    } catch (error) {
      console.error('Error syncing messages:', error);
    }
  }, [activeChatId, botId, inviteToken]);

  useEffect(() => {
    if (freshMessageIds.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setFreshMessageIds([]);
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [freshMessageIds]);

  useEffect(() => {
    void syncMessages();

    let closed = false;
    let source: EventSource | null = null;

    const closeSource = () => {
      source?.close();
      source = null;
    };

    const connect = () => {
      if (document.visibilityState !== 'visible' || source) {
        return;
      }

      source = new EventSource(
        `/api/chats/${activeChatId}/events?inviteToken=${inviteToken}&lastSeq=${latestSeqRef.current}`
      );

      source.addEventListener('message', ((event: MessageEvent<string>) => {
        const nextMessage = JSON.parse(event.data) as Message;
        latestSeqRef.current = Math.max(latestSeqRef.current, nextMessage.seq ?? 0);
        setMessages((current) => upsertMessage(current, nextMessage));
        messageIdsRef.current = new Set([...messageIdsRef.current, nextMessage.id]);
        setFreshMessageIds((current) => [...current, nextMessage.id]);
      }) as EventListener);

      source.onerror = () => {
        closeSource();
        if (closed) {
          return;
        }

        reconnectTimeoutRef.current = window.setTimeout(() => {
          void syncMessages();
          connect();
        }, 3000);
      };
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncMessages();
        connect();
        return;
      }

      closeSource();
    };

    connect();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      closed = true;
      closeSource();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [activeChatId, inviteToken, syncMessages]);

  useEffect(() => {
    const hasNewMessages = visibleMessages.length > previousMessageCountRef.current;

    if (hasNewMessages && shouldStickToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: previousMessageCountRef.current === 0 ? 'auto' : 'smooth' });
    }

    previousMessageCountRef.current = visibleMessages.length;
  }, [shouldStickToBottom, visibleMessages]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const updateStickiness = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setShouldStickToBottom(distanceFromBottom < 120);
    };

    updateStickiness();
    viewport.addEventListener('scroll', updateStickiness, { passive: true });

    return () => viewport.removeEventListener('scroll', updateStickiness);
  }, []);

  const sendPayload = async (file?: File) => {
    const text = newMessage.trim();
    if ((!text && !file) || sending) {
      return;
    }

    const clientId = `local-${Date.now()}`;
    const optimisticMessage: Message = {
      id: clientId,
      text,
      from: 'user',
      timestamp: new Date().toISOString(),
      mediaType: file ? 'photo' : undefined,
      mediaUrl: file ? URL.createObjectURL(file) : undefined,
    };

    setPendingMessages((current) => [
      ...current,
      {
        clientId,
        optimisticMessage,
      },
    ]);
    setShouldStickToBottom(true);
    setNewMessage('');
    setSending(true);

    try {
      const response = await fetch(
        `/api/chats/${activeChatId}/send?inviteToken=${inviteToken}&botId=${botId}`,
        file
          ? {
              method: 'POST',
              body: (() => {
                const formData = new FormData();
                formData.set('photo', file);
                formData.set('text', text);
                return formData;
              })(),
            }
          : {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text }),
            }
      );

      const data = await response.json();

      if (!response.ok) {
        setPendingMessages((current) => current.filter((pending) => pending.clientId !== clientId));
        revokePreviewUrl(optimisticMessage);
        alert(data.error || 'Ошибка отправки');
        return;
      }

      setPendingMessages((current) => current.map((pending) => {
        if (pending.clientId !== clientId) {
          return pending;
        }

        return {
          ...pending,
          serverMessage: {
            ...data.message,
            mediaUrl: pending.optimisticMessage.mediaUrl,
          },
        };
      }));

      setMessages((current) => upsertMessage(current, data.message));
      messageIdsRef.current = new Set([...messageIdsRef.current, data.message.id]);
      latestSeqRef.current = Math.max(latestSeqRef.current, data.message.seq ?? 0);
    } catch (error) {
      setPendingMessages((current) => current.filter((pending) => pending.clientId !== clientId));
      revokePreviewUrl(optimisticMessage);
      console.error('Error sending message:', error);
      alert('Ошибка сети');
    } finally {
      setSending(false);
    }
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    await sendPayload(file);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendPayload();
    }
  };

  const getMediaUrl = (message: Message) => {
    if (message.mediaUrl) {
      return message.mediaUrl;
    }
    if (!message.mediaFileId) {
      return null;
    }
    return `/api/media/${message.id}?inviteToken=${inviteToken}&botId=${botId}&chatId=${activeChatId}`;
  };

  const groupedMessages = useMemo(() => {
    const groups: Array<{ label: string; messages: Message[] }> = [];

    for (const message of visibleMessages) {
      const label = formatDayLabel(message.timestamp);
      const lastGroup = groups[groups.length - 1];

      if (!lastGroup || !sameDay(lastGroup.messages[0].timestamp, message.timestamp)) {
        groups.push({ label, messages: [message] });
        continue;
      }

      lastGroup.messages.push(message);
    }

    return groups;
  }, [visibleMessages]);

  const currentTitle = activeChat ? getChatName(activeChat) : partnerName;
  const currentSubtitle = activeChat?.participantUsername
    ? `был(а) недавно · @${activeChat.participantUsername}`
    : 'Сообщения доставляются через Telegram';

  const copyBotLink = async () => {
    try {
      await navigator.clipboard.writeText(`https://t.me/${botUsername}`);
      setCopiedBotLink(true);
      window.setTimeout(() => setCopiedBotLink(false), 1800);
    } catch {
      setCopiedBotLink(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#dfe8f1] text-[#223140] transition-colors dark:bg-[#0e1621] dark:text-white">
      <div className="flex h-full pb-[max(env(safe-area-inset-bottom),0px)] pt-[max(env(safe-area-inset-top),0px)]">
        <aside className="hidden w-[22rem] shrink-0 overflow-hidden border-r border-[#cfdbe6] bg-[#f4f8fb] dark:border-[#1e2b38] dark:bg-[#17212b] md:flex md:flex-col xl:w-[23rem]">
          <div className="border-b border-[#d8e3ec] px-3 pb-3 pt-4 dark:border-[#1e2b38]">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7e95ab] dark:text-[#6c8299]">
                  Telegram Bridge
                </p>
                <h1 className="mt-1 text-[28px] font-semibold text-[#233547] dark:text-[#f5f7fb]">Чаты</h1>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyBotLink}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0f7] text-[15px] text-[#5f7e99] transition hover:bg-[#dce9f4] dark:bg-[#22303d] dark:text-[#9db9d1] dark:hover:bg-[#293847]"
                  aria-label={copiedBotLink ? 'Ссылка скопирована' : `Скопировать ссылку на бота @${botUsername}`}
                  title={copiedBotLink ? 'Ссылка скопирована' : `Скопировать ссылку на бота @${botUsername}`}
                >
                  <span className="shrink-0 leading-none">{copiedBotLink ? '✓' : '⧉'}</span>
                </button>
              </div>
            </div>
            {canInstall && (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="flex w-full items-center justify-between rounded-xl bg-[#419fd9] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#3793cc] dark:bg-[#3b82c4] dark:hover:bg-[#4a8ecb]"
              >
                <span>Установить как приложение</span>
                <span className="ml-3 shrink-0">＋</span>
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-1.5 py-2">
            {liveChats.map((chat) => {
              const chatName = getChatName(chat);
              const isActive = chat.participantChatId === activeChatId;

              return (
                <button
                  key={chat.participantChatId}
                  type="button"
                  onClick={() => {
                    markChatAsRead(inviteToken, chat);
                    setActiveChatId(chat.participantChatId);
                  }}
                    className={`relative flex w-full items-center gap-3 rounded-[0.85rem] px-3 py-2.5 text-left transition before:absolute before:inset-0 before:opacity-0 before:transition before:duration-150 ${
                     isActive
                        ? 'bg-[#419fd9] text-white shadow-[0_8px_18px_rgba(65,159,217,0.22)] dark:bg-[#2b5278]'
                       : 'text-[#223140] hover:bg-[#e8f0f7] dark:text-white dark:hover:bg-[#1f2c39]'
                    }`}
                  >
                   <div className={`flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                     isActive
                       ? 'bg-white/20 text-white'
                       : 'bg-gradient-to-br from-[#68a7db] to-[#4c8fca] text-white shadow-[0_8px_18px_rgba(76,143,202,0.2)]'
                   }`}>
                    {getInitials(chatName)}
                   </div>
                   <div className="min-w-0 flex-1">
                     <div className="flex items-center gap-3">
                       <p className="truncate text-[15px] font-medium">{chatName}</p>
                       <span className={`ml-auto shrink-0 text-[11px] font-medium ${isActive ? 'text-white/75' : 'text-[#7b93aa] dark:text-[#6d8298]'}`}>
                         {formatSidebarTime(chat.updatedAt)}
                       </span>
                     </div>
                     <div className="mt-0.5 flex items-center gap-2">
                       <p className={`min-w-0 flex-1 truncate text-[13px] ${isActive ? 'text-white/75' : 'text-[#6f8498] dark:text-[#8ba2b8]'}`}>
                         {getChatPreview(chat)}
                       </p>
                       {!isActive && getUnreadCount(inviteToken, chat) > 0 && (
                        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#419fd9] px-1.5 text-[11px] font-semibold text-white shadow-sm dark:bg-[#5fb0ff] dark:text-[#0f2031]">
                          {getUnreadCount(inviteToken, chat)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#e5edf5] dark:bg-[#0f1720]">
          <header className="shrink-0 border-b border-[#d8e3ec] bg-[#f4f8fb] px-4 py-3 dark:border-[#1e2b38] dark:bg-[#17212b] md:px-5">
            <div className="flex items-center gap-3">
              <Link
                href={`/chat/${inviteToken}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f0f7] text-lg text-[#5f7e99] transition hover:bg-[#dce9f4] dark:bg-[#22303d] dark:text-[#a6c4de] dark:hover:bg-[#293847] md:hidden"
              >
                ←
              </Link>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#68a7db] to-[#4c8fca] text-sm font-semibold text-white shadow-[0_8px_18px_rgba(76,143,202,0.2)]">
                {getInitials(currentTitle)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-semibold text-[#233547] dark:text-[#f4f7fb]">{currentTitle}</div>
                <div className="truncate text-[12px] text-[#6f8498] dark:text-[#88a0b7]">{currentSubtitle}</div>
              </div>
              <button
                onClick={() => {
                  const newMode = !darkMode;
                  setDarkMode(newMode);
                  localStorage.setItem('darkMode', String(newMode));
                }}
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#e8f0f7] text-lg text-[#5f7e99] transition hover:bg-[#dce9f4] dark:bg-[#22303d] dark:text-[#a6c4de] dark:hover:bg-[#293847]"
                aria-label="Переключить тему"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </header>

          <main
            ref={viewportRef}
            className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,rgba(255,251,245,0.72),rgba(243,237,227,0.88)),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 48 48%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23c8b59f%22 fill-opacity=%220.12%22%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%221.6%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] px-3 py-4 dark:bg-[linear-gradient(180deg,rgba(15,23,32,0.30),rgba(15,23,32,0.18)),url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22 viewBox=%220 0 48 48%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%2332465b%22 fill-opacity=%220.22%22%3E%3Ccircle cx=%2224%22 cy=%2224%22 r=%221.6%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] md:px-6"
          >
            <div className="mx-auto w-full max-w-[58rem] space-y-4">
              {groupedMessages.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="sticky top-2 z-10 flex justify-center">
                    <div className="rounded-full bg-[#fffaf4]/92 px-3 py-1 text-[11px] font-medium text-[#837565] shadow-sm backdrop-blur dark:bg-[#1f2c3a]/92 dark:text-[#9cb2c6]">
                      {group.label}
                    </div>
                  </div>

                  {group.messages.map((message) => {
                    const mediaUrl = getMediaUrl(message);
                    const isUser = message.from === 'user';

                    return (
                      <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${freshMessageIds.includes(message.id) ? 'animate-[message-pop_220ms_ease-out]' : ''}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-[20px] px-3 py-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] md:max-w-[70%] ${
                            isUser
                              ? 'rounded-br-[10px] bg-[#dceccf] text-[#274126] dark:bg-[#2b5278] dark:text-white'
                              : 'rounded-bl-[10px] bg-[#fffaf4] text-[#2b3440] dark:bg-[#182533] dark:text-[#eef5fb]'
                          }`}
                        >
                          {message.mediaType && mediaUrl && (
                            <div className={`${message.text ? 'mb-2' : ''} overflow-hidden rounded-[16px] bg-black/5 dark:bg-black/20`}>
                              {message.mediaType === 'photo' && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedPhoto({ src: mediaUrl, alt: 'Фото' })}
                                  className="relative block min-w-[180px] max-w-[280px] cursor-zoom-in overflow-hidden rounded-[16px] text-left outline-none transition hover:scale-[1.01]"
                                >
                                  {!loadedMediaIds[message.id] && (
                                    <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#efe4d6] to-[#e2d2c1] dark:from-[#22303d] dark:to-[#1c2732]" />
                                  )}
                                  <Image
                                    src={mediaUrl}
                                    alt="Фото"
                                    width={1200}
                                    height={1200}
                                    unoptimized
                                    onLoad={() => setLoadedMediaIds((current) => ({ ...current, [message.id]: true }))}
                                    className="max-h-[260px] w-full object-cover md:max-h-[320px]"
                                  />
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
                                  <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/35 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
                                    <span suppressHydrationWarning>{hydrated ? formatMessageTime(message.timestamp) : ''}</span>
                                    {isUser && <MessageStatusIcon status={getMessageStatus(message)} compact />}
                                  </div>
                                </button>
                              )}
                              {message.mediaType === 'video' && (
                                <video src={mediaUrl} controls className="max-h-[420px] w-full" />
                              )}
                              {message.mediaType === 'voice' && (
                                <div className="flex items-center gap-3 px-3 py-3">
                                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4f8fd0] text-lg text-white shadow-[0_10px_24px_rgba(79,143,208,0.3)]">
                                    ▶
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <div className="mb-2 h-1.5 rounded-full bg-black/10 dark:bg-white/10">
                                      <div className="h-full w-1/3 rounded-full bg-[#4f8fd0]" />
                                    </div>
                                    <audio src={mediaUrl} controls className="w-[260px] max-w-full" />
                                  </div>
                                </div>
                              )}
                              {message.mediaType === 'document' && (
                                <a
                                  href={mediaUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex cursor-pointer items-center gap-3 p-4 text-sm font-medium"
                                >
                                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4f8fd0] text-lg text-white shadow-[0_10px_24px_rgba(79,143,208,0.24)]">📄</span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[14px] font-semibold">Документ</span>
                                    <span className="block text-[12px] opacity-70">Открыть вложение</span>
                                  </span>
                                </a>
                              )}
                            </div>
                          )}

                          {message.text && (
                            <p className={`whitespace-pre-wrap break-words text-[15px] leading-5 ${message.mediaType === 'photo' ? 'px-0.5' : ''}`}>
                              {message.text}
                            </p>
                          )}

                          {message.mediaType !== 'photo' && (
                            <div className={`mt-1.5 flex items-center justify-end gap-1 text-[11px] ${
                              isUser ? 'text-[#6b7c5f] dark:text-[#b7d4f4]' : 'text-[#867766] dark:text-[#8ea7bf]'
                            }`}>
                              <span suppressHydrationWarning>{hydrated ? formatMessageTime(message.timestamp) : ''}</span>
                              {isUser && <MessageStatusIcon status={getMessageStatus(message)} />}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </main>

          <footer className="shrink-0 border-t border-[#ddd2c3] bg-[#fbf7f0] px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 dark:border-[#1e2b38] dark:bg-[#17212b] md:px-5 md:py-4">
            <div className="flex items-end gap-2 md:gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelection}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
                className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#f1e7da] text-xl text-[#746958] transition hover:bg-[#e8dccd] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#22303d] dark:text-[#a7c3db] dark:hover:bg-[#293847]"
                aria-label="Отправить фото"
              >
                📎
              </button>
              <div className="flex min-h-12 flex-1 items-end rounded-[28px] bg-[#f4ece2] px-4 py-3 dark:bg-[#22303d]">
                <textarea
                  ref={inputRef}
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Напишите сообщение"
                  className="max-h-40 min-h-6 w-full resize-none overflow-y-auto bg-transparent text-[15px] leading-6 text-[#2d3540] outline-none placeholder:text-[#a29280] dark:text-[#eef5fb] dark:placeholder:text-[#6f8aa3]"
                  rows={1}
                  disabled={sending}
                />
              </div>
              <button
                onClick={() => void sendPayload()}
                disabled={!newMessage.trim() || sending}
                className="inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#4f8fd0] text-xl text-white shadow-[0_14px_24px_rgba(79,143,208,0.32)] transition hover:bg-[#437bb3] disabled:cursor-not-allowed disabled:bg-[#b7c9d9] disabled:shadow-none dark:bg-[#3d7bff] dark:hover:bg-[#4c87ff] dark:disabled:bg-[#365478]"
                aria-label="Отправить"
              >
                {sending ? '…' : '➤'}
              </button>
            </div>
          </footer>
        </section>
      </div>
      <style jsx>{`
        @keyframes message-pop {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setExpandedPhoto(null)}
        >
          <button
            type="button"
            aria-label="Закрыть просмотр фото"
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
            onClick={() => setExpandedPhoto(null)}
          >
            ×
          </button>
          <div
            className="relative max-h-[90vh] max-w-[92vw] overflow-hidden rounded-[22px] bg-black/20 shadow-[0_20px_80px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={expandedPhoto.src}
              alt={expandedPhoto.alt}
              width={1800}
              height={1800}
              unoptimized
              className="max-h-[90vh] w-auto max-w-[92vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
