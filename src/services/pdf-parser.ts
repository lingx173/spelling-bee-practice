import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker - disable worker to avoid CDN issues
pdfjsLib.GlobalWorkerOptions.workerSrc = null as any

export interface PDFParseResult {
  words: string[]
  metadata: {
    filename: string
    pageCount: number
    extractedAt: string
    note?: string
    method?: 'text-extraction' | 'ocr' | 'filename' | 'fallback'
  }
}

export class PDFParsingService {
  public async parseFile(file: File): Promise<PDFParseResult> {
    try {
      // Validate file
      if (!file || file.size === 0) {
        throw new Error('Invalid file: File is empty or corrupted')
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit for OCR processing
        throw new Error('File too large: Please upload a PDF smaller than 50MB')
      }

      console.log('Starting PDF parsing for file:', file.name, 'Size:', file.size)

      // Try OCR for scanned PDFs
      try {
        console.log('Attempting OCR for scanned PDF...')
        const ocrWords = await this.performOCR(file)
        if (ocrWords.length > 0) {
          console.log('OCR successful, found', ocrWords.length, 'words')
          return {
            words: ocrWords,
            metadata: {
              filename: file.name,
              pageCount: 1,
              extractedAt: new Date().toISOString(),
              note: 'Words extracted using OCR from scanned document',
              method: 'ocr'
            }
          }
        } else {
          console.log('OCR completed but found no words')
        }
      } catch (ocrError) {
        console.warn('OCR failed:', ocrError)
        // Don't throw here, continue to fallback methods
      }

      // Fallback: Extract words from filename
      const filenameWords = file.name
        .replace(/\.pdf$/i, '')
        .replace(/[^a-zA-Z\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length >= 2 && word.length <= 30)
        .map(word => word.toLowerCase())
        .filter(word => word.length > 0)

      if (filenameWords.length > 0) {
        console.log('Using filename-based word extraction')
        return {
          words: [...new Set(filenameWords)].sort(),
          metadata: {
            filename: file.name,
            pageCount: 1,
            extractedAt: new Date().toISOString(),
            note: 'Words extracted from filename (OCR failed)',
            method: 'filename'
          }
        }
      }

      // If no words from filename, return a default set
      const defaultWords = [
        'example', 'sample', 'document', 'text', 'content',
        'practice', 'learning', 'education', 'study', 'words'
      ]
      
      return {
        words: defaultWords,
        metadata: {
          filename: file.name,
          pageCount: 1,
          extractedAt: new Date().toISOString(),
          note: 'Default word list (OCR and filename extraction failed)',
          method: 'fallback'
        }
      }
    } catch (error) {
      console.error('PDF parsing error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid file')) {
          throw error // Re-throw specific validation errors
        } else {
          throw new Error(`Failed to parse PDF: ${error.message}`)
        }
      } else {
        throw new Error('Failed to parse PDF: Unknown error occurred')
      }
    }
  }

  private async performOCR(file: File): Promise<string[]> {
    console.log('Starting OCR processing for file:', file.name)
    
    let worker: any = null
    
    try {
      // Dynamically import Tesseract.js to reduce initial bundle size
      const { createWorker } = await import('tesseract.js')
      
      // Create a worker for OCR processing
      worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
          }
        }
      })

      // Convert PDF to image (first page only for now)
      const imageDataUrl = await this.convertPDFToImage(file)
      
      if (!imageDataUrl) {
        throw new Error('Failed to convert PDF to image')
      }

      // Perform OCR on the image
      const ocrResult = await worker.recognize(imageDataUrl)
      
      const text = ocrResult.data.text
      console.log('OCR extracted text length:', text.length)
      console.log('OCR extracted text sample:', text.substring(0, 1000))
      
      // Extract and clean words from OCR text
      const words = this.extractWordsFromText(text)
      const cleanedWords = this.cleanAndDeduplicateWords(words)
      
      console.log('OCR found', cleanedWords.length, 'unique words')
      console.log('Sample cleaned words:', cleanedWords.slice(0, 30))
      
      return cleanedWords
    } catch (error) {
      console.error('OCR processing failed:', error)
      throw error
    } finally {
      // Clean up the worker
      if (worker) {
        try {
          await worker.terminate()
        } catch (error) {
          console.warn('Error terminating OCR worker:', error)
        }
      }
    }
  }

  private async convertPDFToImage(file: File): Promise<string | null> {
    try {
      console.log('Converting PDF to image for OCR...')
      
      // Load the PDF using PDF.js
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: false,
        disableFontFace: false,
        disableAutoFetch: true,
        disableStream: true
      }).promise

      console.log('PDF loaded, pages:', pdf.numPages)

      // Render the first page to canvas
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 2.0 }) // Higher scale for better OCR

      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Failed to get canvas context')
        return null
      }

      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render the page
      const renderContext = {
        canvasContext: ctx,
        viewport: viewport,
        canvas: canvas
      }

      await page.render(renderContext).promise
      console.log('PDF page rendered to canvas')

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png')
      console.log('Canvas converted to data URL')
      
      return dataUrl
    } catch (error) {
      console.error('Error converting PDF to image:', error)
      return null
    }
  }

  private extractWordsFromText(text: string): string[] {
    const words: string[] = []
    const lines = text.split('\n')
    
    console.log('OCR extracted text preview:', text.substring(0, 500))
    console.log('Total lines to process:', lines.length)
    
    for (const line of lines) {
      // Skip if line looks like noise
      if (this.isNoiseLine(line)) {
        continue
      }
      
      // Extract words using more flexible regex
      // Match words that start with a letter and contain letters, hyphens, or apostrophes
      const matches = line.match(/[A-Za-z][A-Za-z\-']*/g)
      if (matches) {
        console.log('Line matches:', line, '->', matches)
        words.push(...matches)
      }
    }
    
    console.log('Raw extracted words count:', words.length)
    console.log('Sample words:', words.slice(0, 20))
    
    return words
  }

  private isNoiseLine(line: string): boolean {
    const trimmed = line.trim()
    
    // Empty or very short lines
    if (trimmed.length < 2) {
      return true
    }
    
    // Check against noise patterns
    const noisePatterns = [
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
    
    return noisePatterns.some(pattern => pattern.test(trimmed))
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
    // Length check - be more lenient
    if (word.length < 1 || word.length > 50) {
      return false
    }
    
    // Must contain only letters, hyphens, and apostrophes
    if (!/^[a-z\-']+$/.test(word)) {
      return false
    }
    
    // Avoid words that are likely noise
    const noiseWords = [
      'www', 'http', 'https', 'com', 'org', 'net', 'edu',
      'pdf', 'doc', 'docx', 'txt', 'jpg', 'png', 'gif',
      'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ]
    
    if (noiseWords.includes(word)) {
      return false
    }
    
    // Avoid words with too many repeated characters
    if (/([a-z])\1{3,}/.test(word)) {
      return false
    }
    
    // Avoid single letters unless they're common (a, i)
    if (word.length === 1 && !['a', 'i'].includes(word)) {
      return false
    }
    
    return true
  }
}

export const pdfParsingService = new PDFParsingService()