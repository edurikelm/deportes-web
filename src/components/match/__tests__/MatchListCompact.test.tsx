import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MatchListCompact } from '../MatchListCompact'
import type { Match, Sport } from '@/lib/types'
import { MatchClockProvider } from '../MatchClockContext'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: Record<string, any>) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...rest }: Record<string, any>) => (
    <img src={src} alt={alt} className={className} {...rest} />
  ),
}))

const mockUsePinnedLeagues = vi.fn()
vi.mock('@/hooks/usePinnedLeagues', () => ({
  usePinnedLeagues: (...args: unknown[]) => mockUsePinnedLeagues(...args),
}))

const plMatch: Match = {
  id: 'f1',
  sport: 'football',
  homeTeam: { id: '1', name: 'Arsenal', shortName: 'ARS', logo: '' },
  awayTeam: { id: '2', name: 'Chelsea', shortName: 'CHE', logo: '' },
  status: 'live',
  startTime: '2026-05-01T14:00:00Z',
  minute: 67,
  league: { id: '39', name: 'Premier League', country: 'Inglaterra', logo: '', color: '#3d1959' },
  score: { home: 2, away: 1 },
  events: [],
  streamLinks: [],
}

const plMatch2: Match = {
  id: 'f2',
  sport: 'football',
  homeTeam: { id: '3', name: 'Liverpool', shortName: 'LIV', logo: '' },
  awayTeam: { id: '4', name: 'Man City', shortName: 'MCI', logo: '' },
  status: 'upcoming',
  startTime: '2026-05-02T18:00:00Z',
  league: { id: '39', name: 'Premier League', country: 'Inglaterra', logo: '', color: '#3d1959' },
  score: undefined,
  events: [],
  streamLinks: [],
}

const laligaMatch: Match = {
  id: 'f3',
  sport: 'football',
  homeTeam: { id: '5', name: 'Real Madrid', shortName: 'RMA', logo: '' },
  awayTeam: { id: '6', name: 'Barcelona', shortName: 'BAR', logo: '' },
  status: 'live',
  startTime: '2026-05-01T20:00:00Z',
  league: { id: '140', name: 'La Liga', country: 'España', logo: '', color: '#ee8707' },
  score: { home: 1, away: 0 },
  events: [],
  streamLinks: [],
}

function renderMatchListCompact(matches: Match[], sport: Sport) {
  return render(
    <MatchClockProvider lastFetchTimestamp={undefined}>
      <MatchListCompact
        matches={matches}
        sport={sport}
        activeDate="today"
        onDateChange={vi.fn()}
        includeAllLeagues={false}
        onToggleAllLeagues={vi.fn()}
      />
    </MatchClockProvider>
  )
}

describe('MatchListCompact', () => {
  beforeEach(() => {
    mockUsePinnedLeagues.mockReturnValue({
      pinnedIds: [],
      togglePin: vi.fn(),
      isPinned: vi.fn().mockReturnValue(false),
    })
  })

  it('groups matches by league', () => {
    const { container } = renderMatchListCompact([plMatch, plMatch2, laligaMatch], 'football')
    expect(container.firstElementChild?.className).toContain('max-w-5xl')
    expect(screen.getByText('Premier League')).toBeDefined()
    expect(screen.getByText('La Liga')).toBeDefined()
  })

  it('orders pinned leagues first', () => {
    mockUsePinnedLeagues.mockReturnValue({
      pinnedIds: ['140'],
      togglePin: vi.fn(),
      isPinned: vi.fn((id: string) => id === '140'),
    })

    renderMatchListCompact([plMatch, laligaMatch], 'football')
    const headers = screen.getAllByTestId('section-header')
    expect(headers[0].textContent).toContain('La Liga')
    expect(headers[1].textContent).toContain('Premier League')
  })

  it('renders DatePills bar with Hoy selected by default', () => {
    renderMatchListCompact([plMatch], 'football')
    const hoy = screen.getByText('Hoy')
    expect(hoy).toBeDefined()
    expect(screen.getByText('Ayer')).toBeDefined()
    expect(screen.getByText('Mañana')).toBeDefined()
  })

  it('renders StatusFilters with all options', () => {
    renderMatchListCompact([plMatch], 'football')
    expect(screen.getByText('Todos')).toBeDefined()
    expect(screen.getByText('En vivo')).toBeDefined()
    expect(screen.getByText('Próximos')).toBeDefined()
    expect(screen.getByText('Finalizados')).toBeDefined()
  })

  it('renders MatchRow for each match', () => {
    renderMatchListCompact([plMatch], 'football')
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('Chelsea')).toBeDefined()
  })

  it('filters matches by status when filter pill is clicked', () => {
    renderMatchListCompact([plMatch, plMatch2], 'football')
    fireEvent.click(screen.getByText('En vivo'))
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.queryByText('Liverpool')).toBeNull()
    fireEvent.click(screen.getByText('Próximos'))
    expect(screen.getByText('Liverpool')).toBeDefined()
  })

  it('shows live count badge on En vivo filter', () => {
    renderMatchListCompact([plMatch, plMatch2, laligaMatch], 'football')
    const enVivo = screen.getByText('En vivo')
    expect(enVivo.innerHTML).toContain('2')
  })

  it('shows empty state when no matches match filters', () => {
    const upcoming: Match = {
      ...plMatch,
      id: 'f5',
      status: 'upcoming',
      score: undefined,
    }
    renderMatchListCompact([upcoming], 'football')
    fireEvent.click(screen.getByText('Finalizados'))
    expect(screen.getByText('Sin partidos hoy')).toBeDefined()
  })
})
