import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
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
  const { words, updateWord } = useWords()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [practiceMode, setPracticeMode] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [isPracticeActive, setIsPracticeActive] = useState(false)
  const [settings, setSettings] = useState({
    autoAdvance: false,
    showHints: true,
    practiceOrder: 'random' as 'random' | 'sequential',
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard'
  })
  const [practiceWords, setPracticeWords] = useState<typeof words>([])

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('spelling-bee-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Shuffle array function
  const shuffleArray = (array: typeof words) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Get filtered words based on practice mode
  const getFilteredWords = () => {
    const filtered = practiceMode === 'all' 
      ? words 
      : words.filter(word => word.difficulty === practiceMode)
    
    // Apply order setting
    return settings.practiceOrder === 'random' ? shuffleArray(filtered) : filtered
  }

  const currentWord = practiceWords[currentWordIndex]

  const startPractice = () => {
    const filtered = getFilteredWords()
    if (filtered.length === 0) {
      alert('No words available for practice! Please add some words first.')
      return
    }
    setPracticeWords(filtered)
    setCurrentWordIndex(0)
    setScore({ correct: 0, total: 0 })
    setIsPracticeActive(true)
    setShowResult(false)
    setUserInput('')
  }

  const checkAnswer = () => {
    if (!currentWord) return

    const correct = userInput.toLowerCase().trim() === currentWord.text.toLowerCase()
    setIsCorrect(correct)
    setShowResult(true)

    // Update word statistics
    updateWord(currentWord.id, {
      correctCount: currentWord.correctCount + (correct ? 1 : 0),
      incorrectCount: currentWord.incorrectCount + (correct ? 0 : 1)
    })

    // Update score
    setScore(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1
    }))

    // Auto-advance if enabled
    if (settings.autoAdvance) {
      setTimeout(() => {
        nextWord()
      }, 2000) // 2 second delay to show result
    }
  }

  const nextWord = () => {
    if (currentWordIndex < practiceWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setUserInput('')
      setShowResult(false)
    } else {
      // Practice completed
      setIsPracticeActive(false)
      setCurrentWordIndex(0)
    }
  }

  const resetPractice = () => {
    setIsPracticeActive(false)
    setCurrentWordIndex(0)
    setUserInput('')
    setShowResult(false)
    setScore({ correct: 0, total: 0 })
  }

  if (!isPracticeActive) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Practice Mode</h1>
              <Link 
                to="/" 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>

            {getFilteredWords().length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg text-gray-600 mb-4">No words available for practice!</p>
                <Link 
                  to="/upload" 
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Some Words
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Practice Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Practice Mode
                      </label>
                      <select
                        value={practiceMode}
                        onChange={(e) => setPracticeMode(e.target.value as 'all' | 'easy' | 'medium' | 'hard')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Words ({words.length})</option>
                        <option value="easy">Easy Words ({words.filter(w => w.difficulty === 'easy').length})</option>
                        <option value="medium">Medium Words ({words.filter(w => w.difficulty === 'medium').length})</option>
                        <option value="hard">Hard Words ({words.filter(w => w.difficulty === 'hard').length})</option>
                      </select>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Words to practice: <span className="font-semibold">{getFilteredWords().length}</span></p>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={startPractice}
                    className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Practice
                  </button>
                </div>
              </div>
            )}
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
            <h1 className="text-3xl font-bold text-gray-900">Practice Mode</h1>
            <div className="flex gap-2">
              <button
                onClick={resetPractice}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                End Practice
              </button>
              <Link 
                to="/" 
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>

          {settings.showHints && (
            <div className="text-center mb-8">
              <div className="text-lg text-gray-600 mb-2">
                Word {currentWordIndex + 1} of {practiceWords.length}
              </div>
              <div className="text-sm text-gray-500">
                Score: {score.correct}/{score.total} ({score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0}%)
              </div>
            </div>
          )}

          {currentWord && (
            <div className="space-y-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-gray-900 mb-4">
                  {currentWord.text.toUpperCase()}
                </div>
                {settings.showHints && (
                  <div className={`inline-block px-3 py-1 text-sm rounded-full ${
                    currentWord.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                    currentWord.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {currentWord.difficulty}
                  </div>
                )}
              </div>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !showResult && checkAnswer()}
                  placeholder="Type the word here..."
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                  disabled={showResult}
                />
              </div>

              {!showResult ? (
                <div className="text-center">
                  <button
                    onClick={checkAnswer}
                    className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Check Answer
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className={`text-2xl font-bold ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </div>
                  {!isCorrect && (
                    <div className="text-lg text-gray-600">
                      Correct spelling: <span className="font-semibold">{currentWord.text}</span>
                    </div>
                  )}
                  {!settings.autoAdvance && (
                    <button
                      onClick={nextWord}
                      className="px-8 py-3 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {currentWordIndex < practiceWords.length - 1 ? 'Next Word' : 'Finish Practice'}
                    </button>
                  )}
                  {settings.autoAdvance && (
                    <div className="text-sm text-gray-500">
                      Auto-advancing in 2 seconds...
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
  const { words, clearAllWords } = useWords()
  const [showConfirmClear, setShowConfirmClear] = useState(false)
  const [settings, setSettings] = useState({
    autoAdvance: false,
    showHints: true,
    practiceOrder: 'random' as 'random' | 'sequential',
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard'
  })

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('spelling-bee-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  // Save settings to localStorage
  const updateSetting = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('spelling-bee-settings', JSON.stringify(newSettings))
  }

  const handleClearAllWords = () => {
    clearAllWords()
    setShowConfirmClear(false)
  }

  const getStats = () => {
    const totalWords = words.length
    const easyWords = words.filter(w => w.difficulty === 'easy').length
    const mediumWords = words.filter(w => w.difficulty === 'medium').length
    const hardWords = words.filter(w => w.difficulty === 'hard').length
    const totalCorrect = words.reduce((sum, word) => sum + word.correctCount, 0)
    const totalIncorrect = words.reduce((sum, word) => sum + word.incorrectCount, 0)
    const totalAttempts = totalCorrect + totalIncorrect
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0

    return {
      totalWords,
      easyWords,
      mediumWords,
      hardWords,
      totalCorrect,
      totalIncorrect,
      totalAttempts,
      accuracy
    }
  }

  const stats = getStats()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <Link 
              to="/" 
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>

          <div className="space-y-8">
            {/* Statistics */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalWords}</div>
                  <div className="text-sm text-gray-600">Total Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.easyWords}</div>
                  <div className="text-sm text-gray-600">Easy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.mediumWords}</div>
                  <div className="text-sm text-gray-600">Medium</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.hardWords}</div>
                  <div className="text-sm text-gray-600">Hard</div>
                </div>
              </div>
              {stats.totalAttempts > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{stats.totalCorrect}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{stats.totalIncorrect}</div>
                      <div className="text-sm text-gray-600">Incorrect</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-gray-800">{stats.accuracy}%</div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Practice Settings */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Practice Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Auto Advance</label>
                    <p className="text-xs text-gray-500">Automatically move to next word after answering</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.autoAdvance}
                    onChange={(e) => updateSetting('autoAdvance', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Show Hints</label>
                    <p className="text-xs text-gray-500">Show difficulty level and progress during practice</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showHints}
                    onChange={(e) => updateSetting('showHints', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Practice Order</label>
                  <select
                    value={settings.practiceOrder}
                    onChange={(e) => updateSetting('practiceOrder', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="random">Random Order</option>
                    <option value="sequential">Sequential Order</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Difficulty Filter</label>
                  <select
                    value={settings.difficulty}
                    onChange={(e) => updateSetting('difficulty', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Words</option>
                    <option value="easy">Easy Only</option>
                    <option value="medium">Medium Only</option>
                    <option value="hard">Hard Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Data Management */}
            <div className="bg-red-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Management</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Clear All Words</label>
                    <p className="text-xs text-gray-500">Permanently delete all {stats.totalWords} words and statistics</p>
                  </div>
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showConfirmClear && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Clear All Data?</h3>
                <p className="text-gray-600 mb-6">
                  This will permanently delete all {stats.totalWords} words and all practice statistics. 
                  This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClearAllWords}
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