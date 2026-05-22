import { describe, it, expect } from 'vitest'
import { normalizeBasketballMatch } from '../basketball'

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
