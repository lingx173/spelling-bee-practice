import ReactDOM from 'react-dom/client'
import UltraSimpleApp from './App-ultra-simple.tsx'

console.log('Ultra-simple main.tsx starting...')

try {
  const rootElement = document.getElementById('root')
  console.log('Root element found:', rootElement)
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root created')
    
    root.render(<UltraSimpleApp />)
    console.log('UltraSimpleApp rendered successfully!')
  } else {
    console.error('Root element not found!')
  }
} catch (error) {
  console.error('Error in ultra-simple main.tsx:', error)
}
