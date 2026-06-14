import { useEffect, useState } from 'react';
import { useAuth } from '@/src/context/AuthContext';

const STORAGE_KEY = 'cf_avatar_url';

export function useAvatarUrl(): string | null {
  const { user } = useAuth();
  const [override, setOverride] = useState<string | null>(() => sessionStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const url = (e as CustomEvent<{ url: string }>).detail?.url;
      if (url) {
        sessionStorage.setItem(STORAGE_KEY, url);
        setOverride(url);
      }
    };
    window.addEventListener('cf:avatar-updated', onUpdate);
    return () => window.removeEventListener('cf:avatar-updated', onUpdate);
  }, []);

  return override || user?.avatarUrl || null;
}
