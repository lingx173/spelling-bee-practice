import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { useWords } from './hooks/useWords'
import { ttsService } from './services/tts'
import { pdfParsingService } from './services/pdf-parser'

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
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard',
    ttsEnabled: true,
    ttsRate: 0.8,
    ttsPitch: 1.0,
    ttsVolume: 1.0
  })
  const [practiceWords, setPracticeWords] = useState<typeof words>([])
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('spelling-bee-settings')
    console.log('Practice component loading settings from localStorage:', savedSettings)
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      console.log('Practice component parsed settings:', parsedSettings)
      // Ensure all settings have default values
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

  // Initialize TTS service
  useEffect(() => {
    const initTTS = async () => {
      try {
        await ttsService.ensureReady()
        console.log('TTS service initialized successfully')
      } catch (error) {
        console.warn('TTS service initialization failed:', error)
      }
    }
    
    initTTS()
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
    ttsService.stop()
    setIsSpeaking(false)
  }

  const speakWord = async (word: string) => {
    if (!settings.ttsEnabled) return
    
    if (isSpeaking) {
      ttsService.stop()
      setIsSpeaking(false)
      return
    }

    try {
      setIsSpeaking(true)
      await ttsService.speak(word, { 
        rate: settings.ttsRate,
        pitch: settings.ttsPitch,
        volume: settings.ttsVolume
      })
      setIsSpeaking(false)
    } catch (error) {
      console.error('TTS error:', error)
      setIsSpeaking(false)
    }
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
                <div className="flex items-center justify-center gap-4 mb-4">
                  <div className="text-6xl font-bold text-gray-900">
                    {currentWord.text.toUpperCase()}
                  </div>
                  <button
                    onClick={() => speakWord(currentWord.text)}
                    className={`p-3 rounded-full transition-colors ${
                      isSpeaking 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                    }`}
                    title={isSpeaking ? 'Stop pronunciation' : 'Pronounce word'}
                  >
                    {isSpeaking ? (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L4.617 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.617l3.766-3.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [uploadResult, setUploadResult] = useState<{wordsCount: number, filename: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    
    try {
      const result = await pdfParsingService.parseFile(file)
      console.log('PDF processing result:', result)
      
      if (result.words.length > 0) {
        addWords(result.words, difficulty)
        setUploadStatus('success')
        setUploadResult({ wordsCount: result.words.length, filename: file.name })
        setMessage(`Successfully imported ${result.words.length} words from "${file.name}"!`)
        
        // Auto-reset after 5 seconds
        setTimeout(() => {
          setUploadStatus('idle')
          setUploadResult(null)
          setMessage('')
        }, 5000)
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF. Please try again.'
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
                <div className={`mb-6 p-4 border rounded-lg ${
                  message.includes('Successfully') || message.includes('Added') 
                    ? 'bg-green-100 border-green-400 text-green-700'
                    : 'bg-red-100 border-red-400 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              {isProcessing && (
                <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    {processingStep}
                  </div>
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
                        Imported {uploadResult.wordsCount} words from "{uploadResult.filename}"
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
                  <p>• Maximum file size: 10MB</p>
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
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard',
    ttsEnabled: true,
    ttsRate: 0.8,
    ttsPitch: 1.0,
    ttsVolume: 1.0
  })

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('spelling-bee-settings')
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings)
      // Ensure all settings have default values
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

  // Save settings to localStorage
  const updateSetting = (key: string, value: any) => {
    console.log('Updating setting:', key, 'to:', value)
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('spelling-bee-settings', JSON.stringify(newSettings))
    console.log('Settings updated:', newSettings)
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

            {/* Text-to-Speech Settings */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Text-to-Speech Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Enable TTS</label>
                    <p className="text-xs text-gray-500">Enable audio pronunciation of words during practice</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.ttsEnabled}
                    onChange={(e) => updateSetting('ttsEnabled', e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </div>

                {settings.ttsEnabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Speech Rate: {settings.ttsRate.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={settings.ttsRate}
                        onChange={(e) => updateSetting('ttsRate', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pitch: {settings.ttsPitch.toFixed(1)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={settings.ttsPitch}
                        onChange={(e) => updateSetting('ttsPitch', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Volume: {Math.round(settings.ttsVolume * 100)}%
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={settings.ttsVolume}
                        onChange={(e) => updateSetting('ttsVolume', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={async () => {
                          try {
                            await ttsService.speak('Hello, this is a test of the text-to-speech feature.', {
                              rate: settings.ttsRate,
                              pitch: settings.ttsPitch,
                              volume: settings.ttsVolume
                            })
                          } catch (error) {
                            console.error('TTS test failed:', error)
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Test Voice
                      </button>
                    </div>
                  </>
                )}
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