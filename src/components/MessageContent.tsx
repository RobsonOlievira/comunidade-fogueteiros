import React from 'react';
import type { Mencao } from '../../types';
import { LinkPreviewGroup } from './LinkPreview';

interface MessageContentProps {
  text: string;
  mentions?: Mencao[];
  onClickMention?: (perfilId: string) => void;
  className?: string;
}

const APELIDO_REGEX = /(?:^|\s)@([a-z0-9_]{3,20})/gi;

/**
 * Renderiza o texto da mensagem transformando @apelido em chip clicável
 * (se houver menção resolvida) ou mantém como texto simples. Heurística:
 * match de @apelido no texto cru, depois cruza com a lista de menções
 * resolvidas. Se o apelido não tiver match em `mentions`, renderiza como
 * texto (não conseguimos navegar).
 *
 * Também detecta links de vídeo no texto e mostra preview cards (thumbnail)
 * para YouTube, Vimeo, TikTok e links genéricos.
 */
export function MessageContent({ text, mentions = [], onClickMention, className }: MessageContentProps) {
  if (!text) return null;

  const apelidoParaPerfil = new Map<string, string>();
  for (const m of mentions) {
    if (m.apelido) apelidoParaPerfil.set(m.apelido.toLowerCase(), m.perfilId);
  }

  // Tokeniza preservando posição. Cada token é { tipo: 'text' | 'mention', valor, perfilId? }
  const tokens: Array<{ tipo: 'text' | 'mention'; valor: string; perfilId?: string; key: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  APELIDO_REGEX.lastIndex = 0;
  let tokenCounter = 0;
  while ((m = APELIDO_REGEX.exec(text)) !== null) {
    const matchStart = m.index;
    const leadingChar = matchStart > 0 ? text[matchStart - 1] : '';
    // incluir o @ no token; o "match" só guarda o grupo 1
    const matchFull = `@${m[1]}`;
    const fullStart = leadingChar ? matchStart + 1 : matchStart;

    if (fullStart > lastIndex) {
      tokens.push({
        tipo: 'text',
        valor: text.slice(lastIndex, fullStart),
        key: `t-${tokenCounter++}`,
      });
    }
    const perfilId = apelidoParaPerfil.get(m[1].toLowerCase());
    tokens.push({
      tipo: 'mention',
      valor: matchFull,
      perfilId,
      key: `m-${tokenCounter++}`,
    });
    lastIndex = fullStart + matchFull.length;
  }
  if (lastIndex < text.length) {
    tokens.push({
      tipo: 'text',
      valor: text.slice(lastIndex),
      key: `t-${tokenCounter++}`,
    });
  }

  return (
    <div className={className}>
      <span>
        {tokens.map((tk) => {
          if (tk.tipo === 'text') return <React.Fragment key={tk.key}>{tk.valor}</React.Fragment>;
          if (tk.perfilId) {
            return (
              <button
                key={tk.key}
                type="button"
                className="mention-chip"
                onClick={() => onClickMention?.(tk.perfilId!)}
                title="Ir para o perfil"
              >
                {tk.valor}
              </button>
            );
          }
          return (
            <span key={tk.key} className="mention-unresolved">
              {tk.valor}
            </span>
          );
        })}
      </span>
      <LinkPreviewGroup text={text} />
    </div>
  );
}
