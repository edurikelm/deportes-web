import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MatchRow } from '../MatchRow'
import { MatchClockProvider } from '../MatchClockContext'
import type { Match, Sport } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: Record<string, unknown>) => (
    <a href={href as string} className={className as string} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...rest }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} className={className as string} {...rest} />
  ),
}))

const footballMatch: Match = {
  id: 'f1',
  sport: 'football',
  homeTeam: { id: '1', name: 'Arsenal', shortName: 'ARS', logo: 'https://example.com/ars.png' },
  awayTeam: { id: '2', name: 'Chelsea', shortName: 'CHE', logo: 'https://example.com/che.png' },
  status: 'live',
  startTime: '2026-05-01T14:00:00Z',
  minute: 67,
  league: { id: '1', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
  score: { home: 2, away: 1, ht: { home: 1, away: 0 } },
  events: [],
  streamLinks: [{ type: 'tv', name: 'Sky Sports' }],
}

const finishedMatch: Match = {
  id: 'f2',
  sport: 'football',
  homeTeam: { id: '3', name: 'Real Madrid', shortName: 'RMA', logo: '' },
  awayTeam: { id: '4', name: 'Barcelona', shortName: 'BAR', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T20:00:00Z',
  league: { id: '2', name: 'La Liga', country: 'Spain', logo: '', color: '#ee8707' },
  score: { home: 3, away: 1 },
  events: [],
  streamLinks: [{ type: 'stream', name: 'ESPN' }],
}

const upcomingMatch: Match = {
  id: 'f3',
  sport: 'football',
  homeTeam: { id: '5', name: 'Bayern', shortName: 'BAY', logo: '' },
  awayTeam: { id: '6', name: 'Dortmund', shortName: 'DOR', logo: '' },
  status: 'upcoming',
  startTime: '2026-05-02T18:30:00Z',
  league: { id: '3', name: 'Bundesliga', country: 'Germany', logo: '', color: '#e20000' },
  events: [],
  streamLinks: [],
}

const basketballMatch: Match = {
  id: 'b1',
  sport: 'basketball',
  homeTeam: { id: 'b1', name: 'Lakers', shortName: 'LAL', logo: '' },
  awayTeam: { id: 'b2', name: 'Celtics', shortName: 'BOS', logo: '' },
  status: 'live',
  startTime: '2026-05-01T19:30:00Z',
  minute: 3,
  league: { id: 'b1', name: 'NBA', country: 'USA', logo: '', color: '#1D428A' },
  score: { home: 15, away: 12, quarters: [{ home: 15, away: 12 }] },
  events: [],
  streamLinks: [],
}

const mmaKO: Match = {
  id: 'mma1',
  sport: 'mma',
  homeTeam: { id: 'm1', name: 'Pereira', shortName: 'PEREIRA', logo: '' },
  awayTeam: { id: 'm2', name: 'Hill', shortName: 'HILL', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T20:00:00Z',
  league: { id: 'mma1', name: 'UFC', country: 'USA', logo: '', color: '#B90000' },
  score: { home: 1, away: 0 },
  events: [{ type: 'knockout', minute: 5, player: 'Pereira', team: 'home', comment: 'Knockout - Round 1 at 2:35' }],
  streamLinks: [],
}

const mmaSUB: Match = {
  id: 'mma2',
  sport: 'mma',
  homeTeam: { id: 'm3', name: 'Oliveira', shortName: 'OLIVEIRA', logo: '' },
  awayTeam: { id: 'm4', name: 'Tsarukyan', shortName: 'TSARUKYAN', logo: '' },
  status: 'finished',
  startTime: '2026-05-01T18:00:00Z',
  league: { id: 'mma1', name: 'UFC', country: 'USA', logo: '', color: '#B90000' },
  score: { home: 1, away: 0 },
  events: [{ type: 'submission', minute: 3, player: 'Oliveira', team: 'home', comment: 'Submission - Round 3 at 4:12 (Rear Naked Choke)' }],
  streamLinks: [],
}

const mmaUpcoming: Match = {
  id: 'mma3',
  sport: 'mma',
  homeTeam: { id: 'm5', name: 'Pena', shortName: 'PENA', logo: '' },
  awayTeam: { id: 'm6', name: 'Nunes', shortName: 'NUNES', logo: '' },
  status: 'upcoming',
  startTime: '2026-05-02T02:00:00Z',
  league: { id: 'mma1', name: 'UFC', country: 'USA', logo: '', color: '#B90000' },
  score: undefined,
  events: [],
  streamLinks: [],
}

function renderMatchRow(match: Match, sport: Sport) {
  return render(
    <MatchClockProvider lastFetchTimestamp={undefined}>
      <MatchRow match={match} sport={sport} />
    </MatchClockProvider>
  )
}

describe('MatchRow', () => {
  it('renders home and away team names', () => {
    renderMatchRow(footballMatch, 'football')
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('Chelsea')).toBeDefined()
  })

  it('renders score in monospace font for live matches', () => {
    renderMatchRow(footballMatch, 'football')
    const scoreEl = screen.getByText('2 - 1')
    expect(scoreEl).toBeDefined()
    expect(scoreEl.className).toContain('font-mono')
    expect(scoreEl.className).toContain('font-bold')
  })

  it('uses compact table columns instead of stretching score across the full viewport', () => {
    renderMatchRow(footballMatch, 'football')
    const row = screen.getByRole('link')
    expect(row.className).toContain('grid')
    expect(row.className).toContain('grid-cols-[84px_minmax(0,1fr)_72px_minmax(0,1fr)]')
    expect(row.className).toContain('sm:grid-cols-[116px_minmax(0,1fr)_96px_minmax(0,1fr)]')
  })

  it('renders live status indicator with red pulsing dot and minute', () => {
    renderMatchRow(footballMatch, 'football')
    const minuteEl = screen.getByText(/'\s*$/)
    expect(minuteEl).toBeDefined()
    expect(minuteEl.className).toContain('font-mono')
    expect(minuteEl.className).toContain('text-[#ef4444]')
    const redDots = document.querySelectorAll('.bg-\\[\\#ef4444\\]')
    expect(redDots.length).toBeGreaterThan(0)
  })

  it('renders finished status indicator with green Finalizado badge', () => {
    renderMatchRow(finishedMatch, 'football')
    const ftEl = screen.getByText('Finalizado')
    expect(ftEl).toBeDefined()
    expect(ftEl.className).toContain('text-[#22c55e]')
  })

  it('renders upcoming status indicator with time', () => {
    renderMatchRow(upcomingMatch, 'football')
    const timeEl = screen.getByText(/\d{2}:\d{2}/)
    expect(timeEl).toBeDefined()
    expect(timeEl.className).toContain('text-[#8a8a8a]')
  })

  it('renders second line for live football with HT score and stream links', () => {
    renderMatchRow(footballMatch, 'football')
    expect(screen.getByText(/HT: 1-0/)).toBeDefined()
    expect(screen.getByText(/Sky Sports/)).toBeDefined()
  })

  it('renders second line for finished football with FT and stream links', () => {
    renderMatchRow(finishedMatch, 'football')
    expect(screen.getByText(/FT · ESPN/)).toBeDefined()
  })

  it('does not render second line for upcoming football', () => {
    renderMatchRow(upcomingMatch, 'football')
    expect(screen.queryByText(/HT:/)).toBeNull()
  })

  it('renders second line with quarters for live basketball', () => {
    renderMatchRow(basketballMatch, 'basketball')
    expect(screen.getByText(/Q1: 15-12/)).toBeDefined()
  })

  it('renders second line with KO method for finished MMA', () => {
    renderMatchRow(mmaKO, 'mma')
    expect(screen.getByText(/KO R1/)).toBeDefined()
  })

  it('renders second line with SUB method for finished MMA', () => {
    renderMatchRow(mmaSUB, 'mma')
    expect(screen.getByText(/SUB R3/)).toBeDefined()
  })

  it('does not render second line for upcoming MMA', () => {
    renderMatchRow(mmaUpcoming, 'mma')
    const secondLines = document.querySelectorAll('.pl-\\[40px\\]')
    expect(secondLines.length).toBe(0)
  })

  it('navigates to /match/[id] on click', () => {
    renderMatchRow(footballMatch, 'football')
    const link = screen.getByRole('link')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/match/f1')
  })

  it('renders home and away team logos as img tags', () => {
    renderMatchRow(footballMatch, 'football')
    const imgs = screen.getAllByRole('img')
    const homeLogo = imgs.find(img => img.getAttribute('alt') === 'Arsenal')
    const awayLogo = imgs.find(img => img.getAttribute('alt') === 'Chelsea')
    expect(homeLogo).toBeDefined()
    expect(awayLogo).toBeDefined()
    if (homeLogo) expect(homeLogo.getAttribute('src')).toBe('https://example.com/ars.png')
    if (awayLogo) expect(awayLogo.getAttribute('src')).toBe('https://example.com/che.png')
  })
})
