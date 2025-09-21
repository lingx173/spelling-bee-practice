import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function Home() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Spelling Bee Practice</h1>
      <p>Welcome to your spelling practice app!</p>
      <p>Current time: {new Date().toLocaleString()}</p>
      <div style={{ marginTop: '20px' }}>
        <h2>Navigation</h2>
        <a href="/practice" style={{ marginRight: '10px' }}>Practice</a>
        <a href="/upload" style={{ marginRight: '10px' }}>Upload Words</a>
        <a href="/words" style={{ marginRight: '10px' }}>Word List</a>
        <a href="/settings">Settings</a>
      </div>
    </div>
  )
}

function Practice() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Practice Mode</h1>
      <p>Practice your spelling words here!</p>
      <a href="/">← Back to Home</a>
    </div>
  )
}

function Upload() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Upload Words</h1>
      <p>Upload your word list here!</p>
      <a href="/">← Back to Home</a>
    </div>
  )
}

function WordList() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Word List</h1>
      <p>View your word list here!</p>
      <a href="/">← Back to Home</a>
    </div>
  )
}

function Settings() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Settings</h1>
      <p>Configure your settings here!</p>
      <a href="/">← Back to Home</a>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/words" element={<WordList />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App