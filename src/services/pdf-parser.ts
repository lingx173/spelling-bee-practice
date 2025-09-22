import * as pdfjsLib from 'pdfjs-dist'

// Configure PDF.js worker - use a local worker file
console.log('Configuring PDF.js worker...')
try {
  // Try to use a local worker file first
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
  console.log('PDF.js worker configured with local file')
} catch (error) {
  console.warn('Local worker failed, trying CDN fallback')
  // Fallback to CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
  console.log('PDF.js worker configured with CDN')
}

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

      // Try text extraction first for regular PDFs
      try {
        console.log('Attempting text extraction from PDF...')
        const textWords = await this.extractTextFromPDF(file)
        console.log('Text extraction result:', textWords.length, 'words found')
        if (textWords.length > 0) {
          console.log('Text extraction successful, found', textWords.length, 'words')
          console.log('Sample words:', textWords.slice(0, 10))
          return {
            words: textWords,
            metadata: {
              filename: file.name,
              pageCount: 1,
              extractedAt: new Date().toISOString(),
              note: 'Words extracted from PDF text content',
              method: 'text-extraction'
            }
          }
        } else {
          console.log('Text extraction found no words, trying OCR...')
        }
      } catch (textError) {
        console.error('Text extraction failed with error:', textError)
        if (textError instanceof Error) {
          console.error('Error details:', textError.message)
          console.error('Error stack:', textError.stack)
        }
      }

      // Try OCR for scanned PDFs only if text extraction failed
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

  private async extractTextFromPDF(file: File): Promise<string[]> {
    try {
      console.log('=== STARTING PDF TEXT EXTRACTION ===')
      console.log('File name:', file.name)
      console.log('File size:', file.size)
      console.log('File type:', file.type)
      
      // Test PDF.js availability first
      console.log('PDF.js version:', pdfjsLib.version)
      console.log('PDF.js GlobalWorkerOptions:', pdfjsLib.GlobalWorkerOptions)
      
      // Load the PDF using PDF.js with timeout
      const arrayBuffer = await file.arrayBuffer()
      console.log('PDF array buffer size:', arrayBuffer.byteLength)
      
      // Try to load PDF with minimal configuration
      console.log('Attempting to load PDF with PDF.js...')
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: false,
        disableFontFace: false,
        disableAutoFetch: true,
        disableStream: true
      })
      
      console.log('PDF loading task created, waiting for promise...')
      const pdf = await loadingTask.promise
      console.log('✅ PDF loaded successfully!')
      console.log('Number of pages:', pdf.numPages)

      if (pdf.numPages === 0) {
        console.log('❌ PDF has no pages!')
        return []
      }

      let allText = ''
      
      // Extract text from all pages
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`\n--- Processing page ${pageNum} of ${pdf.numPages} ---`)
        const page = await pdf.getPage(pageNum)
        console.log('Page loaded, getting text content...')
        
        const textContent = await page.getTextContent()
        console.log(`Page ${pageNum} has ${textContent.items.length} text items`)
        
        if (textContent.items.length === 0) {
          console.log(`❌ Page ${pageNum} has no text items!`)
          continue
        }
        
        // Log each text item for debugging
        textContent.items.forEach((item: any, index: number) => {
          if (index < 10) { // Only log first 10 items to avoid spam
            console.log(`Item ${index}: "${item.str}" (width: ${item.width}, height: ${item.height})`)
          }
        })
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ')
        
        console.log(`Page ${pageNum} extracted text length:`, pageText.length)
        console.log(`Page ${pageNum} extracted text:`, pageText)
        
        allText += pageText + ' '
      }

      console.log('\n=== EXTRACTION SUMMARY ===')
      console.log('Total extracted text length:', allText.length)
      console.log('Total extracted text:', allText)

      if (allText.trim().length === 0) {
        console.log('❌ No text extracted from PDF!')
        return []
      }

      // Extract and clean words from text
      console.log('Processing extracted text into words...')
      const words = this.extractWordsFromText(allText)
      console.log('Raw words found:', words.length)
      console.log('Raw words sample:', words.slice(0, 20))
      
      const cleanedWords = this.cleanAndDeduplicateWords(words)
      console.log('✅ Cleaned words found:', cleanedWords.length)
      console.log('Cleaned words sample:', cleanedWords.slice(0, 30))
      
      return cleanedWords
    } catch (error) {
      console.error('❌ Text extraction failed:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }
      return []
    }
  }


  private async performOCR(file: File): Promise<string[]> {
    console.log('Starting OCR processing for file:', file.name)
    
    try {
      // Try to dynamically import Tesseract.js with timeout
      const tesseractModule = await Promise.race([
        import('tesseract.js'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Tesseract.js loading timeout')), 10000)
        )
      ]) as any

      const { createWorker } = tesseractModule
      let worker: any = null
      
      try {
        // Create a worker for OCR processing with timeout
        worker = await Promise.race([
          createWorker('eng', 1, {
            logger: (m: any) => {
              if (m.status === 'recognizing text') {
                console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
              }
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OCR worker creation timeout')), 15000)
          )
        ]) as any

        // Convert PDF to image (first page only for now)
        const imageDataUrl = await this.convertPDFToImage(file)
        
        if (!imageDataUrl) {
          throw new Error('Failed to convert PDF to image')
        }

        // Perform OCR on the image with timeout
        const ocrResult = await Promise.race([
          worker.recognize(imageDataUrl),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('OCR processing timeout')), 30000)
          )
        ]) as any
        
        const text = ocrResult.data.text
        console.log('OCR extracted text length:', text.length)
        console.log('OCR extracted text sample:', text.substring(0, 1000))
        
        // Extract and clean words from OCR text
        const words = this.extractWordsFromText(text)
        const cleanedWords = this.cleanAndDeduplicateWords(words)
        
        console.log('OCR found', cleanedWords.length, 'unique words')
        console.log('Sample cleaned words:', cleanedWords.slice(0, 30))
        
        return cleanedWords
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
    } catch (error) {
      console.error('OCR processing failed:', error)
      // Return empty array instead of throwing to allow fallback
      return []
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
    
    console.log('Processing text for word extraction...')
    console.log('Text preview:', text.substring(0, 500))
    
    // Split by any whitespace and extract words
    const tokens = text.split(/\s+/)
    console.log('Total tokens found:', tokens.length)
    
    for (const token of tokens) {
      // Clean the token
      const cleaned = token
        .toLowerCase()
        .replace(/^[^a-z]+|[^a-z]+$/g, '') // Remove leading/trailing non-letters
        .trim()
      
      // Check if it's a valid word
      if (cleaned.length >= 1 && cleaned.length <= 50 && /^[a-z\-']+$/.test(cleaned)) {
        words.push(cleaned)
      }
    }
    
    console.log('Raw extracted words count:', words.length)
    console.log('Sample words:', words.slice(0, 20))
    
    return words
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