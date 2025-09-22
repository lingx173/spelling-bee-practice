import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Spelling Bee Practice</h1>
        <p className="text-gray-600 mb-8">Welcome to your spelling practice app!</p>
        <div className="space-x-4">
          <Link to="/practice" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Start Practice
          </Link>
          <Link to="/upload" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Upload Words
          </Link>
        </div>
      </div>
    </div>
  )
}

function Practice() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Practice Mode</h1>
        <p className="text-gray-600">Practice mode coming soon...</p>
        <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  )
}

function Upload() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Words</h1>
        <p className="text-gray-600">Upload functionality coming soon...</p>
        <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="text-xl font-bold text-gray-800">
                Spelling Bee Practice
              </Link>
              <div className="space-x-4">
                <Link to="/" className="text-gray-600 hover:text-gray-800">Home</Link>
                <Link to="/practice" className="text-gray-600 hover:text-gray-800">Practice</Link>
                <Link to="/upload" className="text-gray-600 hover:text-gray-800">Upload</Link>
              </div>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/upload" element={<Upload />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
