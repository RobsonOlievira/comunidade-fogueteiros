import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const STORAGE_KEY_DISMISSED = 'cf_pwa_install_dismissed'
const STORAGE_KEY_INSTALLED = 'cf_pwa_installed'

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)
  const [iosInstructions, setIosInstructions] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if already installed
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
      setVisible(true)
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

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      // iOS or unsupported: show manual instructions
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
    iosInstructions,
    setIosInstructions,
    promptInstall,
    dismiss,
  }
}
