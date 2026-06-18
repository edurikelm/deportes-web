import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CompactFloatingScoreboard } from '../CompactFloatingScoreboard'
import type { Match } from '@/lib/types'

const footballLive: Match = {
  id: 'f1',
  sport: 'football',
  homeTeam: { id: '1', name: 'Arsenal', logo: '' },
  awayTeam: { id: '2', name: 'Chelsea', logo: '' },
  status: 'live',
  startTime: '2026-05-01T14:00:00Z',
  minute: 67,
  league: { id: '1', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
  score: { home: 2, away: 1 },
  events: [
    { type: 'goal', minute: 23, player: 'Saka', team: 'home' },
    { type: 'yellow_card', minute: 30, player: 'Caicedo', team: 'away' },
    { type: 'goal', minute: 38, player: 'Palmer', team: 'away' },
    { type: 'goal', minute: 44, player: 'Martinelli', team: 'home' },
  ],
  streamLinks: [],
}

const footballFinished: Match = {
  id: 'f2',
  sport: 'football',
  homeTeam: { id: '3', name: 'AC Milan', logo: '' },
  awayTeam: { id: '4', name: 'Inter Milan', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T12:00:00Z',
  league: { id: '2', name: 'Serie A', country: 'Italy', logo: '', color: '#024f8d' },
  score: { home: 0, away: 2 },
  events: [
    { type: 'goal', minute: 35, player: 'Lautaro Martinez', team: 'away' },
    { type: 'goal', minute: 78, player: 'Thuram', team: 'away' },
  ],
  streamLinks: [],
}

const basketballLive: Match = {
  id: 'b1',
  sport: 'basketball',
  homeTeam: { id: 'b1', name: 'Lakers', logo: '' },
  awayTeam: { id: 'b2', name: 'Celtics', logo: '' },
  status: 'live',
  startTime: '2026-05-01T19:30:00Z',
  minute: 8,
  league: { id: 'b1', name: 'NBA', country: 'USA', logo: '', color: '#1D428A' },
  score: { home: 28, away: 24 },
  events: [
    { type: 'three_points', minute: 4, player: 'Stephen Curry', team: 'home' },
    { type: 'foul', minute: 6, player: 'Jaylen Brown', team: 'away' },
  ],
  streamLinks: [],
}

const mmaFinished: Match = {
  id: 'mma1',
  sport: 'mma',
  homeTeam: { id: 'm1', name: 'Alex Pereira', logo: '' },
  awayTeam: { id: 'm2', name: 'Jamahal Hill', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T20:00:00Z',
  league: { id: 'm1', name: 'UFC', country: 'USA', logo: '', color: '#B90000' },
  score: { home: 1, away: 0 },
  events: [
    { type: 'knockout', minute: 5, player: 'Alex Pereira', team: 'home' },
  ],
  streamLinks: [],
}

const matchWithNoEvents: Match = {
  ...footballLive,
  id: 'f3',
  events: [],
}

const matchWithOnlyNonScoreEvents: Match = {
  ...footballLive,
  id: 'f4',
  events: [
    { type: 'yellow_card', minute: 20, player: 'Rice', team: 'home' },
    { type: 'red_card', minute: 55, player: 'Fernandes', team: 'away' },
    { type: 'subst', minute: 60, player: 'Jesus', team: 'home' },
  ],
}

describe('CompactFloatingScoreboard', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders league name and country', () => {
    render(<CompactFloatingScoreboard match={footballLive} lastUpdated={null} />)
    expect(screen.getByText(/Premier League/)).toBeDefined()
    expect(screen.getByText(/England/)).toBeDefined()
  })

  it('renders home team, away team, and score', () => {
    render(<CompactFloatingScoreboard match={footballLive} lastUpdated={null} />)
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('Chelsea')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
  })

  it('renders live clock with minute', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T15:07:00Z'))
    render(<CompactFloatingScoreboard match={footballLive} lastUpdated={null} />)
    expect(screen.getByText("67'")).toBeDefined()
  })

  it("shows FT for finished matches", () => {
    render(<CompactFloatingScoreboard match={footballFinished} lastUpdated={null} />)
    expect(screen.getByText('FT')).toBeDefined()
  })

  it('renders latest score-relevant event at bottom', () => {
    render(<CompactFloatingScoreboard match={footballLive} lastUpdated={null} />)
    expect(screen.getByText(/Martinelli/)).toBeDefined()
    expect(screen.getByText(/44'/)).toBeDefined()
  })

  it('shows "Actualizado" fallback when no score events exist', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T15:07:00Z'))
    render(<CompactFloatingScoreboard match={matchWithNoEvents} lastUpdated={null} />)
    expect(screen.getByText(/Actualizado/)).toBeDefined()
  })

  it('shows "Actualizado" with custom lastUpdated time', () => {
    const customTime = new Date('2026-05-01T15:30:00Z')
    render(<CompactFloatingScoreboard match={matchWithNoEvents} lastUpdated={customTime} />)
    expect(screen.getByText(/Actualizado/)).toBeDefined()
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeDefined()
  })

  it('filters out non-score events like cards and substitutions', () => {
    render(<CompactFloatingScoreboard match={matchWithOnlyNonScoreEvents} lastUpdated={null} />)
    expect(screen.getByText(/Actualizado/)).toBeDefined()
    expect(screen.queryByText(/yellow_card/)).toBeNull()
    expect(screen.queryByText(/red_card/)).toBeNull()
  })

  it('renders basketball score events', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-01T19:38:00Z'))
    render(<CompactFloatingScoreboard match={basketballLive} lastUpdated={null} />)
    expect(screen.getByText(/Stephen Curry/)).toBeDefined()
    expect(screen.getByText(/NBA/)).toBeDefined()
    expect(screen.getByText(/USA/)).toBeDefined()
  })

  it('renders MMA finished match with knockout event', () => {
    render(<CompactFloatingScoreboard match={mmaFinished} lastUpdated={null} />)
    expect(screen.getAllByText(/Alex Pereira/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('FT')).toBeDefined()
    expect(screen.getByText(/UFC/)).toBeDefined()
  })

  it('pulses score when score changes', async () => {
    const { rerender } = render(
      <CompactFloatingScoreboard match={footballLive} lastUpdated={null} />
    )
    const updatedMatch: Match = {
      ...footballLive,
      score: { home: 3, away: 1 },
      events: [
        ...footballLive.events,
        { type: 'goal', minute: 75, player: 'Saka', team: 'home' },
      ],
    }
    rerender(<CompactFloatingScoreboard match={updatedMatch} lastUpdated={null} />)
    await waitFor(() => {
      const scoreElements = screen.getAllByText(/^[0-9]+$/)
      const hasAmber = Array.from(scoreElements).some(
        (el) => /\btext-.?\[#fbbf24\]/.test(el.getAttribute('class') ?? '')
      )
      expect(hasAmber).toBe(true)
    })
  })
})
