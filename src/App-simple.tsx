import { useEffect } from 'react'

function SimpleApp() {
  useEffect(() => {
    console.log('SimpleApp mounted successfully')
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Spelling Bee Practice - Simple Test</h1>
      <p>If you can see this, React is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Test Navigation</h2>
        <button onClick={() => window.location.href = '/test.html'}>Go to Test Page</button>
        <button onClick={() => window.location.href = '/simple-test.html'}>Go to Simple Test</button>
      </div>
    </div>
  )
}

export default SimpleApp
