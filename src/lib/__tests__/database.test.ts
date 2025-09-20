import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { SpellingBeeDB, initializeSettings, seedSampleWords } from '../database'
import { Word, Settings } from '../../types'

// Mock Dexie
const mockTable = {
  add: vi.fn(),
  get: vi.fn(),
  where: vi.fn().mockReturnThis(),
  equals: vi.fn().mockReturnThis(),
  first: vi.fn(),
  orderBy: vi.fn().mockReturnThis(),
  toArray: vi.fn(),
  filter: vi.fn().mockReturnThis(),
  update: vi.fn(),
  delete: vi.fn(),
  bulkDelete: vi.fn(),
  count: vi.fn()
}

vi.mock('dexie', () => {
  const MockDexie = vi.fn().mockImplementation(() => ({
    words: mockTable,
    settings: mockTable,
    sessions: mockTable,
    version: vi.fn().mockReturnThis(),
    stores: vi.fn().mockReturnThis()
  }))

  return {
    default: MockDexie,
    Table: vi.fn()
  }
})

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-123')
  }
})

describe('SpellingBeeDB', () => {
  let db: SpellingBeeDB

  beforeEach(() => {
    vi.clearAllMocks()
    db = new SpellingBeeDB()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with correct database name', () => {
      expect(db).toBeDefined()
      expect(db.words).toBeDefined()
      expect(db.settings).toBeDefined()
      expect(db.sessions).toBeDefined()
    })
  })
})

describe('initializeSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should add default settings when none exist', async () => {
    mockTable.toArray.mockResolvedValue([])
    mockTable.add.mockResolvedValue(undefined)

    await initializeSettings()

    expect(mockTable.add).toHaveBeenCalledWith({
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
      lastUpdated: expect.any(String)
    })
  })

  it('should not add settings when they already exist', async () => {
    mockTable.toArray.mockResolvedValue([{ id: 'default' }])

    await initializeSettings()

    expect(mockTable.add).not.toHaveBeenCalled()
  })
})

describe('seedSampleWords', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should add sample words when database is empty', async () => {
    mockTable.count.mockResolvedValue(0)
    mockTable.add.mockResolvedValue(undefined)

    await seedSampleWords()

    expect(mockTable.add).toHaveBeenCalledTimes(5) // 5 sample words
    expect(mockTable.add).toHaveBeenCalledWith(
      expect.objectContaining({
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
        addedAt: expect.any(String)
      })
    )
  })

  it('should not add sample words when database has existing words', async () => {
    mockTable.count.mockResolvedValue(10)

    await seedSampleWords()

    expect(mockTable.add).not.toHaveBeenCalled()
  })
})
