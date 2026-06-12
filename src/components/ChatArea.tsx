import React, { useRef, useEffect, useState } from 'react';
import { Menu, Hash, Users, Pin, Plus, Smile, Send, Heart, Trash2 } from 'lucide-react';
import type { ChannelItem, Message } from '@/types';

interface ChatAreaProps {
  channelDetails: ChannelItem | null;
  messages: Message[];
  onSendMessage: (text: string) => void;
  onToggleMembers: () => void;
  onOpenSidebarLeft: () => void;
  onLikeMessage: (messageId: string) => void;
  onUnlikeMessage: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  cargo?: string;
  perfilId?: string;
}

export default function ChatArea({
  channelDetails,
  messages,
  onSendMessage,
  onToggleMembers,
  onOpenSidebarLeft,
  onLikeMessage,
  onUnlikeMessage,
  onDeleteMessage,
  cargo,
  perfilId,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAdmin = cargo === 'admin' || cargo === 'mod';

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
      <div className="chat-messages">
        {messages.map((msg) => {
          const badgeClass = msg.badge ? `badge-${msg.badge.toLowerCase()}` : '';
          return (
            <div className="message-card group" key={msg.id}>
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
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => msg.likedByMe ? onUnlikeMessage(msg.id) : onLikeMessage(msg.id)}
                    className={`flex items-center gap-1 text-xs transition-all ${
                      msg.likedByMe
                        ? 'text-accent-lilac'
                        : 'text-gray-600 hover:text-gray-400'
                    }`}
                    title={msg.likedByMe ? 'Descurtir' : 'Curtir'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${msg.likedByMe ? 'fill-accent-lilac' : ''}`} />
                    {msg.likesCount ? <span>{msg.likesCount}</span> : null}
                  </button>
                  {(isAdmin || msg.perfilId === perfilId) && (
                    <button
                      onClick={() => onDeleteMessage(msg.id)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                      title="Excluir mensagem"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
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
    </main>
  );
}
