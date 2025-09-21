import React from 'react'
import ReactDOM from 'react-dom/client'
import SimpleApp from './App-simple.tsx'

console.log('No-CSS main.tsx starting...')
console.log('React version:', React.version)
console.log('Document ready state:', document.readyState)

try {
  console.log('Looking for root element...')
  const rootElement = document.getElementById('root')
  console.log('Root element found:', rootElement)
  
  if (rootElement) {
    console.log('Creating React root...')
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root created successfully')
    
    console.log('Rendering SimpleApp...')
    root.render(<SimpleApp />)
    console.log('SimpleApp rendered successfully!')
  } else {
    console.error('Root element not found!')
  }
} catch (error) {
  console.error('Error in no-css main.tsx:', error)
  console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
}
