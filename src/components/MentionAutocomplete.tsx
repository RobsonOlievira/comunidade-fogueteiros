import React, { useEffect, useState, useRef } from 'react';
import { buscarSugestoes } from '@/src/services/mentionService';

interface Sugestao {
  id: string;
  nome: string;
  apelido: string;
  avatar_url: string | null;
}

export interface PickedMention {
  perfilId: string;
  apelido: string;
  nome: string;
  // Texto a ser inserido no input, com o @ no início e espaço trailing
  insercao: string;
  // Range original (start, end) que está sendo substituído no input
  rangeStart: number;
  rangeEnd: number;
}

interface MentionAutocompleteProps {
  // Texto atual do input controlado pelo pai
  text: string;
  // Posição do cursor no texto (caret offset)
  caret: number;
  // Container que envolve o input, pra ancorar o dropdown em absolute
  anchorRef: React.RefObject<HTMLElement>;
  // Quando o usuário escolhe uma sugestão
  onPick: (m: PickedMention) => void;
  // Quando o usuário fecha (ESC, clique fora)
  onClose: () => void;
}

/**
 * Detecta se o caret está dentro de um trecho @texto não-espaçado e
 * posiciona um dropdown com sugestões de perfis. Substitui o trecho
 * pelo @apelido quando o usuário clica/enter.
 */
export function MentionAutocomplete({ text, caret, anchorRef, onPick, onClose }: MentionAutocompleteProps) {
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [active, setActive] = useState(0);
  const [prefixo, setPrefixo] = useState('');
  const [range, setRange] = useState<{ start: number; end: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detecta @prefixo a partir do caret
  useEffect(() => {
    const before = text.slice(0, caret);
    const match = /(?:^|\s)@([a-z0-9_]{0,20})$/i.exec(before);
    if (!match) {
      setPrefixo('');
      setRange(null);
      return;
    }
    const start = match.index + (match[0].startsWith('@') ? 0 : 1); // pula o espaço inicial
    const end = caret;
    const p = match[1];
    setPrefixo(p);
    setRange({ start, end });
  }, [text, caret]);

  // Busca sugestões quando o prefixo muda
  useEffect(() => {
    let cancelled = false;
    if (prefixo.length === 0) {
      setSugestoes([]);
      return;
    }
    buscarSugestoes(prefixo, 8).then((res) => {
      if (!cancelled) setSugestoes(res);
    });
    return () => {
      cancelled = true;
    };
  }, [prefixo]);

  // Reset active quando sugestões mudam
  useEffect(() => {
    setActive(0);
  }, [sugestoes.length]);

  // Clique fora fecha
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [anchorRef, onClose]);

  if (!range || prefixo.length === 0 || sugestoes.length === 0) return null;

  const pick = (s: Sugestao) => {
    if (!range) return;
    // Texto de inserção: @apelido + espaço (pra separar do resto)
    const insercao = `@${s.apelido} `;
    onPick({
      perfilId: s.id,
      apelido: s.apelido,
      nome: s.nome,
      insercao,
      rangeStart: range.start,
      rangeEnd: range.end,
    });
  };

  return (
    <div className="mention-autocomplete" ref={containerRef} role="listbox">
      {sugestoes.map((s, i) => (
        <button
          key={s.id}
          type="button"
          className={`mention-autocomplete-item ${i === active ? 'is-active' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            pick(s);
          }}
          onMouseEnter={() => setActive(i)}
          role="option"
          aria-selected={i === active}
        >
          <div className="mention-autocomplete-avatar">
            {s.avatar_url ? (
              <img src={s.avatar_url} alt={s.nome} />
            ) : (
              <span>{(s.nome || s.apelido || '?').charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="mention-autocomplete-info">
            <span className="mention-autocomplete-nome">{s.nome}</span>
            <span className="mention-autocomplete-apelido">@{s.apelido}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

/**
 * Hook utilitário: dado o evento de teclado no input, devolve o estado de
 * caret atualizado. Encapsula a leitura de selectionStart do input.
 */
export function getCaretFromInput(target: HTMLInputElement | HTMLTextAreaElement): number {
  try {
    return target.selectionStart ?? target.value.length;
  } catch {
    return target.value.length;
  }
}
