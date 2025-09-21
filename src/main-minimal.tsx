import React from 'react'
import ReactDOM from 'react-dom/client'
import MinimalApp from './App-minimal.tsx'

console.log('Minimal main.tsx starting...')

try {
  const rootElement = document.getElementById('root')
  console.log('Root element found:', rootElement)
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root created')
    
    root.render(
      <React.StrictMode>
        <MinimalApp />
      </React.StrictMode>
    )
    console.log('React app rendered')
  } else {
    console.error('Root element not found!')
  }
} catch (error) {
  console.error('Error in main.tsx:', error)
}
