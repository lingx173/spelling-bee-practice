import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Spelling Bee Practice</h1>
        <p className="text-lg text-gray-600 mb-2">Welcome to your spelling practice app!</p>
        <p className="text-sm text-gray-500 mb-8">Current time: {new Date().toLocaleString()}</p>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Navigation</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              to="/practice" 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-center hover:bg-blue-700 transition-colors"
            >
              Practice
            </Link>
            <Link 
              to="/upload" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg text-center hover:bg-green-700 transition-colors"
            >
              Upload Words
            </Link>
            <Link 
              to="/words" 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg text-center hover:bg-purple-700 transition-colors"
            >
              Word List
            </Link>
            <Link 
              to="/settings" 
              className="bg-gray-600 text-white px-6 py-3 rounded-lg text-center hover:bg-gray-700 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Practice() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Practice Mode</h1>
          <p className="text-lg text-gray-600 mb-6">Practice your spelling words here!</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function Upload() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Words</h1>
          <p className="text-lg text-gray-600 mb-6">Upload your word list here!</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function WordList() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Word List</h1>
          <p className="text-lg text-gray-600 mb-6">View your word list here!</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function Settings() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Settings</h1>
          <p className="text-lg text-gray-600 mb-6">Configure your settings here!</p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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