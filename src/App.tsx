import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, Component, ReactNode } from 'react'
import { Home } from './components/pages/Home'
import { Practice } from './components/pages/Practice'
import { Upload } from './components/pages/Upload'
import { WordList } from './components/pages/WordList'
import { Settings } from './components/pages/Settings'
import { Layout } from './components/layout/Layout'
import { PWAUpdateNotification } from './components/ui/PWAUpdateNotification'
import { ttsService } from './services/tts'

// Simple error boundary component
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  // Debug logging
  useEffect(() => {
    console.log('App component mounted')
    console.log('Current URL:', window.location.href)
    console.log('Current pathname:', window.location.pathname)
  }, [])

  // Initialize TTS service when app loads
  useEffect(() => {
    const initTTS = async () => {
      try {
        await ttsService.ensureReady()
        console.log('TTS service initialized successfully')
      } catch (error) {
        console.warn('TTS service initialization failed:', error)
      }
    }
    
    initTTS()
  }, [])
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/practice" element={<Practice />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/words" element={<WordList />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Layout>
          
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '16px',
                padding: '12px 16px',
              },
            }}
          />
          
          <PWAUpdateNotification />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
