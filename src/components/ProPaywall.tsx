import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Crown, Sparkles, X } from 'lucide-react'

interface ProPaywallProps {
  open: boolean
  onClose: () => void
}

export default function ProPaywall({ open, onClose }: ProPaywallProps) {
  const navigate = useNavigate()

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#0c0a1a] border-2 border-[#bb9fff]/40 rounded-2xl p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl shadow-lg mb-3"
            style={{
              background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
              boxShadow: '0 8px 24px rgba(251, 191, 36, 0.4)',
            }}
          >
            <Crown className="w-8 h-8 text-black" />
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-2"
            style={{
              background: 'rgba(187, 159, 255, 0.15)',
              border: '1px solid rgba(187, 159, 255, 0.30)',
            }}
          >
            <Sparkles className="w-3 h-3 text-[#bb9fff]" />
            <span className="text-[10px] font-semibold text-[#bb9fff] uppercase tracking-wider">
              Exclusivo PRO
            </span>
          </div>
          <h2 className="font-display text-xl font-bold text-white">Comunidade exclusiva PRO</h2>
          <p className="text-sm text-gray-400 mt-2 leading-relaxed">
            Esse espaço é para os usuários premium. Aqui a staff e alunos VIP
            conversam sobre estratégia, fazem networking fechado e tiram dúvidas
            avançadas.
          </p>
        </div>

        <div
          className="rounded-xl p-3 mb-5"
          style={{
            background: 'rgba(187, 159, 255, 0.06)',
            border: '1px solid rgba(187, 159, 255, 0.20)',
          }}
        >
          <p className="text-xs text-center text-[#d4b8ff]">
            👑 Apenas usuários PRO e a staff da comunidade têm acesso.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              onClose()
              navigate('/cursos')
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white font-semibold hover:opacity-90 transition-all shadow-lg"
            style={{
              background: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
              boxShadow: '0 8px 24px rgba(251, 191, 36, 0.25)',
            }}
          >
            <Crown className="w-4 h-4" />
            Conhecer cursos e virar PRO
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  )
}
