import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { Team } from '@/lib/types'
import { Lineups } from '../Lineups'

const mockUseLineup = vi.fn()

vi.mock('@/hooks/useLineup', () => ({
  useLineup: (...args: unknown[]) => mockUseLineup(...args),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} />
  },
}))

const homeTeam: Team = { id: '1', name: 'Arsenal', logo: '/arsenal.png' }
const awayTeam: Team = { id: '2', name: 'Chelsea', logo: '/chelsea.png' }

function makeLineup() {
  return {
    home: {
      team: homeTeam,
      formation: '4-2-3-1',
      coach: 'Arteta',
      startXI: [
        { id: 'p1', name: 'Raya', number: 22, pos: 'G', grid: '1:1' },
        { id: 'p2', name: 'White', number: 4, pos: 'D', grid: '2:4' },
        { id: 'p3', name: 'Saliba', number: 2, pos: 'D', grid: '2:2' },
      ],
      substitutes: [{ id: 's1', name: 'Ramsdale', number: 1, pos: 'G' }],
    },
    away: {
      team: awayTeam,
      formation: '4-3-3',
      coach: 'Maresca',
      startXI: [
        { id: 'p21', name: 'Sanchez', number: 1, pos: 'G', grid: '1:1' },
        { id: 'p22', name: 'James', number: 24, pos: 'D', grid: '2:4' },
      ],
      substitutes: [],
    },
  }
}

describe('Lineups', () => {
  beforeEach(() => {
    mockUseLineup.mockReset()
  })

  it('renders formation, starters and substitutes', async () => {
    const loadLineup = vi.fn()
    mockUseLineup.mockReturnValue({
      lineup: makeLineup(),
      loading: false,
      error: null,
      loadLineup,
    })

    render(<Lineups matchId="f1" sport="football" homeTeam={homeTeam} awayTeam={awayTeam} />)

    await waitFor(() => {
      expect(screen.getByText(/4-2-3-1/)).toBeDefined()
      expect(screen.getByText(/4-3-3/)).toBeDefined()
      expect(screen.getByText(/Arteta/)).toBeDefined()
      expect(screen.getByText(/Maresca/)).toBeDefined()
      expect(screen.getByText('Raya')).toBeDefined()
      expect(screen.getByText('Sanchez')).toBeDefined()
      expect(screen.getByText('Ramsdale')).toBeDefined()
      expect(screen.getAllByTestId('formation-pitch')).toHaveLength(2)
    })

    expect(loadLineup).toHaveBeenCalled()
  })

  it('shows empty state when no lineup data', async () => {
    const loadLineup = vi.fn()
    mockUseLineup.mockReturnValue({
      lineup: null,
      loading: false,
      error: null,
      loadLineup,
    })

    render(<Lineups matchId="f1" sport="football" homeTeam={homeTeam} awayTeam={awayTeam} />)

    await waitFor(() => {
      expect(screen.getByText(/alineaciones no disponibles/i)).toBeDefined()
    })
  })

  it('shows loading state', () => {
    mockUseLineup.mockReturnValue({
      lineup: null,
      loading: true,
      error: null,
      loadLineup: vi.fn(),
    })

    render(<Lineups matchId="f1" sport="football" homeTeam={homeTeam} awayTeam={awayTeam} />)

    expect(document.querySelector('.animate-spin')).toBeDefined()
  })
})
