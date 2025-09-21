function SimpleApp() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Spelling Bee Practice</h1>
      <p>Simple version - if you see this, the app is working!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Test Pages</h2>
        <a href="/test.html" style={{ marginRight: '10px' }}>Test Page</a>
        <a href="/static-test.html" style={{ marginRight: '10px' }}>Static Test</a>
        <a href="/cdn-test.html">CDN React Test</a>
      </div>
    </div>
  )
}

export default SimpleApp