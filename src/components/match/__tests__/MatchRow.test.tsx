import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MatchRow } from '../MatchRow'
import { MatchClockProvider } from '../MatchClockContext'
import type { Match } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: { children: ReactNode; href: string; className?: string }) => (
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

function renderMatchRow(match: Match) {
  return render(
    <MatchClockProvider lastFetchTimestamp={undefined}>
      <MatchRow match={match} />
    </MatchClockProvider>
  )
}

describe('MatchRow', () => {
  it('renders home and away team names', () => {
    renderMatchRow(footballMatch)
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('Chelsea')).toBeDefined()
  })

  it('renders score in monospace font for live matches', () => {
    renderMatchRow(footballMatch)
    const scoreEl = screen.getByText('2 - 1')
    expect(scoreEl).toBeDefined()
    expect(scoreEl.className).toContain('font-mono')
    expect(scoreEl.className).toContain('font-bold')
  })

  it('uses compact table columns instead of stretching score across the full viewport', () => {
    renderMatchRow(footballMatch)
    const row = screen.getByRole('link')
    expect(row.className).toContain('grid')
    expect(row.className).toContain('grid-cols-[84px_minmax(0,1fr)_72px_minmax(0,1fr)]')
    expect(row.className).toContain('sm:grid-cols-[116px_minmax(0,1fr)_96px_minmax(0,1fr)]')
  })

  it('renders live status indicator with red pulsing dot and minute', () => {
    renderMatchRow(footballMatch)
    const minuteEl = screen.getByText(/'\s*$/)
    expect(minuteEl).toBeDefined()
    expect(minuteEl.className).toContain('font-mono')
    expect(minuteEl.className).toContain('text-[#ef4444]')
    const redDots = document.querySelectorAll('.bg-\\[\\#ef4444\\]')
    expect(redDots.length).toBeGreaterThan(0)
  })

  it('renders finished status indicator with green Finalizado badge', () => {
    renderMatchRow(finishedMatch)
    const ftEl = screen.getByText('Finalizado')
    expect(ftEl).toBeDefined()
    expect(ftEl.className).toContain('text-[#22c55e]')
  })

  it('renders upcoming status indicator with time', () => {
    renderMatchRow(upcomingMatch)
    const timeEl = screen.getByText(/\d{2}:\d{2}/)
    expect(timeEl).toBeDefined()
    expect(timeEl.className).toContain('text-[#8a8a8a]')
  })

  it('renders stream info under the score', () => {
    renderMatchRow(footballMatch)
    expect(screen.getByText(/Sky Sports/)).toBeDefined()
  })

  it('renders stream info for finished matches', () => {
    renderMatchRow(finishedMatch)
    expect(screen.getByText(/ESPN/)).toBeDefined()
  })

  it('navigates to /match/[id] on click', () => {
    renderMatchRow(footballMatch)
    const link = screen.getByRole('link')
    expect(link).toBeDefined()
    expect(link.getAttribute('href')).toBe('/match/f1')
  })

  it('renders home and away team logos as img tags', () => {
    renderMatchRow(footballMatch)
    const imgs = screen.getAllByRole('img')
    const homeLogo = imgs.find(img => img.getAttribute('alt') === 'Arsenal')
    const awayLogo = imgs.find(img => img.getAttribute('alt') === 'Chelsea')
    expect(homeLogo).toBeDefined()
    expect(awayLogo).toBeDefined()
    if (homeLogo) expect(homeLogo.getAttribute('src')).toBe('https://example.com/ars.png')
    if (awayLogo) expect(awayLogo.getAttribute('src')).toBe('https://example.com/che.png')
  })
})
