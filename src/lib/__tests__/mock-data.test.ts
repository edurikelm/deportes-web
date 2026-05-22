import { describe, it, expect } from 'vitest'
import { MOCK_MATCHES, MOCK_BASKETBALL_MATCHES, MOCK_MMA_MATCHES } from '../mock-data'
import type { MatchEventType } from '../types'

describe('mock-data', () => {
  it('exports matches for all 3 sports', () => {
    expect(MOCK_MATCHES.length).toBeGreaterThan(0)
    expect(MOCK_MATCHES.some(m => m.sport === 'football')).toBe(true)

    expect(MOCK_BASKETBALL_MATCHES.length).toBeGreaterThan(0)
    expect(MOCK_BASKETBALL_MATCHES.every(m => m.sport === 'basketball')).toBe(true)

    expect(MOCK_MMA_MATCHES.length).toBeGreaterThan(0)
    expect(MOCK_MMA_MATCHES.every(m => m.sport === 'mma')).toBe(true)
  })

  it('all mock match event types are valid MatchEventType values', () => {
    const validTypes = new Set<MatchEventType>([
      'goal', 'own_goal', 'penalty', 'missed_penalty', 'yellow_card', 'red_card',
      'subst', 'two_points', 'three_points', 'free_throw', 'foul', 'timeout',
      'turnover', 'triple', 'two_pointer', 'freethrow', 'assist', 'rebound',
      'block', 'steal', 'start', 'end', 'jump_ball', 'substitution',
      'knockout', 'submission', 'tko', 'decision', 'round',
    ])

    const allMatches = [...MOCK_MATCHES, ...MOCK_BASKETBALL_MATCHES, ...MOCK_MMA_MATCHES]

    for (const match of allMatches) {
      for (const event of match.events) {
        expect(
          validTypes.has(event.type as MatchEventType),
          `Invalid event type "${event.type}" in match ${match.id}`
        ).toBe(true)
      }
    }
  })
})
