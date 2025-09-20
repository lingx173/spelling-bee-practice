import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { X, Download } from 'lucide-react'
import toast from 'react-hot-toast'

export function PWAUpdateNotification() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r)
    },
    onRegisterError(error) {
      console.log('SW registration error', error)
    },
  })

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  useEffect(() => {
    if (offlineReady) {
      toast.success('App is ready to work offline!')
      setOfflineReady(false)
    }
  }, [offlineReady, setOfflineReady])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice

    console.log(`User response to the install prompt: ${outcome}`)

    // Clear the deferredPrompt
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const handleUpdateClick = () => {
    updateServiceWorker(true)
  }

  return (
    <>
      {/* App Update Available */}
      {needRefresh && (
        <div className="fixed bottom-4 right-4 bg-primary-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Update Available</h4>
              <p className="text-sm text-primary-100 mb-3">
                A new version of the app is available. Reload to update.
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleUpdateClick}
                  className="bg-white text-primary-600 px-3 py-1 rounded text-sm font-medium hover:bg-primary-50 transition-colors"
                >
                  Update
                </button>
                <button
                  onClick={() => setNeedRefresh(false)}
                  className="text-primary-100 hover:text-white transition-colors text-sm"
                >
                  Later
                </button>
              </div>
            </div>
            <button
              onClick={() => setNeedRefresh(false)}
              className="text-primary-100 hover:text-white transition-colors ml-2"
              aria-label="Close update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Install App Prompt */}
      {showInstallPrompt && (
        <div className="fixed bottom-4 left-4 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm z-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Download className="w-4 h-4" />
                <h4 className="font-semibold">Install App</h4>
              </div>
              <p className="text-sm text-green-100 mb-3">
                Install Spelling Bee Practice for a better experience!
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={handleInstallClick}
                  className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-green-50 transition-colors"
                >
                  Install
                </button>
                <button
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-green-100 hover:text-white transition-colors text-sm"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowInstallPrompt(false)}
              className="text-green-100 hover:text-white transition-colors ml-2"
              aria-label="Close install prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
