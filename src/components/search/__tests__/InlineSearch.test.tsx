import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import type { Match } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href as string} className={className as string} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...rest }: Record<string, unknown>) => (
    <img src={src as string} alt={alt as string} className={className as string} {...rest} />
  ),
}))

vi.mock('../../match/MatchClockContext', () => ({
  MatchClockProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMatchClockContext: () => ({ lastFetchTimestamp: undefined }),
}))

vi.mock('@/hooks/useMatchClock', () => ({
  useMatchClock: () => ({ formatted: '67\'', isDelayed: false, countdownMinutes: null }),
}))

import { InlineSearch } from '../InlineSearch'

const baseMatch: Match = {
  id: '1',
  sport: 'football',
  homeTeam: { id: 'h1', name: 'River Plate', shortName: 'RIV', logo: '' },
  awayTeam: { id: 'a1', name: 'Boca Juniors', shortName: 'BOC', logo: '' },
  status: 'live',
  startTime: '2026-05-01T14:00:00Z',
  minute: 30,
  league: { id: 'l1', name: 'Liga Profesional', country: 'Argentina', logo: '', color: '#262626' },
  score: { home: 1, away: 0 },
  events: [],
  streamLinks: [],
}

const coloMatch: Match = {
  ...baseMatch,
  id: '2',
  homeTeam: { id: 'h2', name: 'Colo Colo', shortName: 'COL', logo: '' },
  awayTeam: { id: 'a2', name: 'Universidad de Chile', shortName: 'UCH', logo: '' },
}

const riverAwayMatch: Match = {
  ...baseMatch,
  id: '3',
  homeTeam: { id: 'h3', name: 'Independiente', shortName: 'IND', logo: '' },
  awayTeam: { id: 'a3', name: 'River Plate', shortName: 'RIV', logo: '' },
}

function renderInlineSearch(matches: Match[] = [baseMatch], onClose = vi.fn()) {
  return {
    onClose,
    ...render(<InlineSearch matches={matches} onClose={onClose} />),
  }
}

describe('InlineSearch', () => {
  it('renders a close button (X)', () => {
    renderInlineSearch()
    const closeBtn = screen.getByRole('button')
    expect(closeBtn).toBeDefined()
  })

  it('calls onClose when X button is clicked', () => {
    const { onClose } = renderInlineSearch()
    const closeBtn = screen.getByRole('button')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const { onClose } = renderInlineSearch()
    const input = screen.getByPlaceholderText('Buscar equipo...')
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('performs case-insensitive search', () => {
    renderInlineSearch([baseMatch, coloMatch])
    const input = screen.getByPlaceholderText('Buscar equipo...')
    fireEvent.change(input, { target: { value: 'colo' } })
    expect(screen.getByText('Colo Colo')).toBeDefined()
  })

  it('renders search input with placeholder', () => {
    renderInlineSearch()
    const input = screen.getByPlaceholderText('Buscar equipo...')
    expect(input).toBeDefined()
  })

  it('renders MatchRow results when typing 2+ chars that match a team name', () => {
    renderInlineSearch([baseMatch, riverAwayMatch, coloMatch])
    const input = screen.getByPlaceholderText('Buscar equipo...')
    fireEvent.change(input, { target: { value: 'River' } })
    const riverPlates = screen.getAllByText('River Plate')
    expect(riverPlates.length).toBe(2)
  })

  it('matches team name in home or away position', () => {
    renderInlineSearch([baseMatch, coloMatch])
    const input = screen.getByPlaceholderText('Buscar equipo...')
    fireEvent.change(input, { target: { value: 'Colo' } })
    expect(screen.getByText('Colo Colo')).toBeDefined()
  })

  it('shows no-results message when no team matches the query', () => {
    renderInlineSearch([baseMatch, riverAwayMatch])
    const input = screen.getByPlaceholderText('Buscar equipo...')
    fireEvent.change(input, { target: { value: 'Xyz' } })
    expect(screen.getByText(/no se encontraron equipos/i)).toBeDefined()
  })
})
