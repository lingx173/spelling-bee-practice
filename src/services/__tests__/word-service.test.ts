import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { WordService } from '../word-service'
import { db } from '../../lib/database'
import { Word } from '../../types'

// Mock Dexie
vi.mock('../../lib/database', () => ({
  db: {
    words: {
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
  }
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-123')
}))

describe('WordService', () => {
  let wordService: WordService
  let mockDb: any

  beforeEach(() => {
    wordService = new WordService()
    mockDb = db as any
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('addWords', () => {
    it('should add new words successfully', async () => {
      const words = ['hello', 'world', 'test']
      const sourceList = 'test-list'
      
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null) // No existing words
        })
      })
      mockDb.words.add.mockResolvedValue(undefined)

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
      expect(mockDb.words.add).toHaveBeenCalledTimes(3)
    })

    it('should skip empty or invalid words', async () => {
      const words = ['hello', '', 'a', 'world']
      
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null)
        })
      })
      mockDb.words.add.mockResolvedValue(undefined)

      const result = await wordService.addWords(words)

      expect(result).toHaveLength(2) // Only 'hello' and 'world'
      expect(result.map(w => w.text)).toEqual(['hello', 'world'])
    })

    it('should not add duplicate words', async () => {
      const words = ['hello', 'world']
      
      // Mock existing word
      const existingWord = { id: 'existing-id', text: 'hello', key: 'hello' }
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn()
            .mockResolvedValueOnce(existingWord) // 'hello' exists
            .mockResolvedValueOnce(null) // 'world' doesn't exist
        })
      })
      mockDb.words.add.mockResolvedValue(undefined)

      const result = await wordService.addWords(words)

      expect(result).toHaveLength(1)
      expect(result[0].text).toBe('world')
      expect(mockDb.words.add).toHaveBeenCalledTimes(1)
    })

    it('should update source list for existing words', async () => {
      const words = ['hello']
      const sourceList = 'new-source'
      
      const existingWord = { 
        id: 'existing-id', 
        text: 'hello', 
        key: 'hello',
        sourceList: 'old-source'
      }
      
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(existingWord)
        })
      })
      mockDb.words.update.mockResolvedValue(undefined)

      const result = await wordService.addWords(words, sourceList)

      expect(result).toHaveLength(0) // No new words added
      expect(mockDb.words.update).toHaveBeenCalledWith('existing-id', {
        sourceList: 'new-source',
        updatedAt: expect.any(String)
      })
    })
  })

  describe('getAllWords', () => {
    it('should return all words ordered by text', async () => {
      const mockWords = [
        { id: '1', text: 'apple', key: 'apple' },
        { id: '2', text: 'banana', key: 'banana' }
      ]
      
      mockDb.words.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.getAllWords()

      expect(result).toEqual(mockWords)
      expect(mockDb.words.orderBy).toHaveBeenCalledWith('text')
    })
  })

  describe('getWordsBySource', () => {
    it('should return words filtered by source list', async () => {
      const sourceList = 'test-source'
      const mockWords = [
        { id: '1', text: 'apple', sourceList: 'test-source' }
      ]
      
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          toArray: vi.fn().mockResolvedValue(mockWords)
        })
      })

      const result = await wordService.getWordsBySource(sourceList)

      expect(result).toEqual(mockWords)
      expect(mockDb.words.where).toHaveBeenCalledWith('sourceList')
    })
  })

  describe('searchWords', () => {
    it('should search words by text, source, or tags', async () => {
      const query = 'test'
      const mockWords = [
        { id: '1', text: 'testing', key: 'testing' },
        { id: '2', text: 'word', sourceList: 'test-list' }
      ]
      
      mockDb.words.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.searchWords(query)

      expect(result).toEqual(mockWords)
      expect(mockDb.words.filter).toHaveBeenCalled()
    })
  })

  describe('updateWord', () => {
    it('should update word with new data', async () => {
      const wordId = 'test-id'
      const updates = { text: 'updated', metadata: { definition: 'test' } }
      
      mockDb.words.update.mockResolvedValue(undefined)

      await wordService.updateWord(wordId, updates)

      expect(mockDb.words.update).toHaveBeenCalledWith(wordId, {
        ...updates,
        key: 'updated', // Should update key when text changes
        updatedAt: expect.any(String)
      })
    })
  })

  describe('deleteWord', () => {
    it('should delete word by id', async () => {
      const wordId = 'test-id'
      
      mockDb.words.delete.mockResolvedValue(undefined)

      await wordService.deleteWord(wordId)

      expect(mockDb.words.delete).toHaveBeenCalledWith(wordId)
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
      
      mockDb.words.get.mockResolvedValue(existingWord)
      mockDb.words.update.mockResolvedValue(undefined)

      await wordService.updateWordStats(wordId, 'correct')

      expect(mockDb.words.update).toHaveBeenCalledWith(wordId, {
        stats: {
          seen: 6,
          correct: 4,
          wrong: 2,
          easiness: 2.6, // Increased
          interval: 3, // Increased
          lastSeen: expect.any(String),
          nextDue: expect.any(String)
        }
      })
    })

    it('should update stats for incorrect answer', async () => {
      const wordId = 'test-id'
      const existingWord = {
        id: wordId,
        stats: {
          seen: 5,
          correct: 3,
          wrong: 2,
          easiness: 2.5,
          interval: 3
        }
      }
      
      mockDb.words.get.mockResolvedValue(existingWord)
      mockDb.words.update.mockResolvedValue(undefined)

      await wordService.updateWordStats(wordId, 'incorrect')

      expect(mockDb.words.update).toHaveBeenCalledWith(wordId, {
        stats: {
          seen: 6,
          correct: 3,
          wrong: 3,
          easiness: 2.3, // Decreased
          interval: 1, // Reset
          lastSeen: expect.any(String),
          nextDue: expect.any(String)
        }
      })
    })

    it('should handle word not found', async () => {
      const wordId = 'non-existent'
      
      mockDb.words.get.mockResolvedValue(null)

      await wordService.updateWordStats(wordId, 'correct')

      expect(mockDb.words.update).not.toHaveBeenCalled()
    })
  })

  describe('getRandomWord', () => {
    it('should return random word excluding specified IDs', async () => {
      const excludeIds = ['id1', 'id2']
      const mockWords = [
        { id: 'id3', text: 'word1' },
        { id: 'id4', text: 'word2' }
      ]
      
      mockDb.words.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.getRandomWord(excludeIds)

      expect(result).toBeDefined()
      expect(mockWords).toContain(result)
      expect(mockDb.words.filter).toHaveBeenCalled()
    })

    it('should return null when no words available', async () => {
      mockDb.words.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      })

      const result = await wordService.getRandomWord()

      expect(result).toBeNull()
    })
  })

  describe('getWordsDueForReview', () => {
    it('should return words due for review', async () => {
      const mockWords = [
        { id: '1', text: 'word1', stats: { nextDue: '2023-01-01T00:00:00Z' } },
        { id: '2', text: 'word2', stats: { nextDue: '2025-01-01T00:00:00Z' } }
      ]
      
      mockDb.words.filter.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.getWordsDueForReview()

      expect(result).toEqual(mockWords)
      expect(mockDb.words.filter).toHaveBeenCalled()
    })
  })

  describe('exportWords', () => {
    it('should export all words with metadata', async () => {
      const mockWords = [
        { id: '1', text: 'word1', key: 'word1' },
        { id: '2', text: 'word2', key: 'word2' }
      ]
      
      mockDb.words.orderBy.mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockWords)
      })

      const result = await wordService.exportWords()

      expect(result).toEqual({
        words: mockWords,
        metadata: {
          exportedAt: expect.any(String),
          version: '1.0.0',
          source: 'Spelling Bee PWA'
        }
      })
    })
  })

  describe('importWords', () => {
    it('should import new words', async () => {
      const importData = {
        words: [
          { id: '1', text: 'word1', key: 'word1' },
          { id: '2', text: 'word2', key: 'word2' }
        ],
        metadata: { exportedAt: '2023-01-01T00:00:00Z', version: '1.0.0', source: 'test' }
      }
      
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null) // No existing words
        })
      })
      mockDb.words.add.mockResolvedValue(undefined)

      const result = await wordService.importWords(importData)

      expect(result).toEqual({
        imported: 2,
        skipped: 0,
        updated: 0
      })
    })

    it('should skip older words and update newer ones', async () => {
      const importData = {
        words: [
          { 
            id: '1', 
            text: 'word1', 
            key: 'word1',
            addedAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-02T00:00:00Z'
          }
        ],
        metadata: { exportedAt: '2023-01-01T00:00:00Z', version: '1.0.0', source: 'test' }
      }
      
      const existingWord = {
        id: '1',
        text: 'word1',
        key: 'word1',
        addedAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-03T00:00:00Z' // Newer than import
      }
      
      mockDb.words.where.mockReturnValue({
        equals: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(existingWord)
        })
      })
      mockDb.words.update.mockResolvedValue(undefined)

      const result = await wordService.importWords(importData)

      expect(result).toEqual({
        imported: 0,
        skipped: 1,
        updated: 0
      })
    })
  })

  describe('getWordCount', () => {
    it('should return total word count', async () => {
      mockDb.words.count.mockResolvedValue(42)

      const result = await wordService.getWordCount()

      expect(result).toBe(42)
      expect(mockDb.words.count).toHaveBeenCalled()
    })
  })

  describe('getSourceLists', () => {
    it('should return unique source lists', async () => {
      const mockWords = [
        { sourceList: 'source1' },
        { sourceList: 'source2' },
        { sourceList: 'source1' }, // Duplicate
        { sourceList: null }, // Should be ignored
        { sourceList: 'source3' }
      ]
      
      mockDb.words.toArray.mockResolvedValue(mockWords)

      const result = await wordService.getSourceLists()

      expect(result).toEqual(['source1', 'source2', 'source3'])
    })
  })
})
