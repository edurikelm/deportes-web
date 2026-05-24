import { describe, it, expect } from 'vitest'
import { normalizeMatch } from '../normalizer'
import type { ApiFootballMatch } from '../types'

function makeRaw(overrides: Partial<ApiFootballMatch> = {}): ApiFootballMatch {
  return {
    id: 1,
    tournament: { id: 1, name: 'Premier League', slug: 'premier-league', country: 'England', logo: '' },
    homeTeam: { id: 10, name: 'Arsenal', shortName: 'ARS', logo: '' },
    awayTeam: { id: 20, name: 'Chelsea', shortName: 'CHE', logo: '' },
    startTime: '2026-05-01T14:00:00Z',
    status: { code: 'TBD', description: '' },
    score: null as unknown as undefined,
    events: [],
    streamLinks: [],
    ...overrides,
  }
}

describe('normalizeMatch', () => {
  it('normalizes status code 1H to live', () => {
    const raw = makeRaw({ status: { code: '1H', description: 'First Half' } })
    const result = normalizeMatch(raw)
    expect(result.status).toBe('live')
  })

  it('normalizes status code FT to finished', () => {
    const raw = makeRaw({ status: { code: 'FT', description: 'Match Finished' } })
    const result = normalizeMatch(raw)
    expect(result.status).toBe('finished')
  })

  it('normalizes status code TBD to upcoming', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    const raw = makeRaw({ startTime: future, status: { code: 'TBD', description: 'Not Started' } })
    const result = normalizeMatch(raw)
    expect(result.status).toBe('upcoming')
  })

  it('sets minute from status.elapsed and statusDetail from status.code when live (2H)', () => {
    const raw = makeRaw({ status: { code: '2H', description: 'Second Half', elapsed: 67 } })
    const result = normalizeMatch(raw)
    expect(result.minute).toBe(67)
    expect(result.statusDetail).toBe('2H')
  })

  it('handles elapsed=null (HT) — minute undefined, statusDetail present', () => {
    const raw = makeRaw({ status: { code: 'HT', description: 'Halftime', elapsed: null } })
    const result = normalizeMatch(raw)
    expect(result.minute).toBeUndefined()
    expect(result.statusDetail).toBe('HT')
  })

  it('sets score { home, away } for finished match', () => {
    const raw = makeRaw({
      status: { code: 'FT', description: 'Match Finished' },
      score: { home: 2, away: 1, ht: { home: 1, away: 0 } },
    })
    const result = normalizeMatch(raw)
    expect(result.score).toEqual({ home: 2, away: 1, ht: { home: 1, away: 0 } })
  })

  it('sets score undefined for upcoming match with null raw score', () => {
    const future = new Date(Date.now() + 86400000).toISOString()
    const raw = makeRaw({
      startTime: future,
      status: { code: 'TBD', description: 'Not Started' },
      score: null as unknown as undefined,
    })
    const result = normalizeMatch(raw)
    expect(result.score).toBeUndefined()
  })

  it('normalizes events with correct types: goal, yellow_card, red_card, subst', () => {
    const raw = makeRaw({
      status: { code: 'FT', description: 'Match Finished' },
      score: { home: 3, away: 0 },
      events: [
        { id: 'e1', type: 'goal', time: 23, player: { name: 'Saka' }, team: { id: 10 }, assist: { name: 'Odegaard' }, comment: '' },
        { id: 'e2', type: 'goal', time: 45, player: { name: 'Martinelli' }, team: { id: 10 }, comment: '' },
        { id: 'e3', type: 'goal', time: 67, player: { name: 'Havertz' }, team: { id: 10 }, comment: '' },
        { id: 'e4', type: 'yellow_card', time: 30, player: { name: 'Caicedo' }, team: { id: 20 }, comment: '' },
        { id: 'e5', type: 'red_card', time: 80, player: { name: 'Fernandez' }, team: { id: 20 }, comment: '' },
        { id: 'e6', type: 'substitution', time: 55, player: { name: 'Trossard' }, team: { id: 10 }, comment: '' },
      ],
    })
    const result = normalizeMatch(raw)
    const types = result.events.map(e => e.type)
    expect(types).toContain('goal')
    expect(types).toContain('yellow_card')
    expect(types).toContain('red_card')
    expect(types).toContain('subst')
  })

  it('normalizes stream links: tv stays tv, anything else becomes stream', () => {
    const raw = makeRaw({
      status: { code: 'FT', description: 'Match Finished' },
      score: { home: 1, away: 0 },
      streamLinks: [
        { id: 's1', streamType: 'tv', name: 'Sky Sports', link: 'https://sky.com' },
        { id: 's2', streamType: 'stream', name: 'ESPN', link: 'https://espn.com' },
        { id: 's3', streamType: 'other', name: 'Unknown', link: 'https://example.com' },
      ],
    })
    const result = normalizeMatch(raw)
    expect(result.streamLinks[0].type).toBe('tv')
    expect(result.streamLinks[1].type).toBe('stream')
    expect(result.streamLinks[2].type).toBe('stream')
  })

  it('assigns away team events correctly (bug regression test)', () => {
    const raw = makeRaw({
      status: { code: 'FT', description: 'Match Finished' },
      score: { home: 0, away: 1 },
      events: [
        { id: 'e1', type: 'goal', time: 78, player: { name: 'Jackson' }, team: { id: 20 }, comment: '' },
      ],
    })
    const result = normalizeMatch(raw)
    expect(result.events[0].team).toBe('away')
  })
})
