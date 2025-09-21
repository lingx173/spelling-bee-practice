import { useState, useEffect } from 'react'

export interface Word {
  id: string
  text: string
  difficulty: 'easy' | 'medium' | 'hard'
  addedAt: string
  correctCount: number
  incorrectCount: number
}

export function useWords() {
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  // Load words from localStorage on mount
  useEffect(() => {
    try {
      const savedWords = localStorage.getItem('spelling-bee-words')
      if (savedWords) {
        setWords(JSON.parse(savedWords))
      }
    } catch (error) {
      console.error('Failed to load words from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Save words to localStorage whenever words change
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
    const newWord: Word = {
      id: Date.now().toString(),
      text: text.toLowerCase().trim(),
      difficulty,
      addedAt: new Date().toISOString(),
      correctCount: 0,
      incorrectCount: 0
    }
    setWords(prev => [...prev, newWord])
  }

  const addWords = (wordList: string[], difficulty: 'easy' | 'medium' | 'hard' = 'medium') => {
    const newWords: Word[] = wordList.map(text => ({
      id: (Date.now() + Math.random()).toString(),
      text: text.toLowerCase().trim(),
      difficulty,
      addedAt: new Date().toISOString(),
      correctCount: 0,
      incorrectCount: 0
    }))
    setWords(prev => [...prev, ...newWords])
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
