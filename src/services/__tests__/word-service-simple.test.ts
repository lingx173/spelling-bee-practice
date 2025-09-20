import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WordService } from '../word-service'

// Mock Dexie
const mockTable = {
  add: vi.fn(),
  get: vi.fn(),
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  first: vi.fn(),
  orderBy: vi.fn().mockReturnThis(),
  toArray: vi.fn(),
  filter: vi.fn().mockReturnThis(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkDelete: vi.fn(),
  count: vi.fn()
}

vi.mock('../../lib/database', () => ({
  db: {
    words: mockTable,
    settings: mockTable,
    sessions: mockTable
  }
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}))

describe('WordService - Simple Tests', () => {
  let wordService: WordService

  beforeEach(() => {
    wordService = new WordService()
    vi.clearAllMocks()
  })

  describe('addWords', () => {
    it('should add new words successfully', async () => {
      const words = ['hello', 'world', 'test']
      const sourceList = 'test-list'
      
      mockTable.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null) // No existing words
        })
      })
      mockTable.add.mockResolvedValue(undefined)

      const result = await wordService.addWords(words, sourceList)

      expect(result).toHaveLength(3)
      expect(result[0]).toMatchObject({
        text: 'hello',
        key: 'hello',
        sourceList: 'test-list',
        stats: {
          seen: 0,
          correct: 0,
          wrong: 0,
          easiness: 2.5,
          interval: 1
        }
      })
      expect(mockTable.add).toHaveBeenCalledTimes(3)
    })

    it('should skip empty or invalid words', async () => {
      const words = ['hello', '', 'a', 'world']
      
      mockTable.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      })
      mockTable.add.mockResolvedValue(undefined)

      const result = await wordService.addWords(words)

      expect(result).toHaveLength(2) // Only 'hello' and 'world'
      expect(result.map(w => w.text)).toEqual(['hello', 'world'])
    })
  })

  describe('getAllWords', () => {
    it('should return all words ordered by text', async () => {
      const mockWords = [
        { id: '1', text: 'apple', key: 'apple' },
        { id: '2', text: 'banana', key: 'banana' }
      ]
      
      mockTable.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.getAllWords()

      expect(result).toEqual(mockWords)
      expect(mockTable.orderBy).toHaveBeenCalledWith('text')
    })
  })

  describe('updateWordStats', () => {
    it('should update stats for correct answer', async () => {
      const wordId = 'test-id'
      const existingWord = {
        id: wordId,
        stats: {
          seen: 5,
          correct: 3,
          wrong: 2,
          easiness: 2.5,
          interval: 1
        }
      }
      
      mockTable.get.mockResolvedValue(existingWord)
      mockTable.update.mockResolvedValue(undefined)

      await wordService.updateWordStats(wordId, 'correct')

      expect(mockTable.update).toHaveBeenCalledWith(wordId, {
        stats: expect.objectContaining({
          seen: 6,
          correct: 4,
          wrong: 2,
          easiness: 2.6, // Increased
          interval: 3, // Increased
          lastSeen: expect.any(String),
          nextDue: expect.any(String)
        }),
        updatedAt: expect.any(String)
      })
    })

    it('should handle word not found', async () => {
      const wordId = 'non-existent'
      
      mockTable.get.mockResolvedValue(null)

      await wordService.updateWordStats(wordId, 'correct')

      expect(mockTable.update).not.toHaveBeenCalled()
    })
  })

  describe('getRandomWord', () => {
    it('should return random word excluding specified IDs', async () => {
      const excludeIds = ['id1', 'id2']
      const mockWords = [
        { id: 'id3', text: 'word1' },
        { id: 'id4', text: 'word2' }
      ]
      
      mockTable.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.getRandomWord(excludeIds)

      expect(result).toBeDefined()
      expect(mockWords).toContain(result)
      expect(mockTable.filter).toHaveBeenCalled()
    })

    it('should return null when no words available', async () => {
      mockTable.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      })

      const result = await wordService.getRandomWord()

      expect(result).toBeNull()
    })
  })
})
