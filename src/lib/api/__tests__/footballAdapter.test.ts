import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FootballAdapter } from '../footballAdapter'
import { clearCache } from '../client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('FootballAdapter.fetchFixtures', () => {
  beforeEach(() => {
    clearCache()
    mockFetch.mockReset()
    vi.stubEnv('API_FOOTBALL_API_KEY', 'test-key')
  })

  it('includes elapsed in raw status passed to normalizer', async () => {
    const apiResponse = {
      errors: [],
      response: [
        {
          fixture: {
            id: 1,
            date: '2026-05-01T14:00:00Z',
            status: { long: 'First Half', short: '1H', elapsed: 34 },
          },
          league: { id: 1, name: 'Premier League', country: 'England', logo: '' },
          teams: {
            home: { id: 10, name: 'Arsenal', logo: '' },
            away: { id: 20, name: 'Chelsea', logo: '' },
          },
          goals: { home: 1, away: 0 },
          score: {},
          events: [],
        },
      ],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(apiResponse),
    })

    const adapter = new FootballAdapter()
    const { matches } = await adapter.fetchFixtures('2026-05-01', false)

    expect(matches).toHaveLength(1)
    expect(matches[0].minute).toBe(34)
    expect(matches[0].status).toBe('live')
  })
})
