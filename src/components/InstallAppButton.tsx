import React, { useEffect, useState } from 'react';
import { Smartphone, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY_INSTALLED = 'cf_pwa_installed';

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
};

/**
 * Botão "Instalar App" — só mobile, só se ainda não instalou.
 * Ao clicar: chama direto o prompt() nativo do navegador. Sem popup
 * customizado, sem instruções de iOS — o navegador cuida de tudo.
 * Se o navegador não suporta (ou já usou o prompt nesta sessão),
 * o botão desaparece.
 */
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandalone() || localStorage.getItem(STORAGE_KEY_INSTALLED) === '1') {
      setInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setInstalled(true);
      localStorage.setItem(STORAGE_KEY_INSTALLED, '1');
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Sem prompt nativo disponível E ainda não instalou → não mostra
  if (installed) return null;
  if (!deferredPrompt) return null;

  const handleClick = async () => {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalled(true);
        localStorage.setItem(STORAGE_KEY_INSTALLED, '1');
      }
    } catch (e) {
      console.error('install prompt failed', e);
    } finally {
      setDeferredPrompt(null);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 transition-all w-full"
    >
      <Smartphone className="w-6 h-6" />
      Instalar App
    </button>
  );
}
