import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Lineups } from '@/components/match/Lineups'

const mockFetch = vi.fn()

describe('useLineup integration', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    globalThis.fetch = mockFetch
  })

  it('fetches /api/matches/[id]/lineup when Lineups mounts', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ lineup: null }),
    })

    render(
      <Lineups
        matchId="f1"
        sport="football"
        homeTeam={{ id: '1', name: 'Arsenal', logo: '' }}
        awayTeam={{ id: '2', name: 'Chelsea', logo: '' }}
      />
    )

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/matches/f1/lineup?sport=football')
    })
  })

  it('renders lineup data returned from the API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        lineup: {
          home: {
            team: { id: '1', name: 'Arsenal', logo: '' },
            formation: '4-2-3-1',
            coach: 'Arteta',
            startXI: [{ id: 'p1', name: 'Raya', number: 22, pos: 'G', grid: '1:1' }],
            substitutes: [],
          },
          away: {
            team: { id: '2', name: 'Chelsea', logo: '' },
            formation: '4-3-3',
            coach: 'Maresca',
            startXI: [{ id: 'p21', name: 'Sanchez', number: 1, pos: 'G', grid: '1:1' }],
            substitutes: [],
          },
        },
      }),
    })

    render(
      <Lineups
        matchId="f1"
        sport="football"
        homeTeam={{ id: '1', name: 'Arsenal', logo: '' }}
        awayTeam={{ id: '2', name: 'Chelsea', logo: '' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/4-2-3-1/)).toBeDefined()
      expect(screen.getByText(/4-3-3/)).toBeDefined()
      expect(screen.getByText('Raya')).toBeDefined()
      expect(screen.getByText('Sanchez')).toBeDefined()
    })
  })

  it('does not fetch when sport is not football', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ lineup: null }),
    })

    render(
      <Lineups
        matchId="b1"
        sport="basketball"
        homeTeam={{ id: '3', name: 'Lakers', logo: '' }}
        awayTeam={{ id: '4', name: 'Celtics', logo: '' }}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/alineaciones no disponibles/i)).toBeDefined()
    })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
