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
  default: ({
    children,
    href,
    className,
    ...rest
  }: Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    children: React.ReactNode
    href: string
  }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    className,
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img src={src} alt={alt} className={className} />
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

function renderMatchListCompact(matches: Match[], sport: Sport, onDateChange = vi.fn()) {
  return render(
    <MatchClockProvider lastFetchTimestamp={undefined}>
      <MatchListCompact
        matches={matches}
        sport={sport}
        activeDate="2026-06-07"
        onDateChange={onDateChange}
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
    expect(container.firstElementChild?.className).toContain('max-w-6xl')
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

  it('renders the date navigator', () => {
    renderMatchListCompact([plMatch], 'football')
    expect(screen.getByText('07/06 DO')).toBeDefined()
    expect(screen.getByLabelText('Fecha anterior')).toBeDefined()
    expect(screen.getByLabelText('Fecha siguiente')).toBeDefined()
  })

  it('moves date backward and forward', () => {
    const onDateChange = vi.fn()
    renderMatchListCompact([plMatch], 'football', onDateChange)
    fireEvent.click(screen.getByLabelText('Fecha anterior'))
    expect(onDateChange).toHaveBeenCalledWith('2026-06-06')
    fireEvent.click(screen.getByLabelText('Fecha siguiente'))
    expect(onDateChange).toHaveBeenCalledWith('2026-06-08')
  })

  it('renders StatusFilters without odds', () => {
    renderMatchListCompact([plMatch], 'football')
    expect(screen.getByText('TODOS')).toBeDefined()
    expect(screen.getByText('EN DIRECTO')).toBeDefined()
    expect(screen.getByText('PRÓXIMOS')).toBeDefined()
    expect(screen.getByText('FINALIZADOS')).toBeDefined()
    expect(screen.queryByText('CUOTAS')).toBeNull()
  })

  it('renders MatchRow for each match', () => {
    renderMatchListCompact([plMatch], 'football')
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('Chelsea')).toBeDefined()
  })

  it('filters matches by status when filter pill is clicked', () => {
    renderMatchListCompact([plMatch, plMatch2], 'football')
    fireEvent.click(screen.getByText('EN DIRECTO'))
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.queryByText('Liverpool')).toBeNull()
    fireEvent.click(screen.getByText('PRÓXIMOS'))
    expect(screen.getByText('Liverpool')).toBeDefined()
  })

  it('shows live count badge on EN DIRECTO filter', () => {
    renderMatchListCompact([plMatch, plMatch2, laligaMatch], 'football')
    const enVivo = screen.getByText('EN DIRECTO')
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
    fireEvent.click(screen.getByText('FINALIZADOS'))
    expect(screen.getByText('Sin partidos hoy')).toBeDefined()
  })
})
