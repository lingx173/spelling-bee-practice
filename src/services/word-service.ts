import { v4 as uuidv4 } from 'uuid'
import { Word, WordImportData } from '../types'
import { db } from '../lib/database'

export class WordService {
  public async addWords(words: string[], sourceList?: string): Promise<Word[]> {
    const addedWords: Word[] = []
    const now = new Date().toISOString()
    
    for (const wordText of words) {
      const normalizedText = wordText.toLowerCase().trim()
      
      if (!normalizedText || normalizedText.length < 2) {
        continue
      }
      
      // Check if word already exists
      const existing = await db.words.where('key').equals(normalizedText).first()
      
      if (!existing) {
        const word: Word = {
          id: uuidv4(),
          text: wordText,
          key: normalizedText,
          sourceList,
          stats: {
            seen: 0,
            correct: 0,
            wrong: 0,
            easiness: 2.5, // Default for spaced repetition
            interval: 1
          },
          addedAt: now
        }
        
        await db.words.add(word)
        addedWords.push(word)
      } else if (sourceList && existing.sourceList !== sourceList) {
        // Update source list if different
        await db.words.update(existing.id, {
          sourceList,
          updatedAt: now
        })
      }
    }
    
    return addedWords
  }

  public async getAllWords(): Promise<Word[]> {
    return await db.words.orderBy('text').toArray()
  }

  public async getWordsBySource(sourceList: string): Promise<Word[]> {
    return await db.words.where('sourceList').equals(sourceList).toArray()
  }

  public async searchWords(query: string): Promise<Word[]> {
    const lowerQuery = query.toLowerCase()
    return await db.words
      .filter(word => 
        word.text.toLowerCase().includes(lowerQuery) ||
        word.sourceList?.toLowerCase().includes(lowerQuery) ||
        word.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray()
  }

  public async updateWord(id: string, updates: Partial<Word>): Promise<void> {
    const updateData = {
      ...updates,
      updatedAt: new Date().toISOString()
    }
    
    // If text is being updated, update the key as well
    if (updates.text) {
      updateData.key = updates.text.toLowerCase()
    }
    
    await db.words.update(id, updateData)
  }

  public async deleteWord(id: string): Promise<void> {
    await db.words.delete(id)
  }

  public async deleteWordsBySource(sourceList: string): Promise<number> {
    const words = await this.getWordsBySource(sourceList)
    await db.words.bulkDelete(words.map(w => w.id))
    return words.length
  }

  public async updateWordStats(
    wordId: string, 
    result: 'correct' | 'incorrect' | 'seen'
  ): Promise<void> {
    const word = await db.words.get(wordId)
    if (!word || !word.stats) return
    
    const stats = { ...word.stats }
    const now = new Date().toISOString()
    
    stats.seen += 1
    stats.lastSeen = now
    
    if (result === 'correct') {
      stats.correct += 1
      // Spaced repetition: increase easiness and interval
      stats.easiness = Math.min(2.5, (stats.easiness || 2.5) + 0.1)
      stats.interval = Math.ceil((stats.interval || 1) * (stats.easiness || 2.5))
    } else if (result === 'incorrect') {
      stats.wrong += 1
      // Spaced repetition: decrease easiness, reset interval
      stats.easiness = Math.max(1.3, (stats.easiness || 2.5) - 0.2)
      stats.interval = 1
    }
    
    // Calculate next due date for spaced repetition
    const nextDue = new Date()
    nextDue.setDate(nextDue.getDate() + (stats.interval || 1))
    stats.nextDue = nextDue.toISOString()
    
    await this.updateWord(wordId, { stats })
  }

  public async getRandomWord(excludeIds: string[] = []): Promise<Word | null> {
    const words = await db.words
      .filter(word => !excludeIds.includes(word.id))
      .toArray()
    
    if (words.length === 0) {
      return null
    }
    
    const randomIndex = Math.floor(Math.random() * words.length)
    return words[randomIndex]
  }

  public async getWordsDueForReview(): Promise<Word[]> {
    const now = new Date().toISOString()
    return await db.words
      .filter(word => 
        !word.stats?.nextDue || word.stats.nextDue <= now
      )
      .toArray()
  }

  public async exportWords(): Promise<WordImportData> {
    const words = await this.getAllWords()
    
    return {
      words,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        source: 'Spelling Bee PWA'
      }
    }
  }

  public async importWords(data: WordImportData): Promise<{
    imported: number
    skipped: number
    updated: number
  }> {
    let imported = 0
    let skipped = 0
    let updated = 0
    
    for (const word of data.words) {
      const existing = await db.words.where('key').equals(word.key).first()
      
      if (existing) {
        // Check if we should update the existing word
        const existingUpdatedAt = existing.updatedAt || existing.addedAt
        const importUpdatedAt = word.updatedAt || word.addedAt
        
        if (importUpdatedAt > existingUpdatedAt) {
          await db.words.update(existing.id, {
            ...word,
            id: existing.id, // Keep existing ID
            updatedAt: new Date().toISOString()
          })
          updated++
        } else {
          skipped++
        }
      } else {
        // Add new word
        await db.words.add({
          ...word,
          id: word.id || uuidv4(),
          addedAt: word.addedAt || new Date().toISOString()
        })
        imported++
      }
    }
    
    return { imported, skipped, updated }
  }

  public async getWordCount(): Promise<number> {
    return await db.words.count()
  }

  public async getSourceLists(): Promise<string[]> {
    const words = await db.words.toArray()
    const sources = new Set<string>()
    
    words.forEach(word => {
      if (word.sourceList) {
        sources.add(word.sourceList)
      }
    })
    
    return Array.from(sources).sort()
  }
}

export const wordService = new WordService()
