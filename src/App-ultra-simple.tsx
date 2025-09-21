function UltraSimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Spelling Bee Practice</h1>
      <p>Ultra-simple version - if you see this, the app is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Navigation</h2>
        <a href="/test.html" style={{ marginRight: '10px' }}>Test Page</a>
        <a href="/simple-test.html" style={{ marginRight: '10px' }}>Simple Test</a>
        <a href="/react-simple.html">React Simple</a>
      </div>
    </div>
  )
}

export default UltraSimpleApp
