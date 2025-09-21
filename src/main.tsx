import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx starting...')

try {
  const rootElement = document.getElementById('root')
  console.log('Root element found:', rootElement)
  
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root created')
    
    root.render(<App />)
    console.log('App rendered successfully!')
  } else {
    console.error('Root element not found!')
  }
} catch (error) {
  console.error('Error in main.tsx:', error)
}