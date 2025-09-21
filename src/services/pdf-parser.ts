import * as pdfjsLib from 'pdfjs-dist'
import { PDFParseResult } from '../types'

// Disable PDF.js worker to avoid loading issues
// This will use the main thread for PDF processing (slower but more reliable)
pdfjsLib.GlobalWorkerOptions.workerSrc = ''

export class PDFParsingService {
  private readonly WORD_REGEX = /[A-Za-z][A-Za-z\-']{1,29}/g
  private readonly MIN_WORD_LENGTH = 2
  private readonly MAX_WORD_LENGTH = 30
  
  // Common header/footer patterns to filter out
  private readonly NOISE_PATTERNS = [
    /^page\s+\d+$/i,
    /^\d+$/,
    /^\d+\s*of\s*\d+$/i,
    /^chapter\s+\d+/i,
    /^section\s+\d+/i,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
    /^\w{3}\s+\d{1,2},?\s+\d{4}$/i, // dates
    /^copyright/i,
    /^all\s+rights\s+reserved/i,
    /^table\s+of\s+contents/i,
  ]

  public async parseFile(file: File): Promise<PDFParseResult> {
    try {
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or corrupted')
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File too large: Please upload a PDF smaller than 50MB')
      }

      console.log('Starting PDF parsing for file:', file.name, 'Size:', file.size)
      
      const arrayBuffer = await file.arrayBuffer()
      console.log('File converted to array buffer, size:', arrayBuffer.byteLength)
      
      // Add timeout to prevent hanging
      const pdfPromise = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0, // Reduce console output
        useWorkerFetch: false, // Disable worker fetch
        isEvalSupported: false, // Disable eval for security
        useSystemFonts: false, // Disable system fonts
        disableFontFace: false // Allow font loading
      }).promise

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('PDF processing timeout')), 30000) // 30 second timeout
      })

      const pdf = await Promise.race([pdfPromise, timeoutPromise]) as pdfjsLib.PDFDocumentProxy
      
      console.log('PDF loaded successfully, pages:', pdf.numPages)
      
      const textContent = await this.extractTextFromPDF(pdf)
      console.log('Text extracted, length:', textContent.length)
      
      const words = this.extractWordsFromText(textContent)
      console.log('Words extracted:', words.length)
      
      const cleanedWords = this.cleanAndDeduplicateWords(words)
      console.log('Words after cleaning:', cleanedWords.length)
      
      if (cleanedWords.length === 0) {
        throw new Error('No valid words found in PDF. The PDF might be image-based or contain no readable text.')
      }
      
      return {
        words: cleanedWords,
        metadata: {
          filename: file.name,
          pageCount: pdf.numPages,
          extractedAt: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('PDF parsing error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid PDF')) {
          throw new Error('Invalid PDF file. Please ensure the file is a valid PDF document.')
        } else if (error.message.includes('password')) {
          throw new Error('Password-protected PDF. Please remove password protection and try again.')
        } else if (error.message.includes('corrupted')) {
          throw new Error('Corrupted PDF file. Please try a different file.')
        } else if (error.message.includes('worker') || error.message.includes('fetch')) {
          throw new Error('PDF processing service unavailable. Please try again in a moment.')
        } else {
          throw new Error(`Failed to parse PDF: ${error.message}`)
        }
      } else {
        throw new Error('Failed to parse PDF: Unknown error occurred')
      }
    }
  }

  private async extractTextFromPDF(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
    const textParts: string[] = []
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      // Group text items by line (based on Y coordinate)
      const lines = this.groupTextItemsByLine(textContent.items)
      
      // Join lines with proper spacing
      const pageText = lines
        .map(line => line.join(' '))
        .filter(line => line.trim().length > 0)
        .join('\n')
      
      textParts.push(pageText)
    }
    
    return textParts.join('\n\n')
  }

  private groupTextItemsByLine(items: any[]): string[][] {
    const lines: { [y: number]: string[] } = {}
    
    items.forEach(item => {
      if (item.str && item.str.trim()) {
        const y = Math.round(item.transform[5]) // Y coordinate
        if (!lines[y]) {
          lines[y] = []
        }
        lines[y].push(item.str.trim())
      }
    })
    
    // Sort by Y coordinate (top to bottom)
    const sortedY = Object.keys(lines)
      .map(y => parseInt(y))
      .sort((a, b) => b - a) // Descending order (PDF coordinates)
    
    return sortedY.map(y => lines[y])
  }

  private extractWordsFromText(text: string): string[] {
    const words: string[] = []
    const lines = text.split('\n')
    
    for (const line of lines) {
      // Skip if line looks like noise
      if (this.isNoiseLine(line)) {
        continue
      }
      
      // Extract words using regex
      const matches = line.match(this.WORD_REGEX)
      if (matches) {
        words.push(...matches)
      }
    }
    
    return words
  }

  private isNoiseLine(line: string): boolean {
    const trimmed = line.trim()
    
    // Empty or very short lines
    if (trimmed.length < 2) {
      return true
    }
    
    // Check against noise patterns
    return this.NOISE_PATTERNS.some(pattern => pattern.test(trimmed))
  }

  private cleanAndDeduplicateWords(words: string[]): string[] {
    const cleanedWords = new Set<string>()
    
    for (const word of words) {
      const cleaned = this.cleanWord(word)
      
      if (this.isValidWord(cleaned)) {
        cleanedWords.add(cleaned)
      }
    }
    
    // Convert to array and sort
    return Array.from(cleanedWords).sort((a, b) => a.localeCompare(b))
  }

  private cleanWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/^[^a-z]+|[^a-z]+$/g, '') // Remove leading/trailing non-letters
      .trim()
  }

  private isValidWord(word: string): boolean {
    // Length check
    if (word.length < this.MIN_WORD_LENGTH || word.length > this.MAX_WORD_LENGTH) {
      return false
    }
    
    // Must contain only letters, hyphens, and apostrophes
    if (!/^[a-z\-']+$/.test(word)) {
      return false
    }
    
    // Avoid words that are likely noise
    const noiseWords = [
      'www', 'http', 'https', 'com', 'org', 'net', 'edu',
      'pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif'
    ]
    
    if (noiseWords.includes(word)) {
      return false
    }
    
    // Avoid words with too many repeated characters
    if (/([a-z])\1{3,}/.test(word)) {
      return false
    }
    
    return true
  }

  public async detectColumns(text: string): Promise<boolean> {
    // Simple heuristic: if we find consistent large gaps in text,
    // it might be columnar layout
    const lines = text.split('\n')
    let gapCount = 0
    
    for (const line of lines) {
      // Look for multiple large gaps (3+ spaces)
      const gaps = line.match(/\s{3,}/g)
      if (gaps && gaps.length >= 1) {
        gapCount++
      }
    }
    
    // If more than 20% of lines have large gaps, assume columns
    return gapCount > lines.length * 0.2
  }
}

export const pdfParsingService = new PDFParsingService()
