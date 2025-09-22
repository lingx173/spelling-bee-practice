import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface Word {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  addedAt: string
  correctCount: number
  incorrectCount: number
}

export const useWords = () => {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const storedWords = localStorage.getItem('spelling-bee-words')
      if (storedWords) {
        setWords(JSON.parse(storedWords))
      }
    } catch (error) {
      console.error('Failed to load words from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('spelling-bee-words', JSON.stringify(words))
      } catch (error) {
        console.error('Failed to save words to localStorage:', error)
      }
    }
  }, [words, loading])

  const addWord = (text: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const normalizedText = text.toLowerCase().trim()
    
    // Check if word already exists
    const existingWord = words.find(word => word.text === normalizedText)
    if (existingWord) {
      console.log(`Word "${normalizedText}" already exists, skipping duplicate`)
      return { success: false, message: `"${normalizedText}" already exists in your word list` }
    }

    const newWord: Word = {
      id: uuidv4(),
      text: normalizedText,
      difficulty,
      addedAt: new Date().toISOString(),
      correctCount: 0,
      incorrectCount: 0
    }
    setWords(prev => [...prev, newWord])
    return { success: true, message: `"${normalizedText}" added successfully` }
  }

  const addWords = (wordList: string[], difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const normalizedWords = wordList.map(text => text.toLowerCase().trim()).filter(text => text.length > 0)
    const existingWords = new Set(words.map(word => word.text))
    
    const newWords: Word[] = []
    const duplicates: string[] = []
    
    normalizedWords.forEach(text => {
      if (existingWords.has(text)) {
        duplicates.push(text)
      } else {
        newWords.push({
          id: uuidv4(),
          text,
          difficulty,
          addedAt: new Date().toISOString(),
          correctCount: 0,
          incorrectCount: 0
        })
      }
    })
    
    if (newWords.length > 0) {
      setWords(prev => [...prev, ...newWords])
    }
    
    return {
      success: newWords.length > 0,
      addedCount: newWords.length,
      duplicateCount: duplicates.length,
      duplicates,
      message: newWords.length > 0 
        ? `Added ${newWords.length} new words${duplicates.length > 0 ? `, skipped ${duplicates.length} duplicates` : ''}`
        : `All ${duplicates.length} words already exist in your word list`
    }
  }

  const updateWord = (id: string, updates: Partial<Word>) => {
    setWords(prev => prev.map(word => 
      word.id === id ? { ...word, ...updates } : word
    ))
  }

  const deleteWord = (id: string) => {
    setWords(prev => prev.filter(word => word.id !== id))
  }

  const clearAllWords = () => {
    setWords([])
  }

  const getWordsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard') => {
    return words.filter(word => word.difficulty === difficulty)
  }

  const searchWords = (query: string) => {
    const lowerQuery = query.toLowerCase()
    return words.filter(word => 
      word.text.includes(lowerQuery)
    )
  }

  return {
    words,
    loading,
    addWord,
    addWords,
    updateWord,
    deleteWord,
    clearAllWords,
    getWordsByDifficulty,
    searchWords
  }
}