import { describe, it, expect } from 'vitest'
import { normalizeMmaMatch } from '../mma'

interface RawMmaFixture {
  id: number
  date: string
  time?: string
  status: { long: string; short: string }
  league: { id: number; name: string; logo: string }
  fighters?: {
    home: { id: number; name: string; logo: string; nickname?: string }
    away: { id: number; name: string; logo: string; nickname?: string }
  }
  result?: {
    winner?: { id: number; name: string }
    method?: string
    round?: number
    time?: string
  }
}

function makeRaw(overrides: Partial<RawMmaFixture> = {}): RawMmaFixture {
  return {
    id: 1001,
    date: '2026-05-01T00:00:00Z',
    status: { long: 'Finished', short: 'finished' },
    league: { id: 1, name: 'UFC', logo: '' },
    fighters: {
      home: { id: 101, name: 'Fighter A', logo: '' },
      away: { id: 102, name: 'Fighter B', logo: '' },
    },
    ...overrides,
  }
}

describe('normalizeMmaMatch', () => {
  it('maps status.short FT to finished', () => {
    const raw = makeRaw({ status: { long: 'Finished', short: 'FT' } })
    const result = normalizeMmaMatch(raw as never)
    expect(result.status).toBe('finished')
  })

  it('maps status.short 1R to live', () => {
    const raw = makeRaw({
      status: { long: 'Round 1', short: '1R' },
      result: { winner: { id: 101, name: 'Fighter A' }, method: 'KO', round: 1, time: '1:23' },
    })
    const result = normalizeMmaMatch(raw as never)
    expect(result.status).toBe('live')
  })

  it('derives home/away names from fighters.home / fighters.away', () => {
    const raw = makeRaw({
      fighters: {
        home: { id: 101, name: 'Islam Makhachev', logo: '', nickname: 'The Eagle' },
        away: { id: 102, name: 'Dustin Poirier', logo: '', nickname: 'The Diamond' },
      },
    })
    const result = normalizeMmaMatch(raw as never)
    expect(result.homeTeam.name).toBe('Islam Makhachev')
    expect(result.awayTeam.name).toBe('Dustin Poirier')
  })
})
