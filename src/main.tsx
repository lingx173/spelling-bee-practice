import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSettings, seedSampleWords } from './lib/database.ts'

console.log('Main.tsx starting...')
console.log('React version:', React.version)
console.log('Document ready state:', document.readyState)

// Initialize the database
console.log('Initializing database...')
initializeSettings().catch(error => {
  console.warn('Failed to initialize settings:', error)
})
seedSampleWords().catch(error => {
  console.warn('Failed to seed sample words:', error)
})

console.log('Looking for root element...')
const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (rootElement) {
  console.log('Creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  console.log('Rendering App...')
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App rendered successfully!')
} else {
  console.error('Root element not found!')
}
