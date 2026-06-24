import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStandings } from '../useStandings'
import type { LeagueStandings } from '@/lib/types'

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

describe('useStandings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ standings: baseStandings }),
      })
    )
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does not fetch on mount (lazy)', () => {
    const fetchSpy = vi.mocked(fetch)
    renderHook(() => useStandings('39', 'football'))
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('fetches standings when loadStandings is called', async () => {
    const fetchSpy = vi.mocked(fetch)
    const { result } = renderHook(() => useStandings('39', 'football'))

    act(() => {
      result.current.loadStandings()
    })

    expect(result.current.loading).toBe(true)

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/leagues/39/standings?sport=football')
      expect(result.current.standings).toEqual(baseStandings)
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  it('includes explicit season in URL when provided', async () => {
    const fetchSpy = vi.mocked(fetch)
    const { result } = renderHook(() => useStandings('39', 'football', 2024))

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/leagues/39/standings?sport=football&season=2024')
      expect(result.current.standings).toEqual(baseStandings)
    })
  })

  it('exposes error when fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API down' }),
      })
    )

    const { result } = renderHook(() => useStandings('39', 'football'))

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(result.current.error).toContain('API down')
      expect(result.current.loading).toBe(false)
      expect(result.current.standings).toBeNull()
    })
  })

  it('exposes error when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

    const { result } = renderHook(() => useStandings('39', 'football'))

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(result.current.error).toContain('Network error')
      expect(result.current.loading).toBe(false)
      expect(result.current.standings).toBeNull()
    })
  })

  it('does not fetch for non-football sports', () => {
    const fetchSpy = vi.mocked(fetch)
    const { result } = renderHook(() => useStandings('39', 'basketball'))

    act(() => {
      result.current.loadStandings()
    })

    expect(fetchSpy).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
    expect(result.current.standings).toBeNull()
  })

  it('does not refetch if standings were already loaded', async () => {
    const fetchSpy = vi.mocked(fetch)
    const { result } = renderHook(() => useStandings('39', 'football'))

    await act(async () => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(result.current.standings).toEqual(baseStandings)
    })

    act(() => {
      result.current.loadStandings()
    })

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('resets loaded state when leagueId changes', async () => {
    const fetchSpy = vi.mocked(fetch)
    const { result, rerender } = renderHook(({ leagueId }) => useStandings(leagueId, 'football'), {
      initialProps: { leagueId: '39' },
    })

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(result.current.standings).toEqual(baseStandings)
    })

    rerender({ leagueId: '140' })

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/leagues/140/standings?sport=football')
    })
  })

  it('resets loaded state when season changes', async () => {
    const fetchSpy = vi.mocked(fetch)
    const { result, rerender } = renderHook(({ season }) => useStandings('39', 'football', season), {
      initialProps: { season: 2024 },
    })

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(result.current.standings).toEqual(baseStandings)
    })

    rerender({ season: 2025 })

    act(() => {
      result.current.loadStandings()
    })

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/leagues/39/standings?sport=football&season=2025')
    })
  })
})
