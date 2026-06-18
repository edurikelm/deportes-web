import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BasketballAdapter, normalizeBasketballMatch } from '../basketball'
import { clearCache } from '../client'

describe('BasketballAdapter.fetchFixtures with timeZone', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    clearCache()
    mockFetch.mockReset()
    globalThis.fetch = mockFetch
    vi.stubEnv('API_SPORTS_KEY', 'test-key')
  })

  it('fetches only the requested date when no timeZone is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ response: [] }),
    })

    const adapter = new BasketballAdapter()
    const result = await adapter.fetchFixtures({ date: '2026-05-15', isLive: false })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.matches).toHaveLength(0)
  })

  it('fetches 3 dates when timeZone is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ response: [] }),
    })

    const adapter = new BasketballAdapter()
    await adapter.fetchFixtures({ date: '2026-05-15', isLive: false, timeZone: 'America/Santiago' })

    expect(mockFetch).toHaveBeenCalledTimes(3)
    const urls = mockFetch.mock.calls.map(([url]) => url)
    expect(urls).toEqual(
      expect.arrayContaining([
        expect.stringContaining('2026-05-14'),
        expect.stringContaining('2026-05-15'),
        expect.stringContaining('2026-05-16'),
      ])
    )
  })

  it('filters matches to only those on requested date in the visitor timezone', async () => {
    const baseFixture = (id: number, start: string) => ({
      id,
      date: { start },
      status: { clock: null, halftime: false, short: 3, long: 'Finished' },
      periods: { current: 4, total: 4 },
      league: 'NBA',
      teams: {
        visitors: { id: 1, name: 'Celtics', nickname: 'Celtics', code: 'BOS', logo: '' },
        home: { id: 2, name: 'Lakers', nickname: 'Lakers', code: 'LAL', logo: '' },
      },
      scores: {
        visitors: { win: 0, loss: 0, linescore: [], points: null },
        home: { win: 0, loss: 0, linescore: [], points: null },
      },
    })

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('date=2026-05-14')) {
        return Promise.resolve({
          ok: true, status: 200, json: () => Promise.resolve({
            response: [baseFixture(1, '2026-05-15T04:00:00Z')],
          }),
        })
      }
      if (url.includes('date=2026-05-15')) {
        return Promise.resolve({
          ok: true, status: 200, json: () => Promise.resolve({
            response: [baseFixture(2, '2026-05-16T01:00:00Z')],
          }),
        })
      }
      return Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({
          response: [baseFixture(3, '2026-05-16T04:00:00Z')],
        }),
      })
    })

    const adapter = new BasketballAdapter()
    const result = await adapter.fetchFixtures({ date: '2026-05-15', isLive: false, timeZone: 'America/Santiago' })

    expect(result.matches).toHaveLength(2)
    expect(result.matches.map(m => m.id)).toEqual(['1', '2'])
  })

  it('deduplicates matches by id', async () => {
    const baseFixture = (id: number, start: string) => ({
      id,
      date: { start },
      status: { clock: null, halftime: false, short: 3, long: 'Finished' },
      periods: { current: 4, total: 4 },
      league: 'NBA',
      teams: {
        visitors: { id: 1, name: 'Celtics', nickname: 'Celtics', code: 'BOS', logo: '' },
        home: { id: 2, name: 'Lakers', nickname: 'Lakers', code: 'LAL', logo: '' },
      },
      scores: {
        visitors: { win: 0, loss: 0, linescore: [], points: null },
        home: { win: 0, loss: 0, linescore: [], points: null },
      },
    })

    mockFetch.mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({
        response: [baseFixture(1, '2026-05-15T18:00:00Z')],
      }),
    })

    const adapter = new BasketballAdapter()
    const result = await adapter.fetchFixtures({ date: '2026-05-15', isLive: false, timeZone: 'America/New_York' })

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].id).toBe('1')
  })
})

describe('normalizeBasketballMatch', () => {
  it('produces correct quarters shape', () => {
    const raw = {
      id: 12345,
      date: { start: '2026-05-01T00:00:00Z' },
      status: { clock: null, halftime: false, short: 3, long: 'Finished' },
      periods: { current: 4, total: 4 },
      league: 'NBA',
      teams: {
        visitors: {
          id: 1, name: 'Celtics', nickname: 'Celtics', code: 'BOS',
          logo: 'https://example.com/bos.png',
        },
        home: {
          id: 2, name: 'Lakers', nickname: 'Lakers', code: 'LAL',
          logo: 'https://example.com/lal.png',
        },
      },
      scores: {
        visitors: {
          win: 0, loss: 0,
          linescore: ['30', '29', '28', '31'],
          points: 118,
        },
        home: {
          win: 0, loss: 0,
          linescore: ['28', '24', '32', '28'],
          points: 112,
        },
      },
    }

    const result = normalizeBasketballMatch(raw as never)

    expect(result.score?.quarters).toBeDefined()
    expect(result.score!.quarters!).toHaveLength(4)
    expect(result.score!.quarters![0]).toEqual({ home: 28, away: 30 })
    expect(result.score!.quarters![3]).toEqual({ home: 28, away: 31 })
  })
})
