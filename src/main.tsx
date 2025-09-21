import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSettings, seedSampleWords } from './lib/database.ts'

// Initialize the database
initializeSettings().catch(error => {
  console.warn('Failed to initialize settings:', error)
})
seedSampleWords().catch(error => {
  console.warn('Failed to seed sample words:', error)
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
