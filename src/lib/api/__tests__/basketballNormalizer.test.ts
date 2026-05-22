import { describe, it, expect } from 'vitest'
import { normalizeBasketballMatch } from '../basketball'

interface RawBasketballFixture {
  id: number
  date: { start: string }
  status: { clock: string | null; halftime: boolean; short: number; long: string }
  periods: { current: number; total: number }
  league: string
  teams: {
    visitors: { id: number; name: string; nickname: string; code: string; logo: string }
    home: { id: number; name: string; nickname: string; code: string; logo: string }
  }
  scores: {
    visitors: { win: number; loss: number; linescore: string[]; points: number | null }
    home: { win: number; loss: number; linescore: string[]; points: number | null }
  }
}

function makeRaw(overrides: Partial<RawBasketballFixture> = {}): RawBasketballFixture {
  return {
    id: 12345,
    date: { start: '2026-05-01T00:00:00Z' },
    status: { clock: null, halftime: false, short: 3, long: 'Finished' },
    periods: { current: 4, total: 4 },
    league: 'NBA',
    teams: {
      visitors: { id: 1, name: 'Celtics', nickname: 'Celtics', code: 'BOS', logo: '' },
      home: { id: 2, name: 'Lakers', nickname: 'Lakers', code: 'LAL', logo: '' },
    },
    scores: {
      visitors: { win: 0, loss: 0, linescore: ['30', '29', '28', '31'], points: 118 },
      home: { win: 0, loss: 0, linescore: ['28', '24', '32', '28'], points: 112 },
    },
    ...overrides,
  }
}

describe('normalizeBasketballMatch', () => {
  it('maps status.short === 3 to finished', () => {
    const raw = makeRaw({ status: { clock: null, halftime: false, short: 3, long: 'Finished' } })
    const result = normalizeBasketballMatch(raw as never)
    expect(result.status).toBe('finished')
  })

  it('maps status.short === 2 to live', () => {
    const raw = makeRaw({ status: { clock: null, halftime: false, short: 2, long: 'In Play' } })
    const result = normalizeBasketballMatch(raw as never)
    expect(result.status).toBe('live')
  })

  it('maps status.short === 1 to upcoming', () => {
    const raw = makeRaw({ status: { clock: null, halftime: false, short: 1, long: 'Not Started' } })
    const result = normalizeBasketballMatch(raw as never)
    expect(result.status).toBe('upcoming')
  })

  it('sets minute to periods.current for live matches', () => {
    const raw = makeRaw({
      status: { clock: null, halftime: false, short: 2, long: 'In Play' },
      periods: { current: 3, total: 4 },
    })
    const result = normalizeBasketballMatch(raw as never)
    expect(result.minute).toBe(3)
  })

  it('derives home/away team names from teams.home/teams.visitors', () => {
    const raw = makeRaw()
    const result = normalizeBasketballMatch(raw as never)
    expect(result.homeTeam.name).toBe('Lakers')
    expect(result.awayTeam.name).toBe('Celtics')
  })

  it('hardcodes league to NBA', () => {
    const raw = makeRaw()
    const result = normalizeBasketballMatch(raw as never)
    expect(result.league.name).toBe('NBA')
    expect(result.league.id).toBe('nba')
  })
})
