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
}

/**
 * Avatar redondo do membro. Quando `isPro` é true, renderiza um indicador
 * de coroa (crown) no canto superior direito — usado pra identificar
 * alunos pagantes vindos do Tesseract App B.
 *
 * A coroa é posicionada em absolute e usa o mesmo `--accent-lilac`/gold
 * do design system pra ficar consistente com o badge "Pro" do perfil.
 */
export function Avatar({ name, url, colorClass = 'color-4', className = '', alt = '', fallbackText, isPro = false }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = (fallbackText || name || '?').charAt(0).toUpperCase();

  const body = url && !errored ? (
    <img
      src={url}
      alt={alt || name}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={() => setErrored(true)}
    />
  ) : (
    <span>{initial}</span>
  );

  return (
    <div className={`avatar-with-crown ${className}`}>
      <div className={`avatar-circle ${colorClass} flex items-center justify-center font-bold select-none`}>
        {body}
      </div>
      {isPro && (
        <span className="avatar-crown" title="Membro Pro" aria-label="Membro Pro">
          <Crown className="w-3 h-3" />
        </span>
      )}
    </div>
  );
}
