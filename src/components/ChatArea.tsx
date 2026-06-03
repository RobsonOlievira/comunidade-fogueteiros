import React, { useRef, useEffect, useState } from 'react';
import { Menu, Hash, Users, Pin, Plus, Smile, Send } from 'lucide-react';
import type { ChannelItem, Message } from '@/types';

interface ChatAreaProps {
  channelDetails: ChannelItem | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onToggleMembers: () => void;
  onOpenSidebarLeft: () => void;
}

export default function ChatArea({
  channelDetails,
  messages,
  onSendMessage,
  onToggleMembers,
  onOpenSidebarLeft
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;
    onSendMessage(text);
    setInputValue('');
  };

  const getAvatarColorClass = (color: string) => {
    return color || 'color-4';
  };

  return (
    <main className="chat-area">
      <header className="chat-header">
        <div className="chat-header-info">
          <button
            className="mobile-toggle-btn"
            onClick={onOpenSidebarLeft}
            title="Abrir menu"
          >
            <Menu />
          </button>
          <div className="channel-header-title">
            <Hash className="header-icon-hash" />
            <h1>{channelDetails?.title || 'carregando...'}</h1>
          </div>
          <span className="channel-description-text">
            {channelDetails?.desc || ''}
          </span>
        </div>
        <div className="chat-header-actions">
          <button
            className="header-btn"
            onClick={onToggleMembers}
            title="Mostrar/Ocultar membros"
          >
            <Users />
          </button>
          <button className="header-btn" title="Fixar mensagens">
            <Pin />
          </button>
        </div>
      </header>

      <div className="chat-messages">
        {messages.map((msg) => {
          const badgeClass = msg.badge ? `badge-${msg.badge.toLowerCase()}` : '';
          return (
            <div className="message-card" key={msg.id}>
              <div className={`msg-avatar ${getAvatarColorClass(msg.avatarColor)}`}>
                {msg.avatar}
              </div>
              <div className="msg-content-wrapper">
                <div className="msg-header">
                  <span className="msg-author">{msg.author}</span>
                  {msg.badge && (
                    <span className={`msg-badge ${badgeClass}`}>
                      {msg.badge}
                    </span>
                  )}
                  <span className="msg-time">{msg.time}</span>
                </div>
                <p className="msg-text">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <button type="button" className="input-action-btn" title="Anexar arquivo">
            <Plus />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Conversar em #${channelDetails?.title || '...'}`}
            autoComplete="off"
          />
          <div className="input-tools">
            <button type="button" className="input-action-btn emoji-btn" title="Emojis">
              <Smile />
            </button>
            <button type="submit" className="send-btn" title="Enviar mensagem">
              <Send />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
