'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useStandings } from '@/hooks/useStandings'
import { StandingsTable } from './StandingsTable'
import type { Sport } from '@/lib/types'

interface StandingsPanelProps {
  leagueId: string
  sport: Sport
  season?: number
}

export function StandingsPanel({ leagueId, sport, season }: StandingsPanelProps) {
  const { standings, loading, error, loadStandings } = useStandings(leagueId, sport, season)

  useEffect(() => {
    if (sport === 'football') {
      loadStandings()
    }
  }, [leagueId, sport, loadStandings])

  if (sport !== 'football') {
    return (
      <div data-testid="standings-panel" className="border-t border-[#27272a] bg-[#09090b] px-3 py-6 text-center text-sm text-[#71717a]">
        Tabla no disponible para este deporte
      </div>
    )
  }

  if (loading) {
    return (
      <div data-testid="standings-panel" className="border-t border-[#27272a] bg-[#09090b] px-3 py-8 text-center">
        <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#71717a]" />
        <p className="mt-2 text-xs text-[#71717a]">Cargando tabla...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="standings-panel" className="border-t border-[#27272a] bg-[#09090b] px-3 py-6 text-center text-sm text-[#a1a1aa]">
        <p className="font-medium text-[#ef4444]">Error</p>
        <p className="mt-1 text-[#71717a]">{error}</p>
      </div>
    )
  }

  if (!standings) {
    return (
      <div data-testid="standings-panel" className="border-t border-[#27272a] bg-[#09090b] px-3 py-6 text-center text-sm text-[#71717a]">
        Tabla no disponible
      </div>
    )
  }

  return (
    <div data-testid="standings-panel" className="border-t border-[#27272a] bg-[#09090b] px-3 py-3 sm:px-4">
      <StandingsTable standings={standings} />
    </div>
  )
}
