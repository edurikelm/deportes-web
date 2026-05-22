import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDisplay } from '../ScoreDisplay'
import { FOOTBALL_CONFIG, BASKETBALL_CONFIG, MMA_CONFIG } from '@/lib/types'
import type { Match } from '@/lib/types'

const basketballMatch: Match = {
  id: 'b1',
  sport: 'basketball',
  homeTeam: {
    id: 'h1', name: 'Lakers', shortName: 'LAL',
    logo: 'https://example.com/lakers.png',
  },
  awayTeam: {
    id: 'a1', name: 'Celtics', shortName: 'BOS',
    logo: 'https://example.com/celtics.png',
  },
  status: 'finished',
  startTime: '2026-05-01T00:00:00Z',
  minute: 48,
  league: {
    id: 'nba', name: 'NBA', country: 'USA',
    logo: '', color: '#1D428A',
  },
  score: {
    home: 112,
    away: 118,
    quarters: [
      { home: 28, away: 30 },
      { home: 24, away: 29 },
      { home: 32, away: 28 },
      { home: 28, away: 31 },
    ],
  },
  events: [],
  streamLinks: [],
}

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

const mmaMatch: Match = {
  id: 'mma1',
  sport: 'mma',
  homeTeam: { id: '101', name: 'Pereira', shortName: 'AP', logo: '' },
  awayTeam: { id: '102', name: 'Hill', shortName: 'JH', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T00:00:00Z',
  minute: 25,
  league: { id: 'mma1', name: 'UFC', country: 'USA', logo: '', color: '#B90000' },
  score: { home: 1, away: 0 },
  events: [],
  streamLinks: [],
}

const upcomingMatch: Match = {
  id: 'f3',
  sport: 'football',
  homeTeam: { id: '3', name: 'Bayern', shortName: 'BAY', logo: '' },
  awayTeam: { id: '4', name: 'Dortmund', shortName: 'DOR', logo: '' },
  status: 'upcoming',
  startTime: '2026-05-02T18:30:00Z',
  league: { id: '3', name: 'Bundesliga', country: 'Germany', logo: '', color: '#e20000' },
  events: [],
  streamLinks: [],
}

describe('ScoreDisplay', () => {
  it('renders basketball quarter scores correctly', () => {
    render(<ScoreDisplay match={basketballMatch} sportConfig={BASKETBALL_CONFIG} />)

    expect(screen.getByText('112')).toBeDefined()
    expect(screen.getByText('118')).toBeDefined()
    expect(screen.getByText('Q1 28-30')).toBeDefined()
    expect(screen.getByText('Q2 24-29')).toBeDefined()
  })

  it('renders live football match scores with HT', () => {
    render(<ScoreDisplay match={footballMatch} sportConfig={FOOTBALL_CONFIG} />)

    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('HT 1 - 0')).toBeDefined()
    expect(screen.getByText("67'")).toBeDefined()
  })

  it('renders MMA match score as win/loss 1-0', () => {
    render(<ScoreDisplay match={mmaMatch} sportConfig={MMA_CONFIG} />)

    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('0')).toBeDefined()
  })

  it('renders upcoming match with vs and start time', () => {
    render(<ScoreDisplay match={upcomingMatch} sportConfig={FOOTBALL_CONFIG} />)

    expect(screen.getByText('vs')).toBeDefined()
  })

  it('renders finished match with FT badge', () => {
    render(<ScoreDisplay match={basketballMatch} sportConfig={BASKETBALL_CONFIG} />)

    expect(screen.getByText('FT')).toBeDefined()
  })
})
