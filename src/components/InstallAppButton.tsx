import React, { useEffect, useState } from 'react';
import { X, Download, Smartphone, Share, Plus, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY_INSTALLED = 'cf_pwa_installed';

const isIos = () =>
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent) &&
  !(window as any).MSStream;

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
};

/**
 * Botão de instalar PWA que aparece SÓ no mobile (classe md:hidden
 * fica no pai). Mostra um modal próprio quando clicado, independente
 * do estado do useInstallPrompt (que é gated por onboardingComplete).
 *
 * Comportamento:
 *  - Se já instalou, retorna null (botão some)
 *  - Se Chrome/Edge/Android: captura deferredPrompt e abre prompt nativo
 *  - Se iOS: mostra instruções manuais (Safari não tem beforeinstallprompt)
 *  - Se outro browser: mostra fallback genérico
 */
export default function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

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
      setModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setInstalled(true);
          localStorage.setItem(STORAGE_KEY_INSTALLED, '1');
          setModalOpen(false);
        }
        setDeferredPrompt(null);
      } catch (e) {
        console.error('install prompt failed', e);
        setModalOpen(true);
      } finally {
        setInstalling(false);
      }
    } else {
      // Sem deferredPrompt: iOS ou outro. Mostra modal com instruções.
      setModalOpen(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={installing}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-lg font-semibold text-[#06b6d4] bg-[#06b6d4]/10 border border-[#06b6d4]/30 hover:bg-[#06b6d4]/20 transition-all w-full disabled:opacity-50"
      >
        {installing ? (
          <div className="w-5 h-5 border-2 border-[#06b6d4] border-t-transparent rounded-full animate-spin" />
        ) : (
          <Smartphone className="w-6 h-6" />
        )}
        {installing ? 'Instalando…' : 'Instalar App'}
      </button>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-[#15151f] border border-accent-lilac/30 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}
            />
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 pt-7">
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)' }}
                >
                  <Smartphone className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white mb-1">
                    Instale na tela inicial
                  </h2>
                  <p className="text-sm text-gray-400">
                    Acesso em 1 toque, sem ocupar espaço como um app nativo.
                  </p>
                </div>
              </div>

              {isIos() ? (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
                  <p className="font-semibold mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" />
                    No iPhone / iPad (Safari):
                  </p>
                  <ol className="space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</span>
                      <span>
                        Toque no botão de <Share className="w-3 h-3 inline" /> <strong>Compartilhar</strong> abaixo
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">2</span>
                      <span>
                        Role e escolha <strong>"Adicionar à Tela de Início"</strong> <Plus className="w-3 h-3 inline" />
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold flex-shrink-0">3</span>
                      <span>Toque em <strong>"Adicionar"</strong></span>
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <button
                  onClick={async () => {
                    setInstalling(true);
                    try {
                      await deferredPrompt.prompt();
                      const choice = await deferredPrompt.userChoice;
                      if (choice.outcome === 'accepted') {
                        setInstalled(true);
                        localStorage.setItem(STORAGE_KEY_INSTALLED, '1');
                        setModalOpen(false);
                      }
                      setDeferredPrompt(null);
                    } finally {
                      setInstalling(false);
                    }
                  }}
                  disabled={installing}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}
                >
                  {installing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  Instalar agora
                </button>
              ) : (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <p className="font-semibold mb-1">Como instalar:</p>
                  <p>
                    Abra o menu do navegador (três pontos ou compartilhar) e escolha{' '}
                    <strong>"Adicionar à tela inicial"</strong> ou{' '}
                    <strong>"Instalar app"</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
