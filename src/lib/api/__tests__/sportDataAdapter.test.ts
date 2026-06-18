import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import type { SportDataAdapter } from '../sportDataAdapter'
import { FootballAdapter } from '../footballAdapter'
import { BasketballAdapter, fetchNbaFixtures } from '../basketball'
import { MmaAdapter } from '../mma'
import { ADAPTERS } from '../adapterRegistry'
import { clearCache } from '../client'
import type { Match } from '@/lib/types'

const ORIGINAL_API_KEY = process.env.API_SPORTS_KEY

describe('SportDataAdapter interface', () => {
  it('structural type check', () => {
    const adapter: SportDataAdapter = {
      async fetchFixtures(_opts: { date: string; isLive: boolean }) {
        return { matches: [], cached: false, cacheAge: 0 }
      },
    }
    expect(adapter.fetchFixtures).toBeDefined()
  })
})

describe('FootballAdapter', () => {
  let adapter: FootballAdapter

  beforeEach(() => {
    clearCache()
    adapter = new FootballAdapter()
  })

  describe('fetchFixtures with mock fetch', () => {
    const mockFetch = vi.fn()

    beforeEach(() => {
      mockFetch.mockReset()
      globalThis.fetch = mockFetch
      process.env.API_SPORTS_KEY = 'fake-key'
    })

    afterAll(() => {
      process.env.API_SPORTS_KEY = ORIGINAL_API_KEY
    })

    it('returns Match[] from API response', async () => {
      const mockResponse = {
        response: [
          {
            fixture: { id: 1, date: '2026-05-01T14:00:00Z', status: { short: 'FT', long: 'Match Finished', elapsed: 90 } },
            league: { id: 1, name: 'Premier League', country: 'England', logo: '' },
            teams: {
              home: { id: 1, name: 'Arsenal', logo: '' },
              away: { id: 2, name: 'Chelsea', logo: '' },
            },
            status: { short: 'FT', long: 'Match Finished' },
            goals: { home: 2, away: 1 },
            score: { fulltime: { home: 2, away: 1 }, halftime: { home: 1, away: 0 } },
            events: [
              { time: 23, type: 'goal', player: { name: 'Saka' }, team: { id: 1 }, assist: { name: 'Odegaard' }, comment: '' },
            ],
          },
        ],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve(mockResponse),
      })

      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: false })
      expect(result.matches).toBeInstanceOf(Array)
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0]).toHaveProperty('id')
      expect(result.matches[0]).toHaveProperty('sport', 'football')
      expect(result.matches[0]).toHaveProperty('homeTeam')
      expect(result.matches[0]).toHaveProperty('awayTeam')
      expect(result.matches[0]).toHaveProperty('status')
      expect(result.cached).toBe(false)
    })
  })

  describe('fetchFixtures with mock data (no API key)', () => {
    beforeEach(() => {
      process.env.API_SPORTS_KEY = ''
    })

    afterAll(() => {
      process.env.API_SPORTS_KEY = ORIGINAL_API_KEY
    })

    it('returns mock matches when no API key', async () => {
      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: false })
      expect(result.matches).toBeInstanceOf(Array)
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches[0].sport).toBe('football')
    })

    it('filters to live matches when isLive is true', async () => {
      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: true })
      expect(result.matches.every(m => m.status === 'live')).toBe(true)
    })
  })
})

describe('BasketballAdapter', () => {
  let adapter: BasketballAdapter

  beforeEach(() => {
    clearCache()
    adapter = new BasketballAdapter()
  })

  describe('fetchFixtures with mock data (no API key)', () => {
    beforeEach(() => {
      process.env.API_SPORTS_KEY = ''
    })

    afterAll(() => {
      process.env.API_SPORTS_KEY = ORIGINAL_API_KEY
    })

    it('returns basketball matches from mock data', async () => {
      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: false })
      expect(result.matches).toBeInstanceOf(Array)
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches.every(m => m.sport === 'basketball')).toBe(true)
    })

    it('filters to live matches when isLive is true', async () => {
      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: true })
      expect(result.matches.every(m => m.status === 'live')).toBe(true)
    })
  })
})

describe('MmaAdapter', () => {
  let adapter: MmaAdapter

  beforeEach(() => {
    clearCache()
    adapter = new MmaAdapter()
  })

  describe('fetchFixtures with mock data (no API key)', () => {
    beforeEach(() => {
      process.env.API_SPORTS_KEY = ''
    })

    afterAll(() => {
      process.env.API_SPORTS_KEY = ORIGINAL_API_KEY
    })

    it('returns MMA matches from mock data', async () => {
      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: false })
      expect(result.matches).toBeInstanceOf(Array)
      expect(result.matches.length).toBeGreaterThan(0)
      expect(result.matches.every(m => m.sport === 'mma')).toBe(true)
    })

    it('filters to live matches when isLive is true', async () => {
      const result = await adapter.fetchFixtures({ date: '2026-05-01', isLive: true })
      expect(result.matches.every(m => m.status === 'live')).toBe(true)
    })
  })
})

describe('ADAPTERS registry', () => {
  it('has entries for all 3 sports', () => {
    const sports = Object.keys(ADAPTERS)
    expect(sports).toContain('football')
    expect(sports).toContain('basketball')
    expect(sports).toContain('mma')
    expect(sports).toHaveLength(3)
  })

  it('each adapter implements SportDataAdapter', () => {
    expect(ADAPTERS.football).toBeInstanceOf(FootballAdapter)
    expect(ADAPTERS.basketball).toBeInstanceOf(BasketballAdapter)
    expect(ADAPTERS.mma).toBeInstanceOf(MmaAdapter)
  })

  it('each adapter has a fetchFixtures method', () => {
    expect(typeof ADAPTERS.football.fetchFixtures).toBe('function')
    expect(typeof ADAPTERS.basketball.fetchFixtures).toBe('function')
    expect(typeof ADAPTERS.mma.fetchFixtures).toBe('function')
  })
})
