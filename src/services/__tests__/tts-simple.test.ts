import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock SpeechSynthesis and related APIs
const mockUtterance = {
  text: '',
  voice: null,
  rate: 1,
  pitch: 1,
  volume: 1,
  lang: 'en-US',
  onend: null as (() => void) | null,
  onerror: null as ((event: any) => void) | null
}

const mockSpeechSynthesis = {
  speak: vi.fn(),
  cancel: vi.fn(),
  getVoices: vi.fn(() => []),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

const mockVoices = [
  {
    name: 'Google US English',
    lang: 'en-US',
    default: true
  },
  {
    name: 'Microsoft David Desktop - English (United States)',
    lang: 'en-US',
    default: false
  },
  {
    name: 'Google UK English',
    lang: 'en-GB',
    default: false
  }
]

// Mock global objects
Object.defineProperty(global, 'window', {
  value: {
    speechSynthesis: mockSpeechSynthesis,
    SpeechSynthesisUtterance: vi.fn().mockImplementation((text) => {
      mockUtterance.text = text
      return mockUtterance
    })
  },
  writable: true
})

// Import after mocking
import { ttsService } from '../tts'

describe('TTSService - Simple Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices)
  })

  describe('initialization', () => {
    it('should initialize with speech synthesis support', () => {
      expect(ttsService).toBeDefined()
    })
  })

  describe('getAvailableVoices', () => {
    it('should return English voices only', () => {
      const voices = ttsService.getAvailableVoices()
      
      expect(voices).toHaveLength(2) // Only en-US and en-GB voices
      expect(voices.every(voice => voice.lang.toLowerCase().startsWith('en'))).toBe(true)
    })
  })

  describe('setPreferredVoice', () => {
    it('should set preferred voice by name', () => {
      ttsService.setPreferredVoice('Google US English')
      
      expect(ttsService.currentVoice?.name).toBe('Google US English')
    })

    it('should not set voice if name not found', () => {
      const originalVoice = ttsService.currentVoice
      ttsService.setPreferredVoice('Non-existent Voice')
      
      expect(ttsService.currentVoice).toBe(originalVoice)
    })
  })

  describe('speak', () => {
    it('should speak text with default options', async () => {
      const text = 'Hello world'
      
      // Mock successful speech
      setTimeout(() => {
        if (mockUtterance.onend) {
          mockUtterance.onend()
        }
      }, 0)

      await ttsService.speak(text)

      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
      expect(mockSpeechSynthesis.speak).toHaveBeenCalledWith(mockUtterance)
      expect(mockUtterance.text).toBe(text)
      expect(mockUtterance.rate).toBe(0.9)
      expect(mockUtterance.pitch).toBe(1.0)
      expect(mockUtterance.volume).toBe(1.0)
      expect(mockUtterance.lang).toBe('en-US')
    })

    it('should speak text with custom options', async () => {
      const text = 'Hello world'
      const options = {
        rate: 1.2,
        pitch: 0.8,
        volume: 0.5,
        lang: 'en-GB'
      }
      
      setTimeout(() => {
        if (mockUtterance.onend) {
          mockUtterance.onend()
        }
      }, 0)

      await ttsService.speak(text, options)

      expect(mockUtterance.rate).toBe(1.2)
      expect(mockUtterance.pitch).toBe(0.8)
      expect(mockUtterance.volume).toBe(0.5)
      expect(mockUtterance.lang).toBe('en-GB')
    })

    it('should reject on speech error', async () => {
      const text = 'Hello world'
      const errorEvent = { error: 'synthesis-failed' }
      
      setTimeout(() => {
        if (mockUtterance.onerror) {
          mockUtterance.onerror(errorEvent)
        }
      }, 0)

      await expect(ttsService.speak(text)).rejects.toThrow('Speech synthesis error: synthesis-failed')
    })
  })

  describe('stop', () => {
    it('should cancel ongoing speech', () => {
      ttsService.stop()
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled()
    })
  })

  describe('isAvailable', () => {
    it('should return true when TTS is supported and voices are available', () => {
      expect(ttsService.isAvailable).toBe(true)
    })

    it('should return false when no voices are available', () => {
      mockSpeechSynthesis.getVoices.mockReturnValue([])
      
      // Create a new instance to test with no voices
      const { ttsService: newTtsService } = require('../tts')
      expect(newTtsService.isAvailable).toBe(false)
    })
  })
})
