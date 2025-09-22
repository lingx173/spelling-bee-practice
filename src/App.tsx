import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useWords } from './hooks/useWords'
import { ttsService } from './services/tts'

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
  const { words, updateWord } = useWords()
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [userInput, setUserInput] = useState('')
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [isPracticeActive, setIsPracticeActive] = useState(false)
  const [practiceWords, setPracticeWords] = useState<typeof words>([])
  const [settings, setSettings] = useState({
    autoAdvance: false,
    showHints: true,
    practiceOrder: 'random' as 'random' | 'sequential',
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard',
    ttsEnabled: true,
    ttsRate: 0.8,
    ttsPitch: 1.0,
    ttsVolume: 1.0
  })
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('spelling-bee-settings')
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      setSettings({
        autoAdvance: parsedSettings.autoAdvance ?? false,
        showHints: parsedSettings.showHints ?? true,
        practiceOrder: parsedSettings.practiceOrder ?? 'random',
        difficulty: parsedSettings.difficulty ?? 'all',
        ttsEnabled: parsedSettings.ttsEnabled ?? true,
        ttsRate: parsedSettings.ttsRate ?? 0.8,
        ttsPitch: parsedSettings.ttsPitch ?? 1.0,
        ttsVolume: parsedSettings.ttsVolume ?? 1.0
      })
    }
  }, [])

  // Initialize TTS
  useEffect(() => {
    ttsService.ensureReady().catch(console.warn)
  }, [])

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const getFilteredWords = () => {
    let filtered = words
    if (settings.difficulty !== 'all') {
      filtered = words.filter(word => word.difficulty === settings.difficulty)
    }
    return settings.practiceOrder === 'random' ? shuffleArray(filtered) : filtered
  }

  const startPractice = () => {
    const filtered = getFilteredWords()
    if (filtered.length === 0) {
      alert('No words available for practice. Please add some words first.')
      return
    }
    
    setPracticeWords(filtered)
    setCurrentWordIndex(0)
    setUserInput('')
    setIsCorrect(null)
    setShowHint(false)
    setScore({ correct: 0, total: 0 })
    setIsPracticeActive(true)
  }

  const currentWord = practiceWords[currentWordIndex]

  const checkAnswer = () => {
    if (!currentWord) return

    const correct = userInput.toLowerCase().trim() === currentWord.text.toLowerCase()
    setIsCorrect(correct)

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
      }, 2000)
    }
  }

  const nextWord = () => {
    if (currentWordIndex < practiceWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1)
      setUserInput('')
      setIsCorrect(null)
      setShowHint(false)
    } else {
      // Practice completed
      setIsPracticeActive(false)
      setPracticeWords([])
    }
  }

  const resetPractice = () => {
    setIsPracticeActive(false)
    setPracticeWords([])
    setCurrentWordIndex(0)
    setUserInput('')
    setIsCorrect(null)
    setShowHint(false)
    setScore({ correct: 0, total: 0 })
    ttsService.stop()
    setIsSpeaking(false)
  }

  const speakWord = async () => {
    if (!currentWord || !settings.ttsEnabled) return
    
    try {
      setIsSpeaking(true)
      await ttsService.speak(currentWord.text, {
        rate: settings.ttsRate,
        pitch: settings.ttsPitch,
        volume: settings.ttsVolume
      })
    } catch (error) {
      console.error('TTS error:', error)
    } finally {
      setIsSpeaking(false)
    }
  }

  const getHint = () => {
    if (!currentWord) return ''
    const word = currentWord.text
    if (word.length <= 3) return word[0]
    return word[0] + '_'.repeat(word.length - 2) + word[word.length - 1]
  }

  if (!isPracticeActive) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Practice Mode</h1>
          
          {words.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <p className="text-yellow-800">No words available for practice. Please add some words first.</p>
              <Link to="/upload" className="text-blue-600 hover:underline mt-2 inline-block">
                Go to Upload Words →
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Practice Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                  <select
                    value={settings.difficulty}
                    onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                  <select
                    value={settings.practiceOrder}
                    onChange={(e) => setSettings(prev => ({ ...prev, practiceOrder: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="sequential">Sequential</option>
                    <option value="random">Random</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showHints"
                    checked={settings.showHints}
                    onChange={(e) => setSettings(prev => ({ ...prev, showHints: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showHints" className="ml-2 text-sm text-gray-700">
                    Show hints
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="autoAdvance"
                    checked={settings.autoAdvance}
                    onChange={(e) => setSettings(prev => ({ ...prev, autoAdvance: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="autoAdvance" className="ml-2 text-sm text-gray-700">
                    Auto-advance (2s delay)
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={startPractice}
              disabled={words.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Start Practice
            </button>
            <Link to="/" className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Practice Mode</h1>
          <div className="text-sm text-gray-600">
            Word {currentWordIndex + 1} of {practiceWords.length}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentWordIndex + 1) / practiceWords.length) * 100}%` }}
          ></div>
        </div>

        {/* Score */}
        <div className="text-center mb-6">
          <span className="text-lg font-medium text-gray-700">
            Score: {score.correct}/{score.total} 
            {score.total > 0 && (
              <span className="ml-2 text-sm text-gray-500">
                ({Math.round((score.correct / score.total) * 100)}%)
              </span>
            )}
          </span>
        </div>

        {/* Word Display */}
        <div className="bg-white rounded-lg p-8 shadow-sm mb-6 text-center">
          <div className="mb-4">
            <span className="text-sm text-gray-500">Difficulty: </span>
            <span className={`px-2 py-1 text-xs rounded-full ${
              currentWord?.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
              currentWord?.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {currentWord?.difficulty}
            </span>
          </div>
          
          <div className="mb-6">
            <button
              onClick={speakWord}
              disabled={!settings.ttsEnabled || isSpeaking}
              className={`p-3 rounded-full transition-colors ${
                isSpeaking 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isSpeaking ? (
                <svg className="w-6 h-6 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                </svg>
              )}
            </button>
          </div>

          {settings.showHints && (
            <div className="mb-4">
              <button
                onClick={() => setShowHint(!showHint)}
                className="text-sm text-blue-600 hover:underline"
              >
                {showHint ? 'Hide' : 'Show'} Hint
              </button>
              {showHint && (
                <div className="mt-2 text-2xl font-mono text-gray-600">
                  {getHint()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
              placeholder="Type the word here..."
              className="flex-1 px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={checkAnswer}
              disabled={!userInput.trim()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Check
            </button>
          </div>
        </div>

        {/* Result */}
        {isCorrect !== null && (
          <div className={`rounded-lg p-4 mb-6 text-center ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="text-2xl mb-2">
              {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
            </div>
            {!isCorrect && (
              <div className="text-lg">
                The correct spelling is: <strong>{currentWord?.text}</strong>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-between items-center">
          <button
            onClick={resetPractice}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            End Practice
          </button>
          
          {!settings.autoAdvance && (
            <button
              onClick={nextWord}
              disabled={currentWordIndex >= practiceWords.length - 1}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Next Word
            </button>
          )}
          
          {settings.autoAdvance && (
            <div className="text-sm text-gray-500">
              Auto-advancing...
            </div>
          )}
        </div>
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
  
  // PDF upload states
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [uploadResult, setUploadResult] = useState<{
    wordsCount: number
    filename: string
    duplicates: number
    method?: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('PDF upload triggered, file:', file)
    
    if (!file) {
      console.log('No file selected')
      setUploadStatus('idle')
      return
    }

    console.log('File type:', file.type, 'Size:', file.size)

    if (file.type !== 'application/pdf') {
      setUploadStatus('error')
      setMessage('Please select a PDF file')
      setTimeout(() => {
        setUploadStatus('idle')
        setMessage('')
      }, 3000)
      return
    }

    setUploadStatus('processing')
    setIsProcessing(true)
    setProcessingStep('Processing PDF...')
    setMessage('')
    console.log('Starting PDF processing...')
    
    // Update processing step for OCR
    setTimeout(() => {
      if (isProcessing) {
        setProcessingStep('Converting PDF to image...')
      }
    }, 1000)
    
    setTimeout(() => {
      if (isProcessing) {
        setProcessingStep('Running OCR recognition...')
      }
    }, 3000)
    
    try {
      // Dynamically import PDF parsing service to avoid blocking initial load
      const { pdfParsingService } = await import('./services/pdf-parser')
      const result = await pdfParsingService.parseFile(file)
      console.log('PDF processing result:', result)
      
      if (result.words.length > 0) {
        const addResult = addWords(result.words, difficulty)
        setUploadStatus('success')
        setUploadResult({ 
          wordsCount: addResult.addedCount, 
          filename: file.name,
          duplicates: addResult.duplicateCount,
          method: result.metadata.method
        })
        setMessage(addResult.message)
        
        // Auto-reset after 7 seconds for more detailed messages
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadResult(null)
          setMessage('')
        }, 7000)
      } else {
        setUploadStatus('error')
        setMessage('No words found in the PDF')
        setTimeout(() => {
          setUploadStatus('idle')
          setMessage('')
        }, 3000)
      }
    } catch (error) {
      console.error('PDF processing error:', error)
      setUploadStatus('error')
      
      // Provide more helpful error messages
      let errorMessage = 'Failed to process PDF. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'PDF processing timed out. The file might be too large or complex.'
        } else if (error.message.includes('Invalid file')) {
          errorMessage = 'Invalid PDF file. Please check the file and try again.'
        } else if (error.message.includes('File too large')) {
          errorMessage = 'File is too large. Please upload a PDF smaller than 50MB.'
        } else {
          errorMessage = `PDF processing failed: ${error.message}`
        }
      }
      
      setMessage(errorMessage)
      setTimeout(() => {
        setUploadStatus('idle')
        setMessage('')
      }, 5000)
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
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

        {/* PDF Upload */}
        <div className={`rounded-lg p-6 transition-colors ${
          uploadStatus === 'success' ? 'bg-green-50 border-2 border-green-200' :
          uploadStatus === 'error' ? 'bg-red-50 border-2 border-red-200' :
          uploadStatus === 'processing' ? 'bg-blue-50 border-2 border-blue-200' :
          'bg-orange-50 border border-orange-200'
        }`}>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload PDF Document</h2>
          <p className="text-sm text-gray-600 mb-4">Upload a PDF file to automatically extract words for practice:</p>
          
          <div className="space-y-4">
            {/* Upload Status Display */}
            {uploadStatus === 'processing' && (
              <div className="flex items-center p-4 bg-blue-100 rounded-lg">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <div>
                  <p className="font-medium text-blue-800">Processing PDF...</p>
                  <p className="text-sm text-blue-600">{processingStep}</p>
                </div>
              </div>
            )}

            {uploadStatus === 'success' && uploadResult && (
              <div className="flex items-center p-4 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-green-800">Upload Successful!</p>
                  <p className="text-sm text-green-600">
                    Added {uploadResult.wordsCount} new words from "{uploadResult.filename}"
                    {uploadResult.duplicates > 0 && (
                      <span className="block text-orange-600">
                        ({uploadResult.duplicates} duplicates skipped)
                      </span>
                    )}
                    {uploadResult.method === 'ocr' && (
                      <span className="block text-blue-600 text-xs">
                        ✓ Extracted using OCR from scanned document
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {uploadStatus === 'error' && (
              <div className="flex items-center p-4 bg-red-100 rounded-lg">
                <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <div>
                  <p className="font-medium text-red-800">Upload Failed</p>
                  <p className="text-sm text-red-600">{message}</p>
                </div>
              </div>
            )}

            {/* File Input */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                disabled={isProcessing}
                className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                  uploadStatus === 'success' ? 'border-green-300 bg-green-50' :
                  uploadStatus === 'error' ? 'border-red-300 bg-red-50' :
                  uploadStatus === 'processing' ? 'border-blue-300 bg-blue-50' :
                  'border-orange-300 focus:ring-orange-500 focus:border-orange-500'
                } disabled:opacity-50`}
                style={{ display: 'block' }}
              />
              
              {/* Upload Icon Overlay */}
              {uploadStatus === 'idle' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-orange-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-sm text-orange-600 font-medium">Click to select PDF file</p>
                  </div>
                </div>
              )}
            </div>

            {/* File Requirements */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Maximum file size: 50MB</p>
              <p>• Supported format: PDF only</p>
              <p>• Words will be extracted and added to your word list</p>
              <p>• Processing may take a few seconds</p>
            </div>

            {/* Action Buttons */}
            {uploadStatus === 'success' && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setUploadStatus('idle')
                    setUploadResult(null)
                    setMessage('')
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Upload Another File
                </button>
                <Link
                  to="/words"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  View Word List
                </Link>
              </div>
            )}

            {uploadStatus === 'error' && (
              <button
                onClick={() => {
                  setUploadStatus('idle')
                  setMessage('')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            )}
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
