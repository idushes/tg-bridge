'use client';

import { useState, useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';

interface ChatClientProps {
  chatToken: string;
  initialMessages: Message[];
  parentName: string;
}

export default function ChatClient({ chatToken, initialMessages, parentName }: ChatClientProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const pollMessages = async () => {
    try {
      const response = await fetch(`/api/chats/${chatToken}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(pollMessages, 3000);
    return () => clearInterval(interval);
  }, [chatToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/chats/${chatToken}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newMessage }),
      });

      if (response.ok) {
        setNewMessage('');
        await pollMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getMediaUrl = (message: Message) => {
    if (!message.mediaFileId || !message.botId) return null;
    return `/api/media/${message.id}?chat=${chatToken}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-200 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-lg font-semibold text-zinc-900">{parentName}</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.from === 'operator' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                  message.from === 'operator'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-900'
                }`}
              >
                {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
                
                {message.mediaType && message.mediaFileId && (
                  <div className="mt-2">
                    {message.mediaType === 'photo' && (
                      <img
                        src={getMediaUrl(message) || ''}
                        alt="Photo"
                        className="rounded-lg max-w-full"
                      />
                    )}
                    {message.mediaType === 'video' && (
                      <video
                        src={getMediaUrl(message) || ''}
                        controls
                        className="rounded-lg max-w-full"
                      />
                    )}
                    {message.mediaType === 'voice' && (
                      <audio
                        src={getMediaUrl(message) || ''}
                        controls
                        className="w-full"
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
                
                <p className={`text-xs mt-1 ${
                  message.from === 'operator' ? 'text-blue-200' : 'text-zinc-400'
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-white border-t border-zinc-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="flex-1 resize-none rounded-xl border border-zinc-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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