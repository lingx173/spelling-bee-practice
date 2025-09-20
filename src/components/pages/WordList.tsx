import { useState, useEffect } from 'react'
import { Search, Edit3, Trash2, Download, Upload, Plus, Tag, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { Word, WordImportData } from '../../types'
import { wordService } from '../../services/word-service'

export function WordList() {
  const [words, setWords] = useState<Word[]>([])
  const [filteredWords, setFilteredWords] = useState<Word[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterBySource, setFilterBySource] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [editingWord, setEditingWord] = useState<{ id: string; text: string } | null>(null)
  const [sourceLists, setSourceLists] = useState<string[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newWord, setNewWord] = useState('')

  useEffect(() => {
    loadWords()
    loadSourceLists()
  }, [])

  useEffect(() => {
    filterWords()
  }, [words, searchQuery, filterBySource])

  const loadWords = async () => {
    try {
      setIsLoading(true)
      const allWords = await wordService.getAllWords()
      setWords(allWords)
    } catch (error) {
      console.error('Failed to load words:', error)
      toast.error('Failed to load words')
    } finally {
      setIsLoading(false)
    }
  }

  const loadSourceLists = async () => {
    try {
      const sources = await wordService.getSourceLists()
      setSourceLists(sources)
    } catch (error) {
      console.error('Failed to load source lists:', error)
    }
  }

  const filterWords = () => {
    let filtered = words

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(word =>
        word.text.toLowerCase().includes(query) ||
        word.sourceList?.toLowerCase().includes(query) ||
        word.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }

    if (filterBySource) {
      filtered = filtered.filter(word => word.sourceList === filterBySource)
    }

    setFilteredWords(filtered)
  }

  const handleEditWord = async (wordId: string, newText: string) => {
    try {
      await wordService.updateWord(wordId, { text: newText })
      await loadWords()
      setEditingWord(null)
      toast.success('Word updated successfully')
    } catch (error) {
      console.error('Failed to update word:', error)
      toast.error('Failed to update word')
    }
  }

  const handleDeleteWord = async (wordId: string, wordText: string) => {
    if (!window.confirm(`Are you sure you want to delete "${wordText}"?`)) {
      return
    }

    try {
      await wordService.deleteWord(wordId)
      await loadWords()
      toast.success('Word deleted successfully')
    } catch (error) {
      console.error('Failed to delete word:', error)
      toast.error('Failed to delete word')
    }
  }

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newWord.trim()) {
      toast.error('Please enter a word')
      return
    }

    try {
      await wordService.addWords([newWord.trim()], 'manually-added')
      await loadWords()
      await loadSourceLists()
      setNewWord('')
      setShowAddForm(false)
      toast.success('Word added successfully')
    } catch (error) {
      console.error('Failed to add word:', error)
      toast.error('Failed to add word')
    }
  }

  const handleExportWords = async () => {
    try {
      const data = await wordService.exportWords()
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `spelling-bee-words-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Words exported successfully')
    } catch (error) {
      console.error('Failed to export words:', error)
      toast.error('Failed to export words')
    }
  }

  const handleImportWords = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data: WordImportData = JSON.parse(text)
      
      const result = await wordService.importWords(data)
      await loadWords()
      await loadSourceLists()
      
      toast.success(
        `Import complete: ${result.imported} new, ${result.updated} updated, ${result.skipped} skipped`
      )
      
      // Clear the input
      e.target.value = ''
    } catch (error) {
      console.error('Failed to import words:', error)
      toast.error('Failed to import words. Please check the file format.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getAccuracyPercentage = (word: Word) => {
    if (!word.stats || word.stats.seen === 0) return 0
    return Math.round((word.stats.correct / word.stats.seen) * 100)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading words...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Word Collection</h1>
          <p className="text-gray-600">Manage your {words.length} spelling bee words</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Word</span>
          </button>
          
          <button
            onClick={handleExportWords}
            className="btn-secondary flex items-center space-x-2"
            aria-label="Export all words to JSON file"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:block">Export</span>
          </button>
          
          <label className="btn-secondary flex items-center space-x-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span className="hidden sm:block">Import</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportWords}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Add Word Form */}
      {showAddForm && (
        <div className="card">
          <form onSubmit={handleAddWord} className="flex items-center space-x-4">
            <div className="flex-1">
              <label htmlFor="new-word" className="sr-only">New word</label>
              <input
                id="new-word"
                type="text"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                placeholder="Enter a new word..."
                className="input-field"
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary">
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                setNewWord('')
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="search-words" className="sr-only">Search words</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="search-words"
                type="text"
                placeholder="Search words, sources, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          
          <div className="sm:w-64">
            <label htmlFor="filter-source" className="sr-only">Filter by source</label>
            <select
              id="filter-source"
              value={filterBySource}
              onChange={(e) => setFilterBySource(e.target.value)}
              className="input-field"
            >
              <option value="">All sources</option>
              {sourceLists.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredWords.length} of {words.length} words
        </div>
      </div>

      {/* Words List */}
      {filteredWords.length === 0 ? (
        <div className="card text-center">
          <p className="text-gray-500 text-lg">
            {words.length === 0 ? 'No words in your collection yet.' : 'No words match your search.'}
          </p>
          {words.length === 0 && (
            <p className="text-gray-400 mt-2">
              Upload a PDF or add words manually to get started.
            </p>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Word
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWords.map((word) => {
                  const isEditing = editingWord?.id === word.id
                  const accuracy = getAccuracyPercentage(word)
                  
                  return (
                    <tr key={word.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingWord.text}
                            onChange={(e) => setEditingWord({ ...editingWord, text: e.target.value })}
                            onBlur={() => handleEditWord(word.id, editingWord.text)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditWord(word.id, editingWord.text)
                              } else if (e.key === 'Escape') {
                                setEditingWord(null)
                              }
                            }}
                            className="px-2 py-1 border border-primary-300 rounded font-medium"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-gray-900 font-mono">
                              {word.text}
                            </span>
                            {word.tags && word.tags.length > 0 && (
                              <div className="ml-2 flex space-x-1">
                                {word.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    <Tag className="w-3 h-3 mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">
                          {word.sourceList || 'Unknown'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {word.stats ? (
                            <div className="space-y-1">
                              <div>Seen: {word.stats.seen}</div>
                              <div className="flex items-center space-x-2">
                                <span>Accuracy: {accuracy}%</span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-green-600 h-2 rounded-full"
                                    style={{ width: `${accuracy}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">No stats yet</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(word.addedAt)}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setEditingWord({ id: word.id, text: word.text })}
                            className="text-indigo-600 hover:text-indigo-900"
                            aria-label={`Edit word: ${word.text}`}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word.id, word.text)}
                            className="text-red-600 hover:text-red-900"
                            aria-label={`Delete word: ${word.text}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
