import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Home } from './components/pages/Home'
import { Practice } from './components/pages/Practice'
import { Upload } from './components/pages/Upload'
import { WordList } from './components/pages/WordList'
import { Settings } from './components/pages/Settings'
import { Layout } from './components/layout/Layout'
import { PWAUpdateNotification } from './components/ui/PWAUpdateNotification'

function App() {
  return (
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
  )
}

export default App
