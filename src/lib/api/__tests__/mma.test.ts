import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MmaAdapter, normalizeMmaMatch, mapMmaEventType } from '../mma'
import { clearCache } from '../client'

describe('MmaAdapter.fetchFixtures with timeZone', () => {
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

    const adapter = new MmaAdapter()
    const result = await adapter.fetchFixtures({ date: '2026-05-15', isLive: false })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(result.matches).toHaveLength(0)
  })

  it('fetches 3 dates when timeZone is provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({ response: [] }),
    })

    const adapter = new MmaAdapter()
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
      date: start,
      status: { long: 'Finished', short: 'finished' },
      league: { id: 1, name: 'UFC', logo: '' },
      fighters: {
        home: { id: 101, name: 'Fighter A', logo: '' },
        away: { id: 102, name: 'Fighter B', logo: '' },
      },
    })

    mockFetch.mockImplementation((url: string) => {
      if (url.includes('2026-05-14')) {
        return Promise.resolve({
          ok: true, status: 200, json: () => Promise.resolve({
            response: [baseFixture(1, '2026-05-15T04:00:00Z')],
          }),
        })
      }
      if (url.includes('2026-05-15')) {
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

    const adapter = new MmaAdapter()
    const result = await adapter.fetchFixtures({ date: '2026-05-15', isLive: false, timeZone: 'America/Santiago' })

    expect(result.matches).toHaveLength(2)
    expect(result.matches.map(m => m.id)).toEqual(['1', '2'])
  })

  it('deduplicates matches by id', async () => {
    const baseFixture = (id: number, start: string) => ({
      id,
      date: start,
      status: { long: 'Finished', short: 'finished' },
      league: { id: 1, name: 'UFC', logo: '' },
      fighters: {
        home: { id: 101, name: 'Fighter A', logo: '' },
        away: { id: 102, name: 'Fighter B', logo: '' },
      },
    })

    mockFetch.mockResolvedValue({
      ok: true, status: 200, json: () => Promise.resolve({
        response: [baseFixture(1, '2026-05-15T18:00:00Z')],
      }),
    })

    const adapter = new MmaAdapter()
    const result = await adapter.fetchFixtures({ date: '2026-05-15', isLive: false, timeZone: 'America/New_York' })

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].id).toBe('1')
  })
})

describe('mapMmaEventType', () => {
  it('maps knockout variations', () => {
    expect(mapMmaEventType('ko')).toBe('knockout')
    expect(mapMmaEventType('Knockout')).toBe('knockout')
    expect(mapMmaEventType('TKO')).toBe('tko')
  })

  it('maps submission', () => {
    expect(mapMmaEventType('submission')).toBe('submission')
    expect(mapMmaEventType('Submission')).toBe('submission')
  })

  it('maps decision', () => {
    expect(mapMmaEventType('decision')).toBe('decision')
    expect(mapMmaEventType('Decision')).toBe('decision')
  })
})

describe('normalizeMmaMatch', () => {
  it('produces correct event types for knockout', () => {
    const raw = {
      id: 1001,
      date: '2026-05-01T00:00:00Z',
      status: { long: 'Finished', short: 'finished' },
      league: { id: 1, name: 'UFC', logo: '' },
      fighters: {
        home: { id: 101, name: 'Fighter A', logo: '' },
        away: { id: 102, name: 'Fighter B', logo: '' },
      },
      result: {
        winner: { id: 101, name: 'Fighter A' },
        method: 'KO',
        round: 2,
        time: '1:23',
      },
    }

    const result = normalizeMmaMatch(raw as never)
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('knockout')
  })

  it('produces correct event types for submission', () => {
    const raw = {
      id: 1002,
      date: '2026-05-01T00:00:00Z',
      status: { long: 'Finished', short: 'finished' },
      league: { id: 1, name: 'UFC', logo: '' },
      fighters: {
        home: { id: 101, name: 'Fighter A', logo: '' },
        away: { id: 102, name: 'Fighter B', logo: '' },
      },
      result: {
        winner: { id: 102, name: 'Fighter B' },
        method: 'Submission',
        round: 3,
        time: '2:45',
      },
    }

    const result = normalizeMmaMatch(raw as never)
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('submission')
  })

  it('produces correct event types for decision', () => {
    const raw = {
      id: 1003,
      date: '2026-05-01T00:00:00Z',
      status: { long: 'Finished', short: 'finished' },
      league: { id: 1, name: 'UFC', logo: '' },
      fighters: {
        home: { id: 101, name: 'Fighter A', logo: '' },
        away: { id: 102, name: 'Fighter B', logo: '' },
      },
      result: {
        winner: { id: 101, name: 'Fighter A' },
        method: 'Decision',
        round: 5,
      },
    }

    const result = normalizeMmaMatch(raw as never)
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('decision')
  })
})
