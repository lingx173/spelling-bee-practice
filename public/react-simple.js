import React from 'react'
import ReactDOM from 'react-dom/client'

console.log('React simple starting...')

function SimpleApp() {
  return React.createElement('div', { style: { padding: '20px', fontFamily: 'Arial, sans-serif' } },
    React.createElement('h1', null, 'Spelling Bee Practice - Simple Test'),
    React.createElement('p', null, 'If you can see this, React is working!'),
    React.createElement('p', null, 'Current time: ' + new Date().toLocaleString()),
    React.createElement('div', { style: { marginTop: '20px' } },
      React.createElement('h2', null, 'Test Navigation'),
      React.createElement('a', { href: '/test.html', style: { marginRight: '10px' } }, 'Test Page'),
      React.createElement('a', { href: '/simple-test.html', style: { marginRight: '10px' } }, 'Simple Test'),
      React.createElement('a', { href: '/static-test.html' }, 'Static Test')
    )
  )
}

try {
  console.log('Looking for root element...')
  const rootElement = document.getElementById('root')
  console.log('Root element found:', rootElement)
  
  if (rootElement) {
    console.log('Creating React root...')
    const root = ReactDOM.createRoot(rootElement)
    console.log('React root created')
    
    root.render(React.createElement(SimpleApp))
    console.log('SimpleApp rendered successfully!')
  } else {
    console.error('Root element not found!')
  }
} catch (error) {
  console.error('Error in react-simple.js:', error)
}
