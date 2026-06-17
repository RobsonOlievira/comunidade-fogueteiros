import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Menu, Hash, Users, Pin, Plus, Smile, Send, Heart, Trash2, CornerUpLeft } from 'lucide-react';
import type { ChannelItem, Message } from '@/types';
import { usePerfis } from '@/src/hooks/usePerfis';
import { Avatar } from '@/src/components/Avatar';
import { ReplyPreviewInput, ReplyPreviewMessage } from '@/src/components/ReplyPreview';
import { MessageContent } from '@/src/components/MessageContent';
import { MentionAutocomplete, getCaretFromInput, type PickedMention } from '@/src/components/MentionAutocomplete';
import { extrairApelidos, resolverMencoes } from '@/src/services/mentionService';

interface ChatAreaProps {
  channelDetails: ChannelItem | null;
  messages: Message[];
  onSendMessage: (text: string, opts?: { replyTo?: Message['replyTo']; mentions?: Message['mentions'] }) => void;
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
  const [caret, setCaret] = useState(0);
  const [replyTo, setReplyTo] = useState<Message['replyTo'] | null>(null);
  const [pendingMentions, setPendingMentions] = useState<Message['mentions']>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const isAdmin = cargo === 'admin' || cargo === 'mod';
  const { getPerfil } = usePerfis();

  // Scrola APENAS o container .chat-messages (não o <main> externo).
  // scrollIntoView rolava todos os ancestrais, arrastando o .chat-header
  // pra trás do header fixo do MainLayout no mobile.
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Foca o input e posiciona o caret no final quando começa a responder
  useEffect(() => {
    if (replyTo && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyTo]);

  // Scroll programático até a mensagem alvo (clicou no quote)
  const jumpToMessage = useCallback((id: string) => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const el = container.querySelector<HTMLElement>(`[data-msg-id="${CSS.escape(String(id))}"]`);
    if (!el) return;
    // Calcula offset dentro do container, não da página (evita scroll acidental)
    const elTop = el.offsetTop;
    const targetTop = elTop - 12;
    container.scrollTo({ top: targetTop, behavior: 'smooth' });
    // Highlight breve pra dar feedback visual
    el.classList.add('msg-highlight');
    window.setTimeout(() => el.classList.remove('msg-highlight'), 1500);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValue.trim();
    if (!text) return;

    // Resolve menções finais a partir do texto. O pendingMentions do autocomplete
    // cobre os casos onde o usuário selecionou da lista; mas o usuário pode ter
    // digitado @apelido sem usar o dropdown — processarMencoes cobre isso via regex.
    let mencoesFinais = pendingMentions || [];
    try {
      // processarMencoes é fire-and-forget pra notificação; aqui só queremos
      // o array resolvido pra gravar no payload. Para evitar chamada dupla,
      // reusamos a lista de pendentes (que é o source-of-truth) e parseamos o
      // texto pra incluir @apelido não sugeridos via dropdown.
      const apelidos = extrairApelidos(text);
      const resolvidas = await resolverMencoes(apelidos);
      // Merge: pendentes (que tem perfilId garantido) + resolvidas (caso não
      // tenham vindo do dropdown). Dedupe por perfilId.
      const mapa = new Map<string, NonNullable<Message['mentions']>[number]>();
      for (const m of mencoesFinais) mapa.set(m.perfilId, m);
      for (const m of resolvidas) if (!mapa.has(m.perfilId)) mapa.set(m.perfilId, m);
      mencoesFinais = Array.from(mapa.values());
    } catch (err) {
      console.warn('[ChatArea] resolver menções falhou:', err);
    }

    onSendMessage(text, {
      replyTo: replyTo || undefined,
      mentions: mencoesFinais,
    });
    setInputValue('');
    setCaret(0);
    setReplyTo(null);
    setPendingMentions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setCaret(getCaretFromInput(e.target));
  };

  const handleInputKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCaret(getCaretFromInput(e.currentTarget));
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    setCaret(getCaretFromInput(e.currentTarget));
  };

  const handlePickMention = (m: PickedMention) => {
    const before = inputValue.slice(0, m.rangeStart);
    const after = inputValue.slice(m.rangeEnd);
    const novoTexto = before + m.insercao + after;
    setInputValue(novoTexto);
    const novoCaret = m.rangeStart + m.insercao.length;
    setCaret(novoCaret);
    // Atualiza pendentes (dedupe por perfilId)
    if (m.perfilId && !pendingMentions?.some((x) => x.perfilId === m.perfilId)) {
      setPendingMentions((prev) => [
        ...(prev || []),
        { perfilId: m.perfilId, apelido: m.apelido, nome: m.nome },
      ]);
    }
    // Re-foca o input e posiciona o caret
    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        try {
          inputRef.current.setSelectionRange(novoCaret, novoCaret);
        } catch {}
      }
    });
  };

  // Quando o usuário clica em "responder" numa mensagem: seta o replyTo,
  // foca o input e limpa pendências anteriores (cada mensagem nova começa
  // do zero, o user re-mensiona quem quiser)
  const startReply = (m: Message) => {
    if (!m.perfilId) return; // não dá pra mencionar sem perfil
    setReplyTo({
      id: String(m.id),
      author: m.author,
      text: m.text,
      perfilId: m.perfilId,
    });
  };

  const cancelReply = () => {
    setReplyTo(null);
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

      <div className="chat-messages" ref={messagesContainerRef}>
        {messages.map((msg) => {
          const badgeClass = msg.badge ? `badge-${msg.badge.toLowerCase()}` : '';
          const perfil = getPerfil(msg.perfilId);
          return (
            <div
              className="message-card group"
              key={msg.id}
              data-msg-id={msg.id}
            >
              <Avatar
                name={perfil?.nome || msg.author}
                url={perfil?.avatar_url}
                colorClass={`msg-avatar ${getAvatarColorClass(msg.avatarColor)}`}
                fallbackText={msg.avatar}
                alt={perfil?.nome || msg.author}
                isPro={perfil?.pro}
              />
              <div className="msg-content-wrapper">
                {msg.replyTo && (
                  <ReplyPreviewMessage
                    replyTo={msg.replyTo}
                    onJump={jumpToMessage}
                  />
                )}
                <div className="msg-header">
                  <span className="msg-author">{msg.author}</span>
                  {msg.badge && (
                    <span className={`msg-badge ${badgeClass}`}>
                      {msg.badge}
                    </span>
                  )}
                  <span className="msg-time">{msg.time}</span>
                </div>
                <MessageContent
                  text={msg.text}
                  mentions={msg.mentions}
                  className="msg-text"
                />
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
                  {msg.perfilId && msg.perfilId !== perfilId && (
                    <button
                      onClick={() => startReply(msg)}
                      className="flex items-center gap-1 text-xs text-gray-600 hover:text-accent-lilac transition-all opacity-0 group-hover:opacity-100"
                      title="Responder"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      Responder
                    </button>
                  )}
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

      <div className="chat-input-wrapper" ref={inputWrapperRef}>
        {replyTo && (
          <ReplyPreviewInput replyTo={replyTo} onCancel={cancelReply} />
        )}
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <button type="button" className="input-action-btn" title="Anexar arquivo">
            <Plus />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyUp={handleInputKeyUp}
            onClick={handleInputClick}
            placeholder={
              replyTo
                ? `Respondendo a @${replyTo.author}...`
                : `Conversar em #${channelDetails?.title || '...'}`
            }
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
        <MentionAutocomplete
          text={inputValue}
          caret={caret}
          anchorRef={inputWrapperRef}
          onPick={handlePickMention}
          onClose={() => {}}
        />
      </div>
    </main>
  );
}
