'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Message } from '@/lib/types';
import { useChatNotifications } from '../useChatNotifications';

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

interface ChatClientProps {
  inviteToken: string;
  botId: number;
  chatId: number;
  initialMessages: Message[];
  partnerName: string;
}

export default function ChatClient({ inviteToken, botId, chatId, initialMessages, partnerName }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [hydrated, setHydrated] = useState(false);
  const [shouldStickToBottom, setShouldStickToBottom] = useState(true);
  const previousMessageCountRef = useRef(initialMessages.length);
  const latestSeqRef = useRef(getMaxSeq(initialMessages));
  const reconnectTimeoutRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const formatTime = (timestamp: string) => new Date(timestamp).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

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

  useChatNotifications({ token: inviteToken, currentChatId: chatId });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const syncMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/chats/${chatId}/messages?inviteToken=${inviteToken}&botId=${botId}&t=${Date.now()}`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        latestSeqRef.current = getMaxSeq(data.messages);
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
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  }, [botId, chatId, inviteToken]);

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
        `/api/chats/${chatId}/events?inviteToken=${inviteToken}&lastSeq=${latestSeqRef.current}`
      );

      source.addEventListener('message', ((event: MessageEvent<string>) => {
        const nextMessage = JSON.parse(event.data) as Message;
        latestSeqRef.current = Math.max(latestSeqRef.current, nextMessage.seq ?? 0);
        setMessages((current) => upsertMessage(current, nextMessage));
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
  }, [chatId, inviteToken, syncMessages]);

  useEffect(() => {
    const hasNewMessages = visibleMessages.length > previousMessageCountRef.current;

    if (hasNewMessages && shouldStickToBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: previousMessageCountRef.current === 0 ? 'auto' : 'smooth' });
    }

    previousMessageCountRef.current = visibleMessages.length;
  }, [visibleMessages, shouldStickToBottom]);

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
    if ((!text && !file) || sending) return;

    const clientId = `local-${Date.now()}`;
    const optimisticMessage: Message = {
      id: clientId,
      text,
      from: 'user',
      timestamp: new Date().toISOString(),
      mediaType: file ? 'photo' : undefined,
      mediaUrl: file ? URL.createObjectURL(file) : undefined,
    };

    setPendingMessages((current) => ([
      ...current,
      {
        clientId,
        optimisticMessage,
      },
    ]));
    setShouldStickToBottom(true);
    setNewMessage('');
    setSending(true);

    try {
      const response = await fetch(
        `/api/chats/${chatId}/send?inviteToken=${inviteToken}&botId=${botId}`,
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

      if (response.ok) {
        const data = await response.json();

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
        latestSeqRef.current = Math.max(latestSeqRef.current, data.message.seq ?? 0);
      } else {
        const data = await response.json();
        setPendingMessages((current) => current.filter((pending) => pending.clientId !== clientId));
        revokePreviewUrl(optimisticMessage);
        alert(data.error || 'Ошибка отправки');
      }
    } catch (error) {
      setPendingMessages((current) => current.filter((pending) => pending.clientId !== clientId));
      revokePreviewUrl(optimisticMessage);
      console.error('Error sending message:', error);
      alert('Ошибка сети');
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    await sendPayload();
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    await sendPayload(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMediaUrl = (message: Message) => {
    if (message.mediaUrl) return message.mediaUrl;
    if (!message.mediaFileId) return null;
    return `/api/media/${message.id}?inviteToken=${inviteToken}&botId=${botId}&chatId=${chatId}`;
  };

  return (
    <div className="h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      <header className="shrink-0 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href={`/chat/${inviteToken}`} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
              ←
            </a>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white">{partnerName}</h1>
          </div>
          <button
            onClick={() => {
              const newMode = !darkMode;
              setDarkMode(newMode);
              localStorage.setItem('darkMode', String(newMode));
            }}
            className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors text-sm"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main ref={viewportRef} className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {visibleMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[65%] rounded-2xl px-3 py-2 ${
                  message.from === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white'
                }`}
              >
                {message.text && <p className="whitespace-pre-wrap text-[15px] leading-5">{message.text}</p>}
                
                {message.mediaType && getMediaUrl(message) && (
                  <div className="mt-1.5">
                    {message.mediaType === 'photo' && getMediaUrl(message) && (
                      <img
                        src={getMediaUrl(message) || ''}
                        alt="Photo"
                        className="rounded-lg max-w-full max-h-80 object-cover"
                      />
                    )}
                    {message.mediaType === 'video' && (
                      <video
                        src={getMediaUrl(message) || ''}
                        controls
                        className="rounded-lg max-w-full max-h-80"
                      />
                    )}
                    {message.mediaType === 'voice' && (
                      <audio
                        src={getMediaUrl(message) || ''}
                        controls
                        className="w-full max-w-56"
                      />
                    )}
                    {message.mediaType === 'document' && (
                      <a
                        href={getMediaUrl(message) || ''}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm underline"
                      >
                        📎 Документ
                      </a>
                    )}
                  </div>
                )}
                
                <p
                  suppressHydrationWarning
                  className={`text-[11px] mt-1 ${
                    message.from === 'user' ? 'text-blue-200' : 'text-zinc-400'
                  }`}
                >
                  {hydrated ? formatTime(message.timestamp) : ''}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="shrink-0 bg-white dark:bg-zinc-800 border-t border-zinc-200 dark:border-zinc-700 p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
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
            className="px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors"
            aria-label="Отправить фото"
          >
            📷
          </button>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-700 px-4 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? '...' : 'Отправить'}
          </button>
        </div>
      </footer>
    </div>
  );
}
