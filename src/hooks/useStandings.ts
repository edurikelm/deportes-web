'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LeagueStandings } from '@/lib/types'

interface StandingsState {
  leagueId: string
  standings: LeagueStandings | null
  loading: boolean
  error: string | null
}

interface UseStandingsReturn {
  standings: LeagueStandings | null
  loading: boolean
  error: string | null
  loadStandings: () => void
}

export function useStandings(leagueId: string, sport: string, season?: number): UseStandingsReturn {
  const [state, setState] = useState<StandingsState>({
    leagueId,
    standings: null,
    loading: false,
    error: null,
  })
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    hasLoadedRef.current = false
  }, [leagueId, season])

  const loadStandings = useCallback(() => {
    if (hasLoadedRef.current || sport !== 'football') return

    hasLoadedRef.current = true
    setState({ leagueId, standings: null, loading: true, error: null })

    const seasonParam = season !== undefined ? `&season=${season}` : ''
    fetch(`/api/leagues/${leagueId}/standings?sport=football${seasonParam}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch standings')
        }
        setState({ leagueId, standings: data.standings || null, loading: false, error: null })
      })
      .catch((err) => {
        setState({
          leagueId,
          standings: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Error loading standings',
        })
      })
  }, [leagueId, sport, season])

  const currentState = state.leagueId === leagueId ? state : { standings: null, loading: false, error: null }

  return { ...currentState, loadStandings }
}
