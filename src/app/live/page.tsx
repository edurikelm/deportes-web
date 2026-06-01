'use client'

import { useState, useEffect, useCallback } from 'react'
import { Radio } from 'lucide-react'
import { Match } from '@/lib/types'
import { MatchListCompact } from '@/components/match/MatchListCompact'
import { MatchListSkeleton } from '@/components/match/MatchCardSkeleton'
import { MatchClockProvider } from '@/components/match/MatchClockContext'
import { useMatchPolling } from '@/hooks/useMatchPolling'

export default function LivePage() {
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches')
      const data = await res.json()
      setAllMatches((data.matches || []).filter((m: Match) => m.status === 'live'))
      setError(null)
    } catch {
      setError('Error al cargar partidos')
    }
  }, [])

  const { lastUpdated } = useMatchPolling({
    onFetch: fetchMatches,
    interval: 30000,
  })

  useEffect(() => {
    fetchMatches().then(() => setLoading(false))
  }, [fetchMatches])

  const liveCount = allMatches.length
  const liveFootball = allMatches.filter(m => m.sport === 'football').length
  const liveBasketball = allMatches.filter(m => m.sport === 'basketball').length
  const liveMma = allMatches.filter(m => m.sport === 'mma').length

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-[#1a1a1a] px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ef4444] opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ef4444]" />
          </span>
          <h1 className="text-xl font-bold text-white">En Vivo</h1>
          <span className="rounded-full bg-[#ef4444] px-2 py-0.5 text-xs font-bold text-white">
            {liveCount}
          </span>
        </div>
        <div className="mt-1 flex gap-4 text-xs text-[#a1a1a1]">
          <span>⚽ {liveFootball} fútbol</span>
          <span>🏀 {liveBasketball} básquet</span>
          <span>🥊 {liveMma} MMA</span>
        </div>
        {lastUpdated && (
          <span className="mt-1 block text-xs text-[#666]">
            Actualizado {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {error && (
          <div className="mt-2 rounded-md bg-red-900/50 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-6"><MatchListSkeleton count={6} /></div>
      ) : allMatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#666]">
          <Radio className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No hay partidos en vivo ahora</p>
        </div>
      ) : (
        <MatchClockProvider lastFetchTimestamp={lastUpdated?.getTime()}>
          <MatchListCompact matches={allMatches} sport="football" />
        </MatchClockProvider>
      )}
    </div>
  )
}
