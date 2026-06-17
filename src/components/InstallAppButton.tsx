import React, { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY_INSTALLED = 'cf_pwa_installed';
const STORAGE_KEY_DISMISSED = 'cf_pwa_install_dismissed';

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
};

const isMobileLike = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
};

/**
 * Botão "Instalar App" — sempre visível no mobile enquanto o user não
 * tiver instalado ou dispensado o botão. O `deferredPrompt` do browser
 * só fica disponível depois que o user interage com a página (scroll,
 * click, etc.) — por isso NÃO escondemos o botão enquanto ele é null.
 *
 * Click:
 *  - Se já temos o prompt nativo (Chrome/Edge): chama direto
 *  - Se não temos: força um reload da página. Depois do reload, o
 *    browser já considera o site "engajado" e oferece o install
 *    automaticamente (ou dispara o beforeinstallprompt na próxima
 *    interação).
 */
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandalone() || localStorage.getItem(STORAGE_KEY_INSTALLED) === '1') {
      setInstalled(true);
      return;
    }

    if (localStorage.getItem(STORAGE_KEY_DISMISSED) === '1') {
      setDismissed(true);
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

  // Esconde só se já instalou, ou se não é mobile, ou se user dispensou
  if (installed) return null;
  if (dismissed) return null;
  if (!isMobileLike()) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
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
      return;
    }
    // Sem prompt ainda: pede uma interação mínima (click já conta) e
    // tenta de novo. Se o browser não suporta, o user pode usar o menu
    // do navegador (Adicionar à tela inicial). Não escondemos o botão
    // porque o prompt() pode aparecer a qualquer momento.
    // Dica: muitos browsers só disparam o evento após o user rolar ou
    // clicar em algo — se ele acabou de chegar à página, aguardar.
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
