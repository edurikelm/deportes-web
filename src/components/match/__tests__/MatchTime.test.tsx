import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchTime } from '../MatchTime'
import { MatchClockProvider } from '../MatchClockContext'
import type { Match } from '@/lib/types'

const footballMatch: Match = {
  id: 'f1',
  sport: 'football',
  homeTeam: { id: '1', name: 'Arsenal', shortName: 'ARS', logo: '' },
  awayTeam: { id: '2', name: 'Chelsea', shortName: 'CHE', logo: '' },
  status: 'live',
  startTime: '2026-05-01T14:00:00Z',
  minute: 67,
  league: { id: '1', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
  score: { home: 2, away: 1, ht: { home: 1, away: 0 } },
  events: [],
  streamLinks: [],
}

const upcomingMatch: Match = {
  id: 'u1',
  sport: 'football',
  homeTeam: { id: '3', name: 'Bayern', shortName: 'BAY', logo: '' },
  awayTeam: { id: '4', name: 'Dortmund', shortName: 'DOR', logo: '' },
  status: 'upcoming',
  startTime: '2026-05-02T18:30:00Z',
  league: { id: '3', name: 'Bundesliga', country: 'Germany', logo: '', color: '#e20000' },
  events: [],
  streamLinks: [],
}

const finishedMatch: Match = {
  id: 'fin1',
  sport: 'football',
  homeTeam: { id: '5', name: 'Real Madrid', shortName: 'RMA', logo: '' },
  awayTeam: { id: '6', name: 'Barcelona', shortName: 'FCB', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T20:00:00Z',
  minute: 90,
  league: { id: '4', name: 'La Liga', country: 'Spain', logo: '', color: '#ee8707' },
  score: { home: 3, away: 2 },
  events: [],
  streamLinks: [],
}

describe('MatchTime', () => {
  it('renders live match minute', () => {
    const now = Date.now()
    render(
      <MatchClockProvider lastFetchTimestamp={now}>
        <MatchTime match={footballMatch} />
      </MatchClockProvider>
    )

    const el = screen.getByText(/'\s*$/)
    expect(el).toBeDefined()
  })

  it('renders upcoming countdown', () => {
    const futureTime = new Date(Date.now() + 45 * 60000).toISOString()
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <MatchTime match={{ ...upcomingMatch, startTime: futureTime }} />
      </MatchClockProvider>
    )

    const el = screen.getByText(/^En \d+m$/)
    expect(el).toBeDefined()
  })

  it('renders Finalizado for finished match', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <MatchTime match={finishedMatch} />
      </MatchClockProvider>
    )

    expect(screen.getByText('Finalizado')).toBeDefined()
  })

  it('applies className prop correctly', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <MatchTime match={finishedMatch} className="custom-class" />
      </MatchClockProvider>
    )

    const el = screen.getByText('Finalizado')
    expect(el.className).toContain('custom-class')
  })
})
