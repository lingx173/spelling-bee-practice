import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState } from 'react'
import { useWords } from './hooks/useWords'

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
  const { addWord, addWords } = useWords()
  const [newWord, setNewWord] = useState('')
  const [wordList, setWordList] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [message, setMessage] = useState('')

  const handleAddSingleWord = () => {
    if (newWord.trim()) {
      addWord(newWord, difficulty)
      setNewWord('')
      setMessage(`Added "${newWord}" to your word list!`)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleAddMultipleWords = () => {
    if (wordList.trim()) {
      const words = wordList
        .split('\n')
        .map(word => word.trim())
        .filter(word => word.length > 0)
      
      if (words.length > 0) {
        addWords(words, difficulty)
        setWordList('')
        setMessage(`Added ${words.length} words to your word list!`)
        setTimeout(() => setMessage(''), 3000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Add Words</h1>
            <Link 
              to="/" 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          {message && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {message}
            </div>
          )}

          <div className="space-y-8">
            {/* Single Word Addition */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Single Word</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Enter a word..."
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddSingleWord()}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Word
                </button>
              </div>
            </div>

            {/* Multiple Words Addition */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Multiple Words</h2>
              <p className="text-sm text-gray-600 mb-4">Enter one word per line:</p>
              <textarea
                placeholder="word1&#10;word2&#10;word3&#10;..."
                value={wordList}
                onChange={(e) => setWordList(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex justify-between items-center mt-4">
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
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add All Words
                </button>
              </div>
            </div>

            {/* Quick Add Sample Words */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Add Sample Words</h2>
              <p className="text-sm text-gray-600 mb-4">Add some common spelling bee words to get started:</p>
              <button
                onClick={() => {
                  const sampleWords = [
                    'beautiful', 'challenge', 'difficult', 'education', 'fantastic',
                    'generous', 'hospital', 'important', 'journey', 'knowledge',
                    'language', 'mountain', 'necessary', 'opportunity', 'perfect'
                  ]
                  addWords(sampleWords, 'medium')
                  setMessage(`Added ${sampleWords.length} sample words!`)
                  setTimeout(() => setMessage(''), 3000)
                }}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Sample Words
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WordList() {
  const { words, loading, deleteWord, clearAllWords, searchWords } = useWords()
  const [searchQuery, setSearchQuery] = useState('')
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const filteredWords = searchQuery ? searchWords(searchQuery) : words

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading words...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Word List</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmClear(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All
              </button>
              <Link 
                to="/" 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          {words.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-600 mb-4">No words added yet!</p>
              <Link 
                to="/upload" 
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Some Words
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search words..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Showing {filteredWords.length} of {words.length} words
                </p>
              </div>

              <div className="grid gap-2">
                {filteredWords.map((word) => (
                  <div key={word.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-lg font-medium text-gray-900">{word.text}</span>
                      <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
                        word.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        word.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {word.difficulty}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        ✓{word.correctCount} ✗{word.incorrectCount}
                      </span>
                      <button
                        onClick={() => deleteWord(word.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showConfirmClear && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear All Words?</h3>
                <p className="text-gray-600 mb-6">This will permanently delete all {words.length} words. This action cannot be undone.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      clearAllWords()
                      setShowConfirmClear(false)
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Yes, Clear All
                  </button>
                  <button
                    onClick={() => setShowConfirmClear(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
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