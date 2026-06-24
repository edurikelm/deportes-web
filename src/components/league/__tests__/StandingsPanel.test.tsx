import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StandingsPanel } from '../StandingsPanel'
import type { LeagueStandings } from '@/lib/types'

const mockUseStandings = vi.fn()

vi.mock('@/hooks/useStandings', () => ({
  useStandings: (...args: unknown[]) => mockUseStandings(...args),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src || undefined} alt={alt || ''} className={className} />
  ),
}))

const baseStandings: LeagueStandings = {
  league: { id: '39', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
  season: 2025,
  standings: [
    {
      rank: 1,
      team: { id: '1', name: 'Arsenal', shortName: 'ARS', logo: '' },
      points: 80,
      played: 38,
      wins: 24,
      draws: 8,
      losses: 6,
      goalsFor: 78,
      goalsAgainst: 30,
      goalDifference: 48,
    },
  ],
}

describe('StandingsPanel', () => {
  beforeEach(() => {
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: false,
      error: null,
      loadStandings: vi.fn(),
    })
  })

  it('shows loading state', () => {
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: true,
      error: null,
      loadStandings: vi.fn(),
    })

    render(<StandingsPanel leagueId="39" sport="football" />)
    expect(screen.getByText(/cargando/i)).toBeDefined()
  })

  it('shows error state', () => {
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: false,
      error: 'API down',
      loadStandings: vi.fn(),
    })

    render(<StandingsPanel leagueId="39" sport="football" />)
    expect(screen.getByText(/error/i)).toBeDefined()
    expect(screen.getByText('API down')).toBeDefined()
  })

  it('shows unavailable state when standings are null and not loading', () => {
    render(<StandingsPanel leagueId="39" sport="football" />)
    expect(screen.getByText(/no disponible/i)).toBeDefined()
  })

  it('renders StandingsTable on success', () => {
    mockUseStandings.mockReturnValue({
      standings: baseStandings,
      loading: false,
      error: null,
      loadStandings: vi.fn(),
    })

    render(<StandingsPanel leagueId="39" sport="football" />)
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('80')).toBeDefined()
  })

  it('calls loadStandings on mount', () => {
    const loadStandings = vi.fn()
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: false,
      error: null,
      loadStandings,
    })

    render(<StandingsPanel leagueId="39" sport="football" />)
    expect(loadStandings).toHaveBeenCalledTimes(1)
  })

  it('calls loadStandings when leagueId changes', () => {
    const loadStandings = vi.fn()
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: false,
      error: null,
      loadStandings,
    })

    const { rerender } = render(<StandingsPanel leagueId="39" sport="football" />)
    expect(loadStandings).toHaveBeenCalledTimes(1)

    rerender(<StandingsPanel leagueId="140" sport="football" />)
    expect(loadStandings).toHaveBeenCalledTimes(2)
  })

  it('passes season to useStandings', () => {
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: false,
      error: null,
      loadStandings: vi.fn(),
    })

    render(<StandingsPanel leagueId="39" sport="football" season={2024} />)
    expect(mockUseStandings).toHaveBeenCalledWith('39', 'football', 2024)
  })

  it('does not call loadStandings for non-football sports', () => {
    const loadStandings = vi.fn()
    mockUseStandings.mockReturnValue({
      standings: null,
      loading: false,
      error: null,
      loadStandings,
    })

    render(<StandingsPanel leagueId="39" sport="basketball" />)
    expect(loadStandings).not.toHaveBeenCalled()
    expect(screen.getByText(/no disponible/i)).toBeDefined()
  })
})
