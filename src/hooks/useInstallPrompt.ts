import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY_DISMISSED = 'cf_pwa_install_dismissed'
const STORAGE_KEY_INSTALLED = 'cf_pwa_installed'

/**
 * Hook: controla quando mostrar o popup de instalação PWA.
 *
 * O popup só aparece quando TODAS as condições são verdadeiras:
 *  1. onBoardingComplete === true (user logado E cadastro completo)
 *  2. Browser disparou `beforeinstallprompt` (Android/Chrome/Edge)
 *  3. App não está instalado (display-mode !== standalone)
 *  4. User não marcou "Não mostrar de novo"
 *
 * Ordem esperada na UX:
 *  1. User entra (visitante) → nada
 *  2. User faz login/signup → nada
 *  3. User completa onboarding (preenche apelido + whatsapp) → popup aparece
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [onboardingComplete, setOnboardingComplete] = useState(false)
  const [visible, setVisible] = useState(false)
  const [iosInstructions, setIosInstructions] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIosStandalone = (navigator as any).standalone === true
    const wasInstalled = localStorage.getItem(STORAGE_KEY_INSTALLED) === '1'
    const wasDismissed = localStorage.getItem(STORAGE_KEY_DISMISSED) === '1'

    if (isStandalone || isIosStandalone || wasInstalled) {
      setInstalled(true)
      return
    }

    setDismissed(wasDismissed)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstalled(true)
      setVisible(false)
      setDeferredPrompt(null)
      localStorage.setItem(STORAGE_KEY_INSTALLED, '1')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Escuta o evento customizado disparado pelo OnboardingModal quando o user
  // termina o cadastro. Também escuta mudanças no localStorage (fallback).
  useEffect(() => {
    if (typeof window === 'undefined') return

    const onOnboardingComplete = () => {
      setOnboardingComplete(true)
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cf_onboarding_completed' && e.newValue === '1') {
        setOnboardingComplete(true)
      }
    }

    window.addEventListener('cf:onboarding-complete', onOnboardingComplete)
    window.addEventListener('storage', onStorage)

    return () => {
      window.removeEventListener('cf:onboarding-complete', onOnboardingComplete)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  // Controla visibilidade: só mostra se onboarding foi completado E tem prompt
  useEffect(() => {
    if (onboardingComplete && deferredPrompt && !installed && !dismissed) {
      // Pequeno delay pra dar tempo do user ver o app "limpo" primeiro
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [onboardingComplete, deferredPrompt, installed, dismissed])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      setIosInstructions(true)
      return
    }
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setInstalled(true)
        localStorage.setItem(STORAGE_KEY_INSTALLED, '1')
      } else {
        setDismissed(true)
        localStorage.setItem(STORAGE_KEY_DISMISSED, '1')
      }
    } catch (e) {
      console.error('install prompt failed', e)
      setIosInstructions(true)
    } finally {
      setDeferredPrompt(null)
      setVisible(false)
    }
  }, [deferredPrompt])

  const dismiss = useCallback((remember: boolean) => {
    setVisible(false)
    setDismissed(true)
    if (remember) {
      localStorage.setItem(STORAGE_KEY_DISMISSED, '1')
    }
  }, [])

  return {
    visible: visible && !installed && !dismissed,
    installed,
    onboardingComplete,
    iosInstructions,
    setIosInstructions,
    promptInstall,
    dismiss,
  }
}
