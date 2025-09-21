import { useState, useRef } from 'react'
import { Upload as UploadIcon, FileText, CheckSquare, Square, Search, Trash2, Edit3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { pdfParsingService } from '../../services/pdf-parser'
import { wordService } from '../../services/word-service'
import { PDFParseResult } from '../../types'

export function Upload() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState<string>('')
  const [parseResult, setParseResult] = useState<PDFParseResult | null>(null)
  const [selectedWords, setSelectedWords] = useState<Set<string>>(new Set())
  const [searchFilter, setSearchFilter] = useState('')
  const [editingWord, setEditingWord] = useState<{ index: number; value: string } | null>(null)
  const [words, setWords] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }

    setIsProcessing(true)
    setProcessingStep('Loading PDF...')
    
    try {
      // Set up progress tracking
      const originalConsoleLog = console.log
      console.log = (...args) => {
        originalConsoleLog(...args)
        if (args[0]?.includes('OCR Progress:')) {
          setProcessingStep(`OCR Processing: ${args[0].split(': ')[1]}`)
        } else if (args[0]?.includes('Starting OCR processing')) {
          setProcessingStep('Starting OCR processing...')
        } else if (args[0]?.includes('Converting PDF to image')) {
          setProcessingStep('Converting PDF to image...')
        } else if (args[0]?.includes('OCR successful')) {
          setProcessingStep('OCR completed successfully!')
        }
      }

      const result = await pdfParsingService.parseFile(file)
      
      // Restore original console.log
      console.log = originalConsoleLog
      
      setParseResult(result)
      setWords(result.words)
      
      // Initially select all words
      setSelectedWords(new Set(result.words))
      
      const method = result.metadata.note?.includes('OCR') ? 'OCR' : 
                    result.metadata.note?.includes('filename') ? 'filename' : 'test'
      
      toast.success(`Found ${result.words.length} words using ${method}`)
    } catch (error) {
      console.error('PDF processing error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to process PDF. Please try again.'
      toast.error(errorMessage)
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const filteredWords = words.filter(word => 
    word.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const handleWordToggle = (word: string) => {
    const newSelected = new Set(selectedWords)
    if (newSelected.has(word)) {
      newSelected.delete(word)
    } else {
      newSelected.add(word)
    }
    setSelectedWords(newSelected)
  }

  const handleSelectAll = () => {
    setSelectedWords(new Set(filteredWords))
  }

  const handleDeselectAll = () => {
    setSelectedWords(new Set())
  }

  const handleWordEdit = (index: number, newValue: string) => {
    const updatedWords = [...words]
    const oldWord = updatedWords[index]
    updatedWords[index] = newValue
    setWords(updatedWords)
    
    // Update selection if the old word was selected
    if (selectedWords.has(oldWord)) {
      const newSelected = new Set(selectedWords)
      newSelected.delete(oldWord)
      newSelected.add(newValue)
      setSelectedWords(newSelected)
    }
    
    setEditingWord(null)
  }

  const handleWordDelete = (index: number) => {
    const wordToDelete = words[index]
    const updatedWords = words.filter((_, i) => i !== index)
    setWords(updatedWords)
    
    // Remove from selection if selected
    if (selectedWords.has(wordToDelete)) {
      const newSelected = new Set(selectedWords)
      newSelected.delete(wordToDelete)
      setSelectedWords(newSelected)
    }
  }

  const handleConfirmWords = async () => {
    if (selectedWords.size === 0) {
      toast.error('Please select at least one word')
      return
    }

    try {
      const wordsArray = Array.from(selectedWords)
      const sourceList = parseResult?.metadata.filename || 'uploaded-pdf'
      
      await wordService.addWords(wordsArray, sourceList)
      
      toast.success(`Added ${wordsArray.length} words to your collection!`)
      navigate('/')
    } catch (error) {
      console.error('Failed to add words:', error)
      toast.error('Failed to add words. Please try again.')
    }
  }

  const handleReset = () => {
    setParseResult(null)
    setSelectedWords(new Set())
    setSearchFilter('')
    setWords([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Word List PDF
        </h1>
        <p className="text-lg text-gray-600">
          Upload a PDF file containing spelling bee words to add them to your collection
        </p>
      </div>

      {!parseResult ? (
        /* Upload Form */
        <div className="card text-center">
          <div className="mb-8">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Select PDF File
            </h2>
            <p className="text-gray-600 mb-6">
              Choose a PDF file containing your spelling bee word list
            </p>
          </div>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="hidden"
              id="pdf-upload"
            />
            
            <label
              htmlFor="pdf-upload"
              className={`btn-primary inline-flex items-center space-x-2 cursor-pointer ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <UploadIcon className="w-5 h-5" />
              <span>{isProcessing ? 'Processing...' : 'Choose PDF File'}</span>
            </label>
            
            {isProcessing && (
              <div className="flex flex-col items-center justify-center mt-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mr-3"></div>
                  <span className="text-gray-600">{processingStep || 'Extracting words from PDF...'}</span>
                </div>
                {processingStep.includes('OCR') && (
                  <div className="mt-2 text-sm text-gray-500">
                    This may take a moment for scanned documents...
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-left bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Tips for best results:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use PDFs with clear, readable text (not scanned images)</li>
              <li>• Word lists work best when each word is on its own line</li>
              <li>• The app will automatically filter out page numbers and headers</li>
              <li>• You can edit and review words before adding them</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Word Verification */
        <div className="space-y-6">
          {/* Results Header */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Review Extracted Words
                </h2>
                <p className="text-gray-600">
                  Found {words.length} words in {parseResult.metadata.filename}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="btn-secondary"
                aria-label="Upload a different PDF"
              >
                Upload Different PDF
              </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <label htmlFor="word-search" className="sr-only">Search words</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    id="word-search"
                    type="text"
                    placeholder="Search words..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="btn-secondary"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  className="btn-secondary"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {selectedWords.size} of {filteredWords.length} words selected
            </div>
          </div>

          {/* Word List */}
          <div className="card">
            <div className="max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredWords.map((word, index) => {
                  const originalIndex = words.indexOf(word)
                  const isSelected = selectedWords.has(word)
                  const isEditing = editingWord?.index === originalIndex
                  
                  return (
                    <div
                      key={`${word}-${index}`}
                      className={`flex items-center space-x-2 p-2 rounded border ${
                        isSelected ? 'bg-primary-50 border-primary-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => handleWordToggle(word)}
                        className="flex-shrink-0"
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} word: ${word}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                      
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingWord.value}
                          onChange={(e) => setEditingWord({ ...editingWord, value: e.target.value })}
                          onBlur={() => handleWordEdit(originalIndex, editingWord.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleWordEdit(originalIndex, editingWord.value)
                            } else if (e.key === 'Escape') {
                              setEditingWord(null)
                            }
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-primary-300 rounded"
                          autoFocus
                        />
                      ) : (
                        <span className="flex-1 text-sm font-mono">{word}</span>
                      )}
                      
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingWord({ index: originalIndex, value: word })}
                          className="text-gray-400 hover:text-gray-600"
                          aria-label={`Edit word: ${word}`}
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleWordDelete(originalIndex)}
                          className="text-gray-400 hover:text-red-600"
                          aria-label={`Delete word: ${word}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex justify-center">
            <button
              onClick={handleConfirmWords}
              disabled={selectedWords.size === 0}
              className="btn-success text-lg px-8 py-4"
            >
              Add {selectedWords.size} Words to Collection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
