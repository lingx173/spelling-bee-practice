import { useState, useEffect, useCallback, useRef } from 'react'
import { Volume2, RotateCcw, CheckCircle, XCircle, SkipForward, Home } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Word, PracticeResult } from '../../types'
import { wordService } from '../../services/word-service'
import { ttsService } from '../../services/tts'
import { Confetti } from '../ui/Confetti'

export function Practice() {
  const [currentWord, setCurrentWord] = useState<Word | null>(null)
  const [userInput, setUserInput] = useState('')
  const [showResult, setShowResult] = useState<PracticeResult | null>(null)
  const [streak, setStreak] = useState(0)
  const [sessionStats, setSessionStats] = useState({
    attempted: 0,
    correct: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [practiceWords, setPracticeWords] = useState<Word[]>([])
  const [showConfetti, setShowConfetti] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const usedWordIds = useRef<string[]>([])

  useEffect(() => {
    loadPracticeWords()
  }, [])

  useEffect(() => {
    if (practiceWords.length > 0) {
      loadNextWord()
    }
  }, [practiceWords])

  useEffect(() => {
    // Focus input when result is cleared
    if (!showResult && inputRef.current) {
      inputRef.current.focus()
    }
  }, [showResult])

  const loadPracticeWords = async () => {
    try {
      const words = await wordService.getAllWords()
      if (words.length === 0) {
        toast.error('No words available for practice!')
        return
      }
      setPracticeWords(words)
    } catch (error) {
      console.error('Failed to load words:', error)
      toast.error('Failed to load words for practice')
    } finally {
      setIsLoading(false)
    }
  }

  const loadNextWord = useCallback(async () => {
    try {
      // Reset if we've used all words
      if (usedWordIds.current.length >= practiceWords.length) {
        usedWordIds.current = []
      }

      const word = await wordService.getRandomWord(usedWordIds.current)
      
      if (word) {
        setCurrentWord(word)
        usedWordIds.current.push(word.id)
        
        // Automatically pronounce the word
        await speakWord(word.text)
      } else {
        toast.error('No more words available!')
      }
    } catch (error) {
      console.error('Failed to load next word:', error)
      toast.error('Failed to load next word')
    }
  }, [practiceWords])

  const speakWord = async (text: string) => {
    if (!ttsService.isAvailable) {
      toast.error('Text-to-speech is not available in your browser')
      return
    }

    try {
      setIsSpeaking(true)
      await ttsService.speak(text)
    } catch (error) {
      console.error('TTS error:', error)
      toast.error('Failed to pronounce word')
    } finally {
      setIsSpeaking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentWord || !userInput.trim()) {
      return
    }

    const trimmedInput = userInput.trim()
    const isCorrect = trimmedInput.toLowerCase() === currentWord.text.toLowerCase()
    
    setShowResult(isCorrect ? 'correct' : 'incorrect')
    
    // Update stats
    setSessionStats(prev => ({
      attempted: prev.attempted + 1,
      correct: prev.correct + (isCorrect ? 1 : 0)
    }))

    if (isCorrect) {
      setStreak(prev => prev + 1)
      setShowConfetti(true)
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000)
      
      toast.success('Correct! Well done! 🎉')
    } else {
      setStreak(0)
      toast.error(`Incorrect. The correct spelling is: ${currentWord.text}`)
    }

    // Update word statistics
    await wordService.updateWordStats(
      currentWord.id, 
      isCorrect ? 'correct' : 'incorrect'
    )
  }

  const handleSkip = async () => {
    if (!currentWord) return

    setShowResult('skipped')
    setStreak(0)
    
    await wordService.updateWordStats(currentWord.id, 'seen')
    toast('Word skipped', { icon: '⏭️' })
  }

  const handleNext = () => {
    setUserInput('')
    setShowResult(null)
    loadNextWord()
  }

  const handleRepeat = () => {
    if (currentWord) {
      speakWord(currentWord.text)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice session...</p>
        </div>
      </div>
    )
  }

  if (practiceWords.length === 0) {
    return (
      <div className="text-center max-w-md mx-auto">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Words Available</h2>
          <p className="text-gray-600 mb-6">
            You need to add some words before you can practice. Upload a PDF file or add words manually.
          </p>
          <Link to="/upload" className="btn-primary">
            Upload Word List
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {showConfetti && <Confetti />}
      
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <Link 
          to="/" 
          className="btn-secondary flex items-center space-x-2"
          aria-label="Return to home page"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        
        <div className="flex items-center space-x-6 text-center">
          <div>
            <p className="text-2xl font-bold text-primary-600">{streak}</p>
            <p className="text-sm text-gray-600">Streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{sessionStats.correct}</p>
            <p className="text-sm text-gray-600">Correct</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-600">{sessionStats.attempted}</p>
            <p className="text-sm text-gray-600">Total</p>
          </div>
        </div>
      </div>

      {/* Main practice card */}
      <div className="card text-center">
        {currentWord && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">
                Spell this word:
              </h1>
              
              {/* Audio controls */}
              <div className="flex justify-center space-x-4 mb-8">
                <button
                  onClick={handleRepeat}
                  disabled={isSpeaking}
                  className="btn-primary flex items-center space-x-2 text-lg px-8 py-4"
                  aria-label={`Play pronunciation of the word${isSpeaking ? ' (currently speaking)' : ''}`}
                >
                  <Volume2 className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <span>{isSpeaking ? 'Speaking...' : 'Play Word'}</span>
                </button>
                
                <button
                  onClick={handleRepeat}
                  disabled={isSpeaking}
                  className="btn-secondary flex items-center space-x-2"
                  aria-label="Repeat pronunciation"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="sr-only">Repeat</span>
                </button>
              </div>

              {/* Show word definition/example if available and result is shown */}
              {showResult && currentWord.metadata && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  {currentWord.metadata.definition && (
                    <p className="text-gray-700 mb-2">
                      <strong>Definition:</strong> {currentWord.metadata.definition}
                    </p>
                  )}
                  {currentWord.metadata.example && (
                    <p className="text-gray-700">
                      <strong>Example:</strong> {currentWord.metadata.example}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Input form */}
            {!showResult ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="spelling-input" className="sr-only">
                    Type the spelling of the word
                  </label>
                  <input
                    ref={inputRef}
                    id="spelling-input"
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="input-field text-center text-2xl"
                    placeholder="Type the spelling here..."
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                
                <div className="flex justify-center space-x-4">
                  <button
                    type="submit"
                    disabled={!userInput.trim()}
                    className="btn-primary text-lg px-8 py-4"
                  >
                    Submit
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="btn-secondary flex items-center space-x-2"
                    aria-label="Skip this word"
                  >
                    <SkipForward className="w-5 h-5" />
                    <span>Skip</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Result display */
              <div className="space-y-6">
                <div className="flex items-center justify-center space-x-3">
                  {showResult === 'correct' ? (
                    <>
                      <CheckCircle className="w-12 h-12 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">Correct!</p>
                        <p className="text-gray-600">You spelled "{currentWord.text}" correctly</p>
                      </div>
                    </>
                  ) : showResult === 'incorrect' ? (
                    <>
                      <XCircle className="w-12 h-12 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">Incorrect</p>
                        <p className="text-gray-600">
                          You wrote: <span className="font-mono">{userInput}</span>
                        </p>
                        <p className="text-gray-600">
                          Correct spelling: <span className="font-mono font-bold">{currentWord.text}</span>
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <SkipForward className="w-12 h-12 text-gray-600" />
                      <div>
                        <p className="text-2xl font-bold text-gray-600">Skipped</p>
                        <p className="text-gray-600">
                          The word was: <span className="font-mono font-bold">{currentWord.text}</span>
                        </p>
                      </div>
                    </>
                  )}
                </div>
                
                <button
                  onClick={handleNext}
                  className="btn-primary text-lg px-8 py-4"
                  autoFocus
                >
                  Next Word
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Session progress */}
      {sessionStats.attempted > 0 && (
        <div className="card bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Progress</h3>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Accuracy: {Math.round((sessionStats.correct / sessionStats.attempted) * 100)}%</span>
            <span>Words practiced: {sessionStats.attempted}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${(sessionStats.correct / sessionStats.attempted) * 100}%` 
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
}
