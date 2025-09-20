export interface Word {
  id: string
  text: string
  key: string // text.toLowerCase()
  sourceList?: string // e.g., "2024_school_list.pdf"
  tags?: string[] // e.g., ["grade5","science"]
  metadata?: {
    ipa?: string
    syllables?: string[]
    definition?: string
    example?: string
    audioUrl?: string // optional external asset
  }
  stats?: {
    seen: number
    correct: number
    wrong: number
    lastSeen?: string // ISO
    easiness?: number // for spaced repetition
    interval?: number
    nextDue?: string
  }
  addedAt: string // ISO
  updatedAt?: string // ISO
}

export interface Settings {
  id: string
  voiceSettings: {
    preferredVoice?: string
    rate: number
    pitch: number
    volume: number
  }
  practiceSettings: {
    caseSensitive: boolean
    showDefinitions: boolean
    slowPlayback: boolean
  }
  lastUpdated: string
}

export interface PracticeSession {
  id: string
  startTime: string
  endTime?: string
  wordsAttempted: number
  wordsCorrect: number
  streak: number
  maxStreak: number
}

export interface PDFParseResult {
  words: string[]
  metadata: {
    filename: string
    pageCount: number
    extractedAt: string
  }
}

export interface TTSOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

export interface WordImportData {
  words: Word[]
  metadata: {
    exportedAt: string
    version: string
    source: string
  }
}

export type PracticeMode = 'random' | 'spaced-repetition'

export type PracticeResult = 'correct' | 'incorrect' | 'skipped'
