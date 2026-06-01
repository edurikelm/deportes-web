'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Match, MatchEvent } from '@/lib/types'
import { ScoreDisplay } from '@/components/match/ScoreDisplay'
import { MatchTimeline } from '@/components/match/MatchTimeline'
import { StreamLinks } from '@/components/match/StreamLinks'
import { MatchClockProvider } from '@/components/match/MatchClockContext'
import { StatusBadge } from '@/components/match/StatusBadge'
import { useMatchPolling } from '@/hooks/useMatchPolling'

type MatchTab = 'summary' | 'timeline' | 'streams'

const TABS: Array<{ id: MatchTab; label: string }> = [
  { id: 'summary', label: 'Resumen' },
  { id: 'timeline', label: 'Cronologia' },
  { id: 'streams', label: 'Transmision' },
]

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

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<MatchTab>('summary')

  const matchId = params.id as string

  const { lastUpdated, error } = useMatchPolling({
    url: matchId ? `/api/matches/${matchId}` : undefined,
    onData: (data) => {
      const matchData = data as { match: Match }
      if (matchData.match) {
        setMatch(matchData.match)
        setLoading(false)
      }
    },
  })

  useEffect(() => {
    if (!matchId) return
    fetch(`/api/matches/${matchId}/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events || [])
      })
      .catch(() => {
        // events are non-critical
      })
  }, [matchId])

  const handleShare = async () => {
    const url = window.location.href
    const text = match
      ? `${match.homeTeam.name} ${match.score?.home ?? 0} - ${match.score?.away ?? 0} ${match.awayTeam.name}`
      : 'Ver partido en Deportes Web'

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Deportes Web', text, url })
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  if (loading) {
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
  const matchDate = new Date(match.startTime)
  const isValidDate = !Number.isNaN(matchDate.getTime())
  const formattedDate = isValidDate
    ? matchDate.toLocaleString('es-CL', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    : '--'

  const summaryItems = [
    {
      label: 'Estado',
      value: match.status === 'live' ? 'En vivo' : match.status === 'finished' ? 'Finalizado' : 'Proximo',
    },
    { label: 'Inicio', value: formattedDate },
    { label: 'Liga', value: match.league.name },
    { label: 'Pais', value: match.league.country },
  ]

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
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg bg-[#141414] px-4 py-2 text-sm text-[#a1a1a1] transition-colors hover:bg-[#262626] hover:text-white"
          >
            Compartir
          </button>
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

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#22c55e] bg-[#141414] text-white'
                    : 'border-[#262626] bg-[#111111] text-[#a1a1a1] hover:border-[#404040] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'summary' && (
          <div className="mb-6 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Resumen del partido</h2>
            </div>
            <div className="grid gap-3 p-6 sm:grid-cols-2">
              {summaryItems.map((item) => (
                <div key={item.label} className="rounded-lg border border-[#262626] bg-[#101010] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#666]">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
              <div className="rounded-lg border border-[#262626] bg-[#101010] px-4 py-3 sm:col-span-2">
                <p className="text-xs uppercase tracking-wide text-[#666]">Transmision principal</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {match.streamLinks[0]?.name || 'Sin links disponibles'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="mb-6 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Cronologia</h2>
            </div>
            <div className="p-6">
              <MatchTimeline events={events} />
            </div>
          </div>
        )}

        {activeTab === 'streams' && (
          <div className="mb-6 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
            <div className="border-b border-[#262626] px-6 py-4">
              <h2 className="text-lg font-semibold text-white">Transmision</h2>
            </div>
            <div className="p-6">
              <StreamLinks links={match.streamLinks} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
