import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY_DISMISSED = 'cf_pwa_install_dismissed'
const STORAGE_KEY_INSTALLED = 'cf_pwa_installed'

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

/**
 * Hook: controla quando mostrar o popup de instalação PWA.
 *
 * O popup aparece quando TODAS as condições são verdadeiras:
 *  1. onBoardingComplete === true (user logado E cadastro completo)
 *  2. App não está instalado (display-mode !== standalone)
 *  3. User não marcou "Não mostrar de novo"
 *  4. O browser suporta instalação PWA (Chrome/Edge/Android — antesinstallprompt)
 *     OU é iOS (instruções manuais de Safari "Adicionar à Tela de Início")
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
  const [supportsNativePrompt, setSupportsNativePrompt] = useState<boolean | null>(null)

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
    // Detect "can install" support. iOS never fires beforeinstallprompt,
    // so on iOS we always treat the app as installable (manual instructions).
    setSupportsNativePrompt(!isIosDevice())

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

  // Mostra o popup quando onboarding for completado.
  //   - iOS: aparece com instruções manuais (sempre; beforeinstallprompt
  //     nunca dispara em Safari).
  //   - Android/Chrome: aparece SÓ SE o beforeinstallprompt foi capturado
  //     nesta sessão. Se passou (sessão persistente), não mostramos —
  //     o botão "Instalar" não funcionaria.
  useEffect(() => {
    if (!onboardingComplete || installed || dismissed || supportsNativePrompt === null) return
    const shouldShow = isIosDevice() || !!deferredPrompt
    if (!shouldShow) return
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [onboardingComplete, installed, dismissed, supportsNativePrompt, deferredPrompt])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      // No iOS (or if the native prompt was already used this session),
      // show manual instructions instead.
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
