import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { useWords } from './hooks/useWords'

function Home() {
  const { words } = useWords()
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Spelling Bee Practice</h1>
        <p className="text-gray-600 mb-4">Welcome to your spelling practice app!</p>
        <p className="text-sm text-gray-500 mb-8">
          You have {words.length} words in your collection
        </p>
        <div className="space-x-4">
          <Link to="/practice" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Start Practice
          </Link>
          <Link to="/upload" className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Upload Words
          </Link>
          <Link to="/words" className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            View Words
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

function Words() {
  const { words, deleteWord, clearAllWords } = useWords()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const filteredWords = words.filter(word => {
    const matchesSearch = word.text.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDifficulty = filterDifficulty === 'all' || word.difficulty === filterDifficulty
    return matchesSearch && matchesDifficulty
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Word List</h1>
          <div className="flex gap-4">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all words?')) {
                  clearAllWords()
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Clear All
            </button>
            <Link to="/" className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Back to Home
            </Link>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search words..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Word Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing {filteredWords.length} of {words.length} words
          </p>
        </div>

        {/* Word List */}
        <div className="bg-white rounded-lg shadow-sm">
          {filteredWords.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {words.length === 0 ? 'No words added yet. Go to Upload to add some words!' : 'No words match your search criteria.'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredWords.map((word) => (
                <div key={word.id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-medium text-gray-800">{word.text}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        word.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {word.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Added: {new Date(word.addedAt).toLocaleDateString()}
                      {word.correctCount > 0 || word.incorrectCount > 0 && (
                        <span className="ml-4">
                          Score: {word.correctCount}/{word.correctCount + word.incorrectCount}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${word.text}"?`)) {
                        deleteWord(word.id)
                      }
                    }}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Upload() {
  const { addWord, addWords } = useWords()
  const [singleWord, setSingleWord] = useState('')
  const [wordList, setWordList] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [message, setMessage] = useState('')

  const handleAddSingleWord = () => {
    if (!singleWord.trim()) {
      setMessage('Please enter a word')
      return
    }
    
    const result = addWord(singleWord, difficulty)
    setMessage(result.message)
    if (result.success) {
      setSingleWord('')
    }
  }

  const handleAddMultipleWords = () => {
    if (!wordList.trim()) {
      setMessage('Please enter some words')
      return
    }
    
    const words = wordList.split('\n').map(w => w.trim()).filter(w => w.length > 0)
    const result = addWords(words, difficulty)
    setMessage(result.message)
    if (result.success) {
      setWordList('')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Upload Words</h1>
        
        {/* Single Word Input */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Single Word</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Enter a word..."
                value={singleWord}
                onChange={(e) => setSingleWord(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && handleAddSingleWord()}
              />
            </div>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              onClick={handleAddSingleWord}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Word
            </button>
          </div>
        </div>

        {/* Multiple Words Input */}
        <div className="bg-white rounded-lg p-6 mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Multiple Words</h2>
          <textarea
            placeholder="Enter words, one per line:&#10;word1&#10;word2&#10;word3&#10;..."
            value={wordList}
            onChange={(e) => setWordList(e.target.value)}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
          <div className="flex justify-between items-center">
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              onClick={handleAddMultipleWords}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Add All Words
            </button>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('successfully') || message.includes('Added') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}

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
                <Link to="/words" className="text-gray-600 hover:text-gray-800">Words</Link>
              </div>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/words" element={<Words />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
