import React from 'react'
import { X, Download, Smartphone, Share, Plus, Check } from 'lucide-react'
import { useInstallPrompt } from '@/src/hooks/useInstallPrompt'

const isIos = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export default function InstallPrompt() {
  const { visible, iosInstructions, setIosInstructions, promptInstall, dismiss } = useInstallPrompt()

  if (!visible) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={() => dismiss(false)}
      >
        <div
          className="relative w-full max-w-md bg-[#15151f] border border-accent-lilac/30 rounded-2xl shadow-2xl shadow-accent-lilac/20 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}
          />

          <button
            onClick={() => dismiss(false)}
            className="absolute top-3 right-3 w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 flex items-center justify-center transition-all"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-6 pt-7">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)' }}
              >
                <img src="/icons/icon-192.png" alt="" className="w-14 h-14 rounded-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold text-white mb-1">
                  🚀 Instale o app no seu celular
                </h2>
                <p className="text-sm text-gray-400">
                  Acesso rápido, notificações e a comunidade inteira na tela inicial do seu celular — sem ocupar espaço como um app nativo.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-5 text-xs text-gray-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#339c81]" />
                <span>Abre em 1 toque direto da tela inicial</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#339c81]" />
                <span>Funciona offline (cache de mensagens recentes)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#339c81]" />
                <span>Experiência de app nativo, sem loja de apps</span>
              </div>
            </div>

            {iosInstructions ? (
              <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200">
                <p className="font-semibold mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" />
                  No iPhone / iPad (Safari):
                </p>
                <ol className="space-y-1.5 pl-1">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold">1</span>
                    Toque no botão de <Share className="w-3 h-3 inline" /> <strong>Compartilhar</strong> abaixo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold">2</span>
                    Role e escolha <strong>"Adicionar à Tela de Início"</strong> <Plus className="w-3 h-3 inline" />
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold">3</span>
                    Toque em <strong>"Adicionar"</strong> no canto superior direito
                  </li>
                </ol>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => dismiss(false)}
                  className="py-2.5 px-4 rounded-lg text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
                >
                  Agora não
                </button>
                <button
                  onClick={promptInstall}
                  className="py-2.5 px-4 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  style={{ background: 'linear-gradient(90deg, #7c3aed 0%, #06b6d4 100%)' }}
                >
                  <Download className="w-4 h-4" />
                  Instalar agora
                </button>
              </div>
            )}

            <button
              onClick={() => dismiss(true)}
              className="w-full text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              Não mostrar de novo
            </button>

            {isIos() && !iosInstructions && (
              <button
                onClick={() => setIosInstructions(true)}
                className="w-full text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors mt-1"
              >
                📱 Como instalar no iPhone?
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
