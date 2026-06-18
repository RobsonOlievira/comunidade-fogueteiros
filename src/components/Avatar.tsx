import React, { useState } from 'react';
import { Crown } from 'lucide-react';

interface AvatarProps {
  name: string;
  url?: string | null;
  colorClass?: string;
  className?: string;
  alt?: string;
  fallbackText?: string;
  isPro?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Avatar redondo do membro. Características:
 *  - Sempre circular (border-radius 50% + overflow hidden)
 *  - Sem seleção de texto/imagem (select-none + -webkit-user-drag none)
 *  - Quando `isPro` é true, mostra coroa (Crown) no canto superior direito
 *  - `size` controla as dimensões: xs=24, sm=32, md=40, lg=64
 *  - `className` é aplicada no wrapper junto com .avatar-with-crown,
 *    sobrescrevendo width/height/border-radius se necessário
 *
 * A coroa tem borda contrastante com o fundo do chat pra ficar
 * visível mesmo em fundos escuros.
 */
export function Avatar({ name, url, colorClass = 'color-4', className = '', alt = '', fallbackText, isPro = false, size = 'md' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = (fallbackText || name || '?').charAt(0).toUpperCase();

  const sizeClass = size === 'xs' ? 'w-6 h-6' : size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';

  return (
    <div className={`cf-avatar ${sizeClass} ${className}`}>
      <div className={`cf-avatar-circle ${colorClass}`}>
        {url && !errored ? (
          <img
            src={url}
            alt={alt || name}
            className="cf-avatar-img"
            loading="lazy"
            draggable={false}
            onError={() => setErrored(true)}
          />
        ) : (
          <span className="cf-avatar-initial">{initial}</span>
        )}
      </div>
      {isPro && (
        <span className="cf-avatar-crown" title="Membro Pro" aria-label="Membro Pro">
          <Crown className="w-2.5 h-2.5" />
        </span>
      )}
    </div>
  );
}