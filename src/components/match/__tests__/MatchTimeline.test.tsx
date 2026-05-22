import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchTimeline } from '../MatchTimeline'
import { FOOTBALL_CONFIG, BASKETBALL_CONFIG, MMA_CONFIG } from '@/lib/types'
import type { MatchEvent } from '@/lib/types'

describe('MatchTimeline', () => {
  it('groups football events into first half / second half', () => {
    const events: MatchEvent[] = [
      { type: 'goal', minute: 23, player: 'Saka', team: 'home' },
      { type: 'goal', minute: 52, player: 'Son', team: 'away' },
      { type: 'yellow_card', minute: 34, player: 'Caicedo', team: 'away' },
      { type: 'goal', minute: 78, player: 'Kane', team: 'home' },
    ]
    render(<MatchTimeline events={events} sportConfig={FOOTBALL_CONFIG} />)

    expect(screen.getByText('Primera Parte')).toBeDefined()
    expect(screen.getByText('Segunda Parte')).toBeDefined()
    expect(screen.getByText('Saka')).toBeDefined()
    expect(screen.getByText('Son')).toBeDefined()
    expect(screen.getByText('Kane')).toBeDefined()
  })

  it('groups basketball events into Q1-Q4 by minute', () => {
    const events: MatchEvent[] = [
      { type: 'two_points', minute: 5, player: 'LeBron', team: 'home' },
      { type: 'three_points', minute: 15, player: 'Curry', team: 'away' },
      { type: 'free_throw', minute: 25, player: 'Davis', team: 'home' },
      { type: 'foul', minute: 40, player: 'Green', team: 'away' },
    ]
    render(<MatchTimeline events={events} sportConfig={BASKETBALL_CONFIG} />)

    expect(screen.getByText('Q1')).toBeDefined()
    expect(screen.getByText('Q2')).toBeDefined()
    expect(screen.getByText('Q3')).toBeDefined()
    expect(screen.getByText('Q4')).toBeDefined()
  })

  it('shows empty state message when no events', () => {
    render(<MatchTimeline events={[]} sportConfig={FOOTBALL_CONFIG} />)

    expect(screen.getByText('No hay eventos en este partido')).toBeDefined()
  })

  it('renders MMA events with correct icons from MMA_CONFIG', () => {
    const events: MatchEvent[] = [
      { type: 'knockout', minute: 5, player: 'Pereira', team: 'home', comment: 'Knockout - Round 1' },
      { type: 'submission', minute: 15, player: 'Oliveira', team: 'home', comment: 'Submission - Round 3' },
    ]
    render(<MatchTimeline events={events} sportConfig={MMA_CONFIG} />)

    expect(screen.getByText('Knockout')).toBeDefined()
    expect(screen.getByText('Submission')).toBeDefined()
    expect(screen.getByText('Pereira')).toBeDefined()
    expect(screen.getByText('Oliveira')).toBeDefined()
  })
})
