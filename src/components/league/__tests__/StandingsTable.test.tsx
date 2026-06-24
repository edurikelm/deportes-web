import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StandingsTable } from '../StandingsTable'
import type { LeagueStandings } from '@/lib/types'

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
    {
      rank: 2,
      team: { id: '2', name: 'Chelsea', shortName: 'CHE', logo: '' },
      points: 75,
      played: 38,
      wins: 22,
      draws: 9,
      losses: 7,
      goalsFor: 70,
      goalsAgainst: 35,
      goalDifference: 35,
    },
  ],
}

describe('StandingsTable', () => {
  it('renders all desktop columns', () => {
    render(<StandingsTable standings={baseStandings} />)
    expect(screen.getByText('Pos')).toBeDefined()
    expect(screen.getByText('Equipo')).toBeDefined()
    expect(screen.getByText('PJ')).toBeDefined()
    expect(screen.getByText('G')).toBeDefined()
    expect(screen.getByText('E')).toBeDefined()
    expect(screen.getByText('P')).toBeDefined()
    expect(screen.getByText('DG')).toBeDefined()
    expect(screen.getByText('PTS')).toBeDefined()
  })

  it('renders team names and accessible row data', () => {
    render(<StandingsTable standings={baseStandings} />)
    expect(screen.getByText('Arsenal')).toBeDefined()
    expect(screen.getByText('Chelsea')).toBeDefined()
    expect(screen.getByText('80')).toBeDefined()
    expect(screen.getByText('75')).toBeDefined()
    expect(screen.getByText('+48')).toBeDefined()
    expect(screen.getByText('+35')).toBeDefined()
  })

  it('uses shortName on mobile and full name on desktop', () => {
    const { container } = render(<StandingsTable standings={baseStandings} />)
    const fullNames = container.querySelectorAll('[class*="hidden sm"], [class*="sm:inline"]')
    const shortNames = container.querySelectorAll('[class*="sm:hidden"]')

    expect(fullNames.length).toBeGreaterThan(0)
    expect(shortNames.length).toBeGreaterThan(0)
  })

  it('hides secondary columns on mobile via responsive classes', () => {
    const { container } = render(<StandingsTable standings={baseStandings} />)
    const headerCells = container.querySelectorAll('th')
    const hiddenOnMobile = Array.from(headerCells).filter((th) =>
      th.className.includes('hidden') && th.className.includes('sm:table-cell')
    )

    expect(hiddenOnMobile.length).toBeGreaterThanOrEqual(4)
  })

  it('renders group header when groups differ', () => {
    const groupedStandings: LeagueStandings = {
      ...baseStandings,
      standings: [
        { ...baseStandings.standings[0], group: 'Group A' },
        { ...baseStandings.standings[1], group: 'Group B' },
      ],
    }

    render(<StandingsTable standings={groupedStandings} />)
    expect(screen.getByText('Group A')).toBeDefined()
    expect(screen.getByText('Group B')).toBeDefined()
  })
})
