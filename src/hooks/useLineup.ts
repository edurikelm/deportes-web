'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lineup } from '@/lib/types'

interface LineupState {
  matchId: string
  lineup: Lineup | null
  loading: boolean
  error: string | null
}

interface UseLineupReturn {
  lineup: Lineup | null
  loading: boolean
  error: string | null
  loadLineup: () => void
}

export function useLineup(matchId: string, sport: string): UseLineupReturn {
  const [state, setState] = useState<LineupState>({
    matchId,
    lineup: null,
    loading: false,
    error: null,
  })
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    hasLoadedRef.current = false
  }, [matchId])

  const loadLineup = useCallback(() => {
    if (hasLoadedRef.current || sport !== 'football') return

    hasLoadedRef.current = true
    setState({ matchId, lineup: null, loading: true, error: null })

    fetch(`/api/matches/${matchId}/lineup?sport=football`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch lineup')
        }
        setState({ matchId, lineup: data.lineup || null, loading: false, error: null })
      })
      .catch((err) => {
        setState({
          matchId,
          lineup: null,
          loading: false,
          error: err instanceof Error ? err.message : 'Error loading lineup',
        })
      })
  }, [matchId, sport])

  const currentState = state.matchId === matchId ? state : { lineup: null, loading: false, error: null }

  return { ...currentState, loadLineup }
}
