import { describe, it, expect } from 'vitest'
import { computeClock } from '../computeClock'
import type { Match } from '@/lib/types'

const baseMatch: Match = {
  id: 'test-1',
  sport: 'football',
  homeTeam: { id: 'h1', name: 'Home', shortName: 'H', logo: '' },
  awayTeam: { id: 'a1', name: 'Away', shortName: 'A', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T14:00:00Z',
  league: { id: 'l1', name: 'Test League', country: 'XX', logo: '', color: '#000' },
  events: [],
  streamLinks: [],
}

describe('computeClock', () => {
  it('returns FT for finished matches', () => {
    const result = computeClock(baseMatch, Date.now())

    expect(result.formatted).toBe('Finalizado')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBeNull()
  })

  it('upcoming match >1h shows hours and minutes', () => {
    const now = new Date('2026-05-01T11:30:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('En 2h 30m')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBe(150)
  })

  it('upcoming match <1h shows minutes only', () => {
    const now = new Date('2026-05-01T13:55:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('En 5m')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBe(5)
  })

  it('upcoming match <1m shows En 1m', () => {
    const now = new Date('2026-05-01T13:59:30Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('En 1m')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBe(1)
  })

  it('upcoming match at start time shows Retrasado', () => {
    const now = new Date('2026-05-01T14:00:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Retrasado')
    expect(result.isDelayed).toBe(true)
    expect(result.countdownMinutes).toBeNull()
  })

  it('delayed match <3h shows Retrasado', () => {
    const now = new Date('2026-05-01T15:00:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Retrasado')
    expect(result.isDelayed).toBe(true)
    expect(result.countdownMinutes).toBeNull()
  })

  it('suspended match >3h shows Suspendido', () => {
    const now = new Date('2026-05-01T18:00:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Suspendido')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBeNull()
  })

  it('live match shows server minute when lastFetchTimestamp equals now', () => {
    const now = new Date('2026-05-01T14:45:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 45,
    }

    const result = computeClock(match, now, now)

    expect(result.formatted).toBe("45'")
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBeNull()
  })

  it('live match stays same minute when less than 60s passed', () => {
    const lastFetch = new Date('2026-05-01T14:45:00Z').getTime()
    const now = new Date('2026-05-01T14:45:30Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 45,
    }

    const result = computeClock(match, now, lastFetch)

    expect(result.formatted).toBe("45'")
  })

  it('live match advances by one minute after 90s', () => {
    const lastFetch = new Date('2026-05-01T14:45:00Z').getTime()
    const now = new Date('2026-05-01T14:46:30Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 45,
    }

    const result = computeClock(match, now, lastFetch)

    expect(result.formatted).toBe("46'")
  })

  it('live match without lastFetchTimestamp uses match minute', () => {
    const now = new Date('2026-05-01T14:23:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 45,
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe("45'")
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBeNull()
  })

  it('live match minute=67 without lastFetchTimestamp displays 67', () => {
    const now = new Date('2026-05-01T14:30:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 67,
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe("67'")
  })

  it('live match minute=undefined without lastFetchTimestamp displays 0', () => {
    const now = new Date('2026-05-01T14:23:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe("0'")
  })

  it('live match WITH lastFetchTimestamp still uses formula', () => {
    const lastFetch = new Date('2026-05-01T14:45:00Z').getTime()
    const now = new Date('2026-05-01T14:46:30Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 45,
    }

    const result = computeClock(match, now, lastFetch)

    expect(result.formatted).toBe("46'")
  })

  it('invalid startTime returns placeholder for upcoming', () => {
    const now = Date.now()
    const match: Match = {
      ...baseMatch,
      status: 'upcoming',
      startTime: '',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('--:--')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBeNull()
  })

  it('invalid startTime returns placeholder for live', () => {
    const now = Date.now()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('--:--')
    expect(result.isDelayed).toBe(false)
    expect(result.countdownMinutes).toBeNull()
  })

  it('HT statusDetail shows "Entretiempo"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'HT',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Entretiempo')
  })

  it('ET statusDetail with minute shows "Tiempo Extra 105\'"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'ET',
      startTime: '2026-05-01T14:00:00Z',
      minute: 105,
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe("Tiempo Extra 105'")
  })

  it('ET statusDetail without minute shows "Tiempo Extra"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'ET',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Tiempo Extra')
  })

  it('BT statusDetail shows "Descanso"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'BT',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Descanso')
  })

  it('INT statusDetail shows "Interrumpido"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'INT',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Interrumpido')
  })

  it('SUSP statusDetail shows "Suspendido"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'SUSP',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Suspendido')
  })

  it('P statusDetail shows "Penales"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'P',
      startTime: '2026-05-01T14:00:00Z',
    }

    const result = computeClock(match, now)

    expect(result.formatted).toBe('Penales')
  })

  it('1H statusDetail with minute shows normal display like "23\'"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: '1H',
      startTime: '2026-05-01T14:00:00Z',
      minute: 23,
    }

    const result = computeClock(match, now, now)

    expect(result.formatted).toBe("23'")
  })

  it('2H statusDetail with minute shows normal display like "67\'"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: '2H',
      startTime: '2026-05-01T14:00:00Z',
      minute: 67,
    }

    const result = computeClock(match, now, now)

    expect(result.formatted).toBe("67'")
  })

  it('LIVE statusDetail with minute shows normal display like "34\'"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      statusDetail: 'LIVE',
      startTime: '2026-05-01T14:00:00Z',
      minute: 34,
    }

    const result = computeClock(match, now, now)

    expect(result.formatted).toBe("34'")
  })

  it('undefined statusDetail with minute shows normal display like "67\'"', () => {
    const now = new Date('2026-05-01T14:46:00Z').getTime()
    const match: Match = {
      ...baseMatch,
      status: 'live',
      startTime: '2026-05-01T14:00:00Z',
      minute: 67,
    }

    const result = computeClock(match, now, now)

    expect(result.formatted).toBe("67'")
  })
})
