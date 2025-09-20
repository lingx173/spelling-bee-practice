import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Practice } from '../Practice'
import { wordService } from '../../../services/word-service'
import { ttsService } from '../../../services/tts'
import { Word } from '../../../types'

// Mock the services
vi.mock('../../../services/word-service', () => ({
  wordService: {
    getAllWords: vi.fn(),
    getRandomWord: vi.fn(),
    updateWordStats: vi.fn()
  }
}))

vi.mock('../../../services/tts', () => ({
  ttsService: {
    isAvailable: true,
    speak: vi.fn()
  }
}))

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock Confetti component
vi.mock('../../ui/Confetti', () => ({
  Confetti: () => <div data-testid="confetti">Confetti</div>
}))

const mockWords: Word[] = [
  {
    id: '1',
    text: 'beautiful',
    key: 'beautiful',
    sourceList: 'test',
    metadata: {
      definition: 'pleasing the senses or mind aesthetically',
      example: 'She has a beautiful smile.'
    },
    stats: {
      seen: 0,
      correct: 0,
      wrong: 0,
      easiness: 2.5,
      interval: 1
    },
    addedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: '2',
    text: 'definitely',
    key: 'definitely',
    sourceList: 'test',
    metadata: {
      definition: 'without doubt; certainly',
      example: 'I will definitely be there.'
    },
    stats: {
      seen: 0,
      correct: 0,
      wrong: 0,
      easiness: 2.5,
      interval: 1
    },
    addedAt: '2023-01-01T00:00:00Z'
  }
]

const renderPractice = () => {
  return render(
    <MemoryRouter>
      <Practice />
    </MemoryRouter>
  )
}

describe('Practice Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(wordService.getAllWords).mockResolvedValue(mockWords)
    vi.mocked(wordService.getRandomWord).mockResolvedValue(mockWords[0])
    vi.mocked(wordService.updateWordStats).mockResolvedValue()
    vi.mocked(ttsService.speak).mockResolvedValue()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading spinner initially', () => {
      vi.mocked(wordService.getAllWords).mockImplementation(() => new Promise(() => {})) // Never resolves
      
      renderPractice()
      
      expect(screen.getByText('Loading practice session...')).toBeInTheDocument()
    })
  })

  describe('No Words State', () => {
    it('should show no words message when no words available', async () => {
      vi.mocked(wordService.getAllWords).mockResolvedValue([])
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('No Words Available')).toBeInTheDocument()
        expect(screen.getByText('You need to add some words before you can practice. Upload a PDF file or add words manually.')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /upload word list/i })).toBeInTheDocument()
      })
    })
  })

  describe('Practice Session', () => {
    it('should display practice interface when words are available', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('Spell this word:')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /play word/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
        expect(screen.getByRole('textbox')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
      })
    })

    it('should show session statistics', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('Streak')).toBeInTheDocument()
        expect(screen.getByText('Correct')).toBeInTheDocument()
        expect(screen.getByText('Total')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument() // Initial values
      })
    })

    it('should automatically pronounce word on load', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(ttsService.speak).toHaveBeenCalledWith('beautiful')
      })
    })
  })

  describe('Word Input and Submission', () => {
    it('should handle correct spelling', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'beautiful')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument()
        expect(screen.getByText('You spelled "beautiful" correctly')).toBeInTheDocument()
        expect(wordService.updateWordStats).toHaveBeenCalledWith('1', 'correct')
      })
    })

    it('should handle incorrect spelling', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'beutiful')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect')).toBeInTheDocument()
        expect(screen.getByText('You wrote: beutiful')).toBeInTheDocument()
        expect(screen.getByText('Correct spelling: beautiful')).toBeInTheDocument()
        expect(wordService.updateWordStats).toHaveBeenCalledWith('1', 'incorrect')
      })
    })

    it('should handle case insensitive comparison', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'BEAUTIFUL')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument()
        expect(wordService.updateWordStats).toHaveBeenCalledWith('1', 'correct')
      })
    })

    it('should not submit empty input', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      expect(submitButton).toBeDisabled()
      
      await user.click(submitButton)
      
      // Should not show result
      expect(screen.queryByText('Correct!')).not.toBeInTheDocument()
      expect(screen.queryByText('Incorrect')).not.toBeInTheDocument()
    })

    it('should trim whitespace from input', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, '  beautiful  ')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument()
      })
    })
  })

  describe('Skip Functionality', () => {
    it('should handle word skip', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
      })
      
      const skipButton = screen.getByRole('button', { name: /skip/i })
      await user.click(skipButton)
      
      await waitFor(() => {
        expect(screen.getByText('Skipped')).toBeInTheDocument()
        expect(screen.getByText('The word was: beautiful')).toBeInTheDocument()
        expect(wordService.updateWordStats).toHaveBeenCalledWith('1', 'seen')
      })
    })
  })

  describe('Next Word Functionality', () => {
    it('should load next word after correct answer', async () => {
      const user = userEvent.setup()
      vi.mocked(wordService.getRandomWord).mockResolvedValueOnce(mockWords[0]).mockResolvedValueOnce(mockWords[1])
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      // Submit correct answer
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'beautiful')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Correct!')).toBeInTheDocument()
      })
      
      // Click next word
      const nextButton = screen.getByRole('button', { name: /next word/i })
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
        expect(screen.getByDisplayValue('')).toBeInTheDocument() // Input should be cleared
      })
    })

    it('should load next word after incorrect answer', async () => {
      const user = userEvent.setup()
      vi.mocked(wordService.getRandomWord).mockResolvedValueOnce(mockWords[0]).mockResolvedValueOnce(mockWords[1])
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      // Submit incorrect answer
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'wrong')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Incorrect')).toBeInTheDocument()
      })
      
      // Click next word
      const nextButton = screen.getByRole('button', { name: /next word/i })
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
    })

    it('should load next word after skip', async () => {
      const user = userEvent.setup()
      vi.mocked(wordService.getRandomWord).mockResolvedValueOnce(mockWords[0]).mockResolvedValueOnce(mockWords[1])
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
      })
      
      // Skip word
      const skipButton = screen.getByRole('button', { name: /skip/i })
      await user.click(skipButton)
      
      await waitFor(() => {
        expect(screen.getByText('Skipped')).toBeInTheDocument()
      })
      
      // Click next word
      const nextButton = screen.getByRole('button', { name: /next word/i })
      await user.click(nextButton)
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
    })
  })

  describe('Audio Controls', () => {
    it('should repeat word pronunciation', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play word/i })).toBeInTheDocument()
      })
      
      const playButton = screen.getByRole('button', { name: /play word/i })
      await user.click(playButton)
      
      expect(ttsService.speak).toHaveBeenCalledWith('beautiful')
    })

    it('should show speaking state', async () => {
      vi.mocked(ttsService.speak).mockImplementation(() => new Promise(() => {})) // Never resolves
      
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /play word/i })).toBeInTheDocument()
      })
      
      const playButton = screen.getByRole('button', { name: /play word/i })
      await user.click(playButton)
      
      await waitFor(() => {
        expect(screen.getByText('Speaking...')).toBeInTheDocument()
      })
    })
  })

  describe('Word Definition Display', () => {
    it('should show word definition after result', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'beautiful')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('Definition: pleasing the senses or mind aesthetically')).toBeInTheDocument()
        expect(screen.getByText('Example: She has a beautiful smile.')).toBeInTheDocument()
      })
    })
  })

  describe('Statistics Updates', () => {
    it('should update streak on correct answer', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'beautiful')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Streak should be 1
        expect(screen.getByText('1')).toBeInTheDocument() // Correct should be 1
        expect(screen.getByText('1')).toBeInTheDocument() // Total should be 1
      })
    })

    it('should reset streak on incorrect answer', async () => {
      const user = userEvent.setup()
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('textbox')).toBeInTheDocument()
      })
      
      const input = screen.getByRole('textbox')
      const submitButton = screen.getByRole('button', { name: /submit/i })
      
      await user.type(input, 'wrong')
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument() // Streak should be 0
        expect(screen.getByText('0')).toBeInTheDocument() // Correct should be 0
        expect(screen.getByText('1')).toBeInTheDocument() // Total should be 1
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle word loading error', async () => {
      vi.mocked(wordService.getAllWords).mockRejectedValue(new Error('Database error'))
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load words for practice')).toBeInTheDocument()
      })
    })

    it('should handle TTS error', async () => {
      vi.mocked(ttsService.speak).mockRejectedValue(new Error('TTS error'))
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('Failed to pronounce word')).toBeInTheDocument()
      })
    })

    it('should handle no more words available', async () => {
      vi.mocked(wordService.getRandomWord).mockResolvedValue(null)
      
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByText('No more words available!')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should have home navigation link', async () => {
      renderPractice()
      
      await waitFor(() => {
        expect(screen.getByRole('link', { name: /return to home page/i })).toBeInTheDocument()
      })
    })
  })
})
