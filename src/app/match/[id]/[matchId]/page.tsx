'use client'

import { useState, useMemo, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Match } from '@/lib/types'
import { ScoreDisplay } from '@/components/match/ScoreDisplay'
import { MatchClockProvider } from '@/components/match/MatchClockContext'
import { StatusBadge } from '@/components/match/StatusBadge'
import { MatchDetailTabs } from '@/components/match/MatchDetailTabs'
import { useMatchPolling } from '@/hooks/useMatchPolling'
import { useLiveMatchFloating } from '@/contexts/LiveMatchFloatingContext'
import { useLiveMatchPolling } from '@/hooks/useLiveMatchPolling'

const VALID_SPORTS = ['football', 'basketball', 'mma']

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
        <div className="h-1 animate-pulse bg-[#1f1f1f]" />
        <div className="p-6">
          <div className="mx-auto mb-6 h-4 w-40 animate-pulse rounded bg-[#1f1f1f]" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-[#1f1f1f]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#1f1f1f]" />
            </div>
            <div className="h-10 w-32 animate-pulse rounded bg-[#1f1f1f]" />
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 animate-pulse rounded-lg bg-[#1f1f1f]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#1f1f1f]" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-24 animate-pulse rounded-lg bg-[#141414]" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[#141414]" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-[#141414]" />
      </div>
      <div className="h-56 animate-pulse rounded-xl border border-[#262626] bg-[#141414]" />
    </div>
  )
}

export default function MatchSportDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sport = params.id as string
  const matchId = params.matchId as string
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)

  const isValidSport = useMemo(() => VALID_SPORTS.includes(sport), [sport])

  const {
    isSupported,
    isFloatingOpen,
    floatingMatch,
    openFloatingMatch,
    updateFloatingContent,
    closeFloatingMatch,
    setFloatingError,
  } = useLiveMatchFloating()

  const { lastUpdated, error } = useMatchPolling({
    url: matchId ? `/api/matches/${matchId}` : undefined,
    enabled: isValidSport && !isFloatingOpen,
    onData: (data) => {
      const matchData = data as { match?: Match }
      setMatch(matchData.match ?? null)
      setLoading(false)
    },
  })

  const pipPolling = useLiveMatchPolling({
    sport: isValidSport ? sport : undefined,
    enabled: isValidSport && isFloatingOpen,
    keepAlive: isFloatingOpen,
    trackedMatchId: matchId,
    onData: (data) => {
      if (!isFloatingOpen) return
      const matches = (data as { matches: Match[] }).matches || []
      const found = matches.find((m: Match) => m.id === matchId)
      if (found) {
        updateFloatingContent(found, new Date())
        setMatch(found)
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    if (isFloatingOpen) {
      setFloatingError(pipPolling.error ?? null)
    }
  }, [pipPolling.error, isFloatingOpen, setFloatingError])

  if (!isValidSport) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="mx-auto max-w-[960px] px-4 py-4">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#a1a1a1] transition-colors hover:text-white"
            >
              ← Volver
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-lg text-[#ef4444]">Deporte no soportado</span>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-sm text-[#a1a1a1] underline hover:text-white"
            >
              Ir a inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading && !error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="mx-auto max-w-[960px] px-4 py-4">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#a1a1a1] transition-colors hover:text-white"
            >
              ← Volver
            </button>
          </div>
          <PageSkeleton />
        </div>
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-[#0a0a0a]">
        <div className="mx-auto max-w-[960px] px-4 py-4">
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#a1a1a1] transition-colors hover:text-white"
            >
              ← Volver
            </button>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <span className="text-lg text-[#ef4444]">{error || 'Partido no encontrado'}</span>
            <button
              onClick={() => router.push('/')}
              className="mt-4 text-sm text-[#a1a1a1] underline hover:text-white"
            >
              Ir a inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  const accentColor = match.league.color

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto max-w-[960px] px-4 py-4">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#a1a1a1] transition-colors hover:text-white"
          >
            ← Volver
          </button>
          <div className="flex items-center gap-3">
            {(() => {
              if (!isSupported) {
                return (
                  <>
                    <button
                      disabled
                      className="cursor-not-allowed rounded-xl bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-[#666] transition-colors"
                    >
                      Abrir flotante
                    </button>
                    <span className="text-xs text-[#666]">No compatible con este navegador</span>
                  </>
                )
              }

              const isThisMatchFloating = isFloatingOpen && floatingMatch?.id === match.id

              if (isThisMatchFloating) {
                return (
                  <>
                    <span className="text-xs text-[#22c55e]">Ventana flotante abierta</span>
                    <button
                      onClick={closeFloatingMatch}
                      className="rounded-xl border border-[#ef4444] px-4 py-2 text-sm font-medium text-[#ef4444] transition-colors hover:bg-[#ef4444] hover:text-white"
                    >
                      Cerrar
                    </button>
                  </>
                )
              }

              return (
                <button
                  onClick={() => openFloatingMatch(match, lastUpdated)}
                  className="rounded-xl bg-[#3d1959] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4d1d69]"
                >
                  {isFloatingOpen ? 'Reemplazar flotante' : 'Abrir flotante'}
                </button>
              )
            })()}
          </div>
        </div>

        <MatchClockProvider lastFetchTimestamp={lastUpdated?.getTime()}>
          <div className="mb-4 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
            <div className="h-1" style={{ backgroundColor: accentColor }} />
            <div
              className="p-6"
              style={{ background: `linear-gradient(180deg, ${accentColor}14 0%, transparent 45%)` }}
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative h-6 w-6 overflow-hidden rounded">
                    <Image
                      src={match.league.logo}
                      alt={match.league.name}
                      fill
                      sizes="24px"
                      className="object-contain"
                    />
                  </div>
                  <span className="text-sm text-[#a1a1a1]">
                    {match.league.name} · {match.league.country}
                  </span>
                </div>
                <StatusBadge status={match.status} minute={match.minute} />
              </div>

              <ScoreDisplay match={match} />
            </div>
          </div>
        </MatchClockProvider>

        <MatchDetailTabs match={match} />
      </div>
    </div>
  )
}
