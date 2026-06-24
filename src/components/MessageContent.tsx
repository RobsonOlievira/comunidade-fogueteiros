import React from 'react';
import type { Mencao } from '../../types';
import { LinkPreviewGroup, URL_RE } from './LinkPreview';

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
 * URLs de vídeo são ocultadas do texto e mostradas como preview cards
 * (LinkPreviewGroup) logo abaixo.
 *
 * Quebras de linha (\n) são preservadas como <br> no texto.
 */
export function MessageContent({ text, mentions = [], onClickMention, className }: MessageContentProps) {
  if (!text) return null;

  const apelidoParaPerfil = new Map<string, string>();
  for (const m of mentions) {
    if (m.apelido) apelidoParaPerfil.set(m.apelido.toLowerCase(), m.perfilId);
  }

  // Texto limpo: URLs de vídeo são removidas do corpo do texto.
  // São mostradas só no preview card abaixo.
  const cleanText = text.replace(URL_RE, '').trim();

  // Tokeniza preservando posição. Cada token é { tipo: 'text' | 'mention', valor, perfilId? }
  const tokens: Array<{ tipo: 'text' | 'mention'; valor: string; perfilId?: string; key: string }> = [];
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  APELIDO_REGEX.lastIndex = 0;
  let tokenCounter = 0;
  while ((m = APELIDO_REGEX.exec(cleanText)) !== null) {
    const matchStart = m.index;
    const leadingChar = matchStart > 0 ? cleanText[matchStart - 1] : '';
    const matchFull = `@${m[1]}`;
    const fullStart = leadingChar ? matchStart + 1 : matchStart;

    if (fullStart > lastIndex) {
      tokens.push({
        tipo: 'text',
        valor: cleanText.slice(lastIndex, fullStart),
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
  if (lastIndex < cleanText.length) {
    tokens.push({
      tipo: 'text',
      valor: cleanText.slice(lastIndex),
      key: `t-${tokenCounter++}`,
    });
  }

  return (
    <div className={className}>
      <span className="msg-text-body">
        {tokens.map((tk) => {
          if (tk.tipo === 'text') {
            // Preserva quebras de linha como <br>
            const parts = tk.valor.split('\n');
            return parts.map((part, i) => (
              <React.Fragment key={`${tk.key}-${i}`}>
                {i > 0 && <br />}
                {part}
              </React.Fragment>
            ));
          }
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
