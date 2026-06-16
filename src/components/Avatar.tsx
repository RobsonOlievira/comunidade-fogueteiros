import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  url?: string | null;
  colorClass?: string;
  className?: string;
  alt?: string;
  fallbackText?: string;
}

export function Avatar({ name, url, colorClass = 'color-4', className = '', alt = '', fallbackText }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const initial = (fallbackText || name || '?').charAt(0).toUpperCase();

  if (url && !errored) {
    return (
      <div className={`${colorClass} ${className} overflow-hidden relative`}>
        <img
          src={url}
          alt={alt || name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={() => setErrored(true)}
        />
      </div>
    );
  }

  return (
    <div className={`${colorClass} ${className} flex items-center justify-center font-bold select-none`}>
      {initial}
    </div>
  );
}
