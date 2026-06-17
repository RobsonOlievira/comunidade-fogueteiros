import React from 'react';
import { CornerUpLeft } from 'lucide-react';

interface ReplyPreviewInputProps {
  replyTo: {
    id: string;
    author: string;
    text: string;
    perfilId?: string | null;
  };
  onCancel: () => void;
}

/**
 * Card exibido ACIMA do input quando o usuário clicou em "responder"
 * em alguma mensagem. Mostra quem está sendo respondido + preview do
 * texto, com botão pra cancelar.
 */
export function ReplyPreviewInput({ replyTo, onCancel }: ReplyPreviewInputProps) {
  const preview = (replyTo.text || '').slice(0, 120);
  return (
    <div className="reply-preview-input">
      <CornerUpLeft className="reply-preview-icon" />
      <div className="reply-preview-body">
        <span className="reply-preview-label">
          Respondendo a <strong>@{replyTo.author}</strong>
        </span>
        <span className="reply-preview-text">{preview}</span>
      </div>
      <button
        type="button"
        className="reply-preview-close"
        onClick={onCancel}
        aria-label="Cancelar resposta"
        title="Cancelar resposta"
      >
        ×
      </button>
    </div>
  );
}

interface ReplyPreviewMessageProps {
  replyTo: {
    id: string;
    author: string;
    text: string;
    perfilId?: string | null;
  };
  onJump: (id: string) => void;
}

/**
 * Card compacto exibido ACIMA da mensagem nova, mostrando a qual
 * mensagem ela está respondendo. Clicar faz scroll até a original.
 */
export function ReplyPreviewMessage({ replyTo, onJump }: ReplyPreviewMessageProps) {
  const preview = (replyTo.text || '').slice(0, 140);
  return (
    <button
      type="button"
      className="reply-preview-message"
      onClick={() => onJump(replyTo.id)}
      title={`Pular para mensagem de @${replyTo.author}`}
    >
      <CornerUpLeft className="reply-preview-icon" />
      <div className="reply-preview-body">
        <span className="reply-preview-label">
          <strong>@{replyTo.author}</strong>
        </span>
        <span className="reply-preview-text">{preview}</span>
      </div>
    </button>
  );
}
