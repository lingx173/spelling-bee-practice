import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeSettings, seedSampleWords } from './lib/database.ts'

// Initialize the database
initializeSettings().catch(console.error)
seedSampleWords().catch(console.error)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
