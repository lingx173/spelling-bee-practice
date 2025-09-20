import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { PDFParsingService } from '../pdf-parser'
import { PDFParseResult } from '../../types'

// Mock PDF.js
const mockPDFDocument = {
  numPages: 2,
  getPage: vi.fn()
}

const mockPage = {
  getTextContent: vi.fn()
}

const mockTextContent = {
  items: [
    { str: 'Hello', transform: [1, 0, 0, 1, 0, 100] },
    { str: 'world', transform: [1, 0, 0, 1, 50, 100] },
    { str: 'this', transform: [1, 0, 0, 1, 0, 80] },
    { str: 'is', transform: [1, 0, 0, 1, 30, 80] },
    { str: 'a', transform: [1, 0, 0, 1, 50, 80] },
    { str: 'test', transform: [1, 0, 0, 1, 60, 80] }
  ]
}

// Mock pdfjsLib
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  version: '3.0.0',
  getDocument: vi.fn().mockResolvedValue(mockPDFDocument)
}))

// Mock File API
const createMockFile = (name: string, content: string): File => {
  const blob = new Blob([content], { type: 'application/pdf' })
  return new File([blob], name, { type: 'application/pdf' })
}

describe('PDFParsingService', () => {
  let pdfService: PDFParsingService

  beforeEach(() => {
    vi.clearAllMocks()
    pdfService = new PDFParsingService()
    
    // Setup default mocks
    mockPDFDocument.getPage.mockResolvedValue(mockPage)
    mockPage.getTextContent.mockResolvedValue(mockTextContent)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('parseFile', () => {
    it('should parse PDF file and extract words', async () => {
      const file = createMockFile('test.pdf', 'PDF content')
      
      const result = await pdfService.parseFile(file)

      expect(result).toMatchObject({
        words: expect.any(Array),
        metadata: {
          filename: 'test.pdf',
          pageCount: 2,
          extractedAt: expect.any(String)
        }
      })
      expect(result.words.length).toBeGreaterThan(0)
    })

    it('should handle multiple pages', async () => {
      const file = createMockFile('multi-page.pdf', 'PDF content')
      
      // Mock second page
      const secondPageTextContent = {
        items: [
          { str: 'Page', transform: [1, 0, 0, 1, 0, 100] },
          { str: 'two', transform: [1, 0, 0, 1, 30, 100] },
          { str: 'content', transform: [1, 0, 0, 1, 60, 100] }
        ]
      }
      
      mockPage.getTextContent
        .mockResolvedValueOnce(mockTextContent)
        .mockResolvedValueOnce(secondPageTextContent)

      const result = await pdfService.parseFile(file)

      expect(mockPDFDocument.getPage).toHaveBeenCalledTimes(2)
      expect(result.words).toContain('hello')
      expect(result.words).toContain('world')
      expect(result.words).toContain('page')
      expect(result.words).toContain('two')
      expect(result.words).toContain('content')
    })

    it('should handle parsing errors', async () => {
      const file = createMockFile('error.pdf', 'Invalid PDF')
      
      // Mock PDF parsing error
      const { getDocument } = await import('pdfjs-dist')
      vi.mocked(getDocument).mockRejectedValueOnce(new Error('Invalid PDF'))

      await expect(pdfService.parseFile(file)).rejects.toThrow('Failed to parse PDF: Invalid PDF')
    })

    it('should handle file reading errors', async () => {
      const file = createMockFile('error.pdf', 'Invalid PDF')
      
      // Mock file reading error
      vi.spyOn(file, 'arrayBuffer').mockRejectedValueOnce(new Error('File read error'))

      await expect(pdfService.parseFile(file)).rejects.toThrow('Failed to parse PDF: File read error')
    })
  })

  describe('extractWordsFromText', () => {
    it('should extract words from text content', () => {
      const text = 'Hello world! This is a test document.'
      const words = (pdfService as any).extractWordsFromText(text)
      
      expect(words).toContain('Hello')
      expect(words).toContain('world')
      expect(words).toContain('This')
      expect(words).toContain('test')
      expect(words).toContain('document')
    })

    it('should filter out noise lines', () => {
      const text = `Page 1
Chapter 1
Hello world
Copyright 2023
This is content`
      
      const words = (pdfService as any).extractWordsFromText(text)
      
      expect(words).toContain('Hello')
      expect(words).toContain('world')
      expect(words).toContain('This')
      expect(words).toContain('content')
      expect(words).not.toContain('Page')
      expect(words).not.toContain('Chapter')
      expect(words).not.toContain('Copyright')
    })

    it('should handle empty text', () => {
      const words = (pdfService as any).extractWordsFromText('')
      expect(words).toEqual([])
    })
  })

  describe('cleanAndDeduplicateWords', () => {
    it('should clean and deduplicate words', () => {
      const words = ['Hello', 'hello', 'WORLD', 'world!', 'test', 'test']
      const cleaned = (pdfService as any).cleanAndDeduplicateWords(words)
      
      expect(cleaned).toEqual(['hello', 'test', 'world'])
      expect(cleaned.length).toBe(3)
    })

    it('should sort words alphabetically', () => {
      const words = ['zebra', 'apple', 'banana']
      const cleaned = (pdfService as any).cleanAndDeduplicateWords(words)
      
      expect(cleaned).toEqual(['apple', 'banana', 'zebra'])
    })
  })

  describe('cleanWord', () => {
    it('should clean word by removing non-letters and converting to lowercase', () => {
      const cleanWord = (pdfService as any).cleanWord
      
      expect(cleanWord('Hello!')).toBe('hello')
      expect(cleanWord('WORLD.')).toBe('world')
      expect(cleanWord('test-123')).toBe('test')
      expect(cleanWord('word\'s')).toBe('word\'s')
    })
  })

  describe('isValidWord', () => {
    it('should validate word length', () => {
      const isValidWord = (pdfService as any).isValidWord
      
      expect(isValidWord('a')).toBe(false) // Too short
      expect(isValidWord('hello')).toBe(true) // Valid length
      expect(isValidWord('a'.repeat(31))).toBe(false) // Too long
    })

    it('should validate word characters', () => {
      const isValidWord = (pdfService as any).isValidWord
      
      expect(isValidWord('hello')).toBe(true)
      expect(isValidWord('test-word')).toBe(true)
      expect(isValidWord('don\'t')).toBe(true)
      expect(isValidWord('test123')).toBe(false) // Contains numbers
      expect(isValidWord('test@word')).toBe(false) // Contains special chars
    })

    it('should filter out noise words', () => {
      const isValidWord = (pdfService as any).isValidWord
      
      expect(isValidWord('www')).toBe(false)
      expect(isValidWord('http')).toBe(false)
      expect(isValidWord('com')).toBe(false)
      expect(isValidWord('hello')).toBe(true)
    })

    it('should filter out words with repeated characters', () => {
      const isValidWord = (pdfService as any).isValidWord
      
      expect(isValidWord('hello')).toBe(true)
      expect(isValidWord('aaaa')).toBe(false) // Too many repeated 'a's
      expect(isValidWord('test')).toBe(true)
    })
  })

  describe('isNoiseLine', () => {
    it('should identify noise lines', () => {
      const isNoiseLine = (pdfService as any).isNoiseLine
      
      expect(isNoiseLine('Page 1')).toBe(true)
      expect(isNoiseLine('Chapter 1')).toBe(true)
      expect(isNoiseLine('Copyright 2023')).toBe(true)
      expect(isNoiseLine('12/25/2023')).toBe(true)
      expect(isNoiseLine('Hello world')).toBe(false)
      expect(isNoiseLine('a')).toBe(true) // Too short
      expect(isNoiseLine('')).toBe(true) // Empty
    })
  })

  describe('groupTextItemsByLine', () => {
    it('should group text items by Y coordinate', () => {
      const items = [
        { str: 'Hello', transform: [1, 0, 0, 1, 0, 100] },
        { str: 'world', transform: [1, 0, 0, 1, 50, 100] },
        { str: 'Line', transform: [1, 0, 0, 1, 0, 80] },
        { str: 'two', transform: [1, 0, 0, 1, 30, 80] }
      ]
      
      const lines = (pdfService as any).groupTextItemsByLine(items)
      
      expect(lines).toHaveLength(2)
      expect(lines[0]).toEqual(['Hello', 'world']) // Y=100
      expect(lines[1]).toEqual(['Line', 'two']) // Y=80
    })

    it('should handle empty items', () => {
      const items = [
        { str: '', transform: [1, 0, 0, 1, 0, 100] },
        { str: '   ', transform: [1, 0, 0, 1, 0, 80] },
        { str: 'Hello', transform: [1, 0, 0, 1, 0, 60] }
      ]
      
      const lines = (pdfService as any).groupTextItemsByLine(items)
      
      expect(lines).toHaveLength(1)
      expect(lines[0]).toEqual(['Hello'])
    })
  })

  describe('detectColumns', () => {
    it('should detect columnar layout', async () => {
      const text = `Word1    Word2    Word3
Another    Column    Layout
More    Text    Here`
      
      const hasColumns = await pdfService.detectColumns(text)
      expect(hasColumns).toBe(true)
    })

    it('should not detect columns in normal text', async () => {
      const text = `This is a normal paragraph
with regular spacing between words
and no columnar layout.`
      
      const hasColumns = await pdfService.detectColumns(text)
      expect(hasColumns).toBe(false)
    })

    it('should handle empty text', async () => {
      const hasColumns = await pdfService.detectColumns('')
      expect(hasColumns).toBe(false)
    })
  })
})
