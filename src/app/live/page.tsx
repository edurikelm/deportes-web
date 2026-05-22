'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Match } from '@/lib/types'
import { MatchList } from '@/components/match/MatchList'
import { RateLimitState } from '@/components/match/RateLimitState'
import { useMatchPolling } from '@/hooks/useMatchPolling'

interface MatchesResponse {
  matches: Match[]
  meta: {
    total: number
    cached: boolean
    cacheAge: number
  }
}

function LivePageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i}>
          <div className="mb-4 h-4 w-48 rounded bg-[#1a1a1a]" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((j) => (
              <div
                key={j}
                className="h-32 rounded-xl bg-[#141414] border border-[#262626]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LivePage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/matches?status=live')
      if (!res.ok) throw new Error('Failed to fetch')
      const data: MatchesResponse = await res.json()
      setMatches(data.matches)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  const { isPolling, lastUpdated, error: pollingError, rateLimitInfo } = useMatchPolling({
    onFetch: fetchMatches,
    interval: 30000,
    enabled: true,
  })

  useEffect(() => {
    fetchMatches().then(() => setIsLoading(false))
  }, [fetchMatches])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <LivePageSkeleton />
      </div>
    )
  }

  if (error && matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h3 className="mb-2 text-lg font-semibold text-white">Failed to load</h3>
          <p className="mb-4 text-sm text-[#666]">{error}</p>
          <button
            onClick={() => fetchMatches()}
            className="rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#dc2626]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">En Vivo</h1>
          <p className="text-sm text-[#a1a1a1]">
            No hay partidos en vivo ahora
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 text-6xl">⚽</div>
          <h3 className="mb-2 text-lg font-semibold text-white">No live matches</h3>
          <p className="text-sm text-[#666]">
            Currently no matches in progress. Check back later.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">En Vivo</h1>
          <p className="text-sm text-[#a1a1a1]">
            {matches.length} match{matches.length !== 1 ? 'es' : ''} en directo
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ef4444]" />
            </span>
          )}
          {lastUpdated && (
            <span className="text-xs text-[#666]">
              Actualizado {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>

      {pollingError && (
        <div className="mb-4 rounded-lg bg-red-950/50 border border-red-900 px-4 py-2 text-sm text-red-400">
          {pollingError}
        </div>
      )}

      {rateLimitInfo.active && (
        <div className="mb-4">
          <RateLimitState nextRetryInSeconds={rateLimitInfo.remainingSeconds} />
        </div>
      )}

      <MatchList matches={matches} />
    </div>
  )
}
