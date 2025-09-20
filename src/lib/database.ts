import Dexie, { Table } from 'dexie'
import { Word, Settings, PracticeSession } from '../types'

export class SpellingBeeDB extends Dexie {
  words!: Table<Word>
  settings!: Table<Settings>
  sessions!: Table<PracticeSession>

  constructor() {
    super('SpellingBeeDB')
    
    this.version(1).stores({
      words: 'id, key, text, sourceList, addedAt, *tags',
      settings: 'id',
      sessions: 'id, startTime'
    })
  }
}

export const db = new SpellingBeeDB()

// Initialize default settings
export async function initializeSettings(): Promise<void> {
  const existingSettings = await db.settings.toArray()
  
  if (existingSettings.length === 0) {
    await db.settings.add({
      id: 'default',
      voiceSettings: {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
      },
      practiceSettings: {
        caseSensitive: false,
        showDefinitions: true,
        slowPlayback: false,
      },
      lastUpdated: new Date().toISOString()
    })
  }
}

// Seed with sample words
export async function seedSampleWords(): Promise<void> {
  const wordCount = await db.words.count()
  
  if (wordCount === 0) {
    const sampleWords: Omit<Word, 'id'>[] = [
      {
        text: 'beautiful',
        key: 'beautiful',
        sourceList: 'sample',
        metadata: {
          definition: 'pleasing the senses or mind aesthetically',
          example: 'She has a beautiful smile.'
        },
        stats: {
          seen: 0,
          correct: 0,
          wrong: 0,
          easiness: 2.5,
          interval: 1
        },
        addedAt: new Date().toISOString()
      },
      {
        text: 'definitely',
        key: 'definitely',
        sourceList: 'sample',
        metadata: {
          definition: 'without doubt; certainly',
          example: 'I will definitely be there.'
        },
        stats: {
          seen: 0,
          correct: 0,
          wrong: 0,
          easiness: 2.5,
          interval: 1
        },
        addedAt: new Date().toISOString()
      },
      {
        text: 'necessary',
        key: 'necessary',
        sourceList: 'sample',
        metadata: {
          definition: 'required to be done, achieved, or present; needed; essential',
          example: 'Sleep is necessary for good health.'
        },
        stats: {
          seen: 0,
          correct: 0,
          wrong: 0,
          easiness: 2.5,
          interval: 1
        },
        addedAt: new Date().toISOString()
      },
      {
        text: 'separate',
        key: 'separate',
        sourceList: 'sample',
        metadata: {
          definition: 'forming or viewed as a unit apart or by itself',
          example: 'Keep your work and personal life separate.'
        },
        stats: {
          seen: 0,
          correct: 0,
          wrong: 0,
          easiness: 2.5,
          interval: 1
        },
        addedAt: new Date().toISOString()
      },
      {
        text: 'beginning',
        key: 'beginning',
        sourceList: 'sample',
        metadata: {
          definition: 'the point in time or space at which something starts',
          example: 'The beginning of the story was exciting.'
        },
        stats: {
          seen: 0,
          correct: 0,
          wrong: 0,
          easiness: 2.5,
          interval: 1
        },
        addedAt: new Date().toISOString()
      }
    ]

    for (const word of sampleWords) {
      await db.words.add({
        ...word,
        id: crypto.randomUUID()
      })
    }
  }
}
