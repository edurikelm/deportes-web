import { describe, it, expect } from 'vitest'
import { normalizeMmaMatch, mapMmaEventType } from '../mma'

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
