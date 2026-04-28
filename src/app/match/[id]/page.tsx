'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import type { Match, MatchEvent } from '@/lib/types'
import { ScoreDisplay } from '@/components/match/ScoreDisplay'
import { MatchTimeline } from '@/components/match/MatchTimeline'
import { StreamLinks } from '@/components/match/StreamLinks'

function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-48 animate-pulse rounded-xl bg-[#141414]" />
      <div className="h-64 animate-pulse rounded-xl bg-[#141414]" />
      <div className="h-32 animate-pulse rounded-xl bg-[#141414]" />
    </div>
  )
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [match, setMatch] = useState<Match | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const matchId = params.id as string

  useEffect(() => {
    async function fetchMatch() {
      setLoading(true)
      setError(null)

      try {
        const [matchRes, eventsRes] = await Promise.all([
          fetch(`/api/matches/${matchId}`),
          fetch(`/api/matches/${matchId}/events`).catch(() => ({ json: async () => ({ events: [] }) }))
        ])

        const matchData = await matchRes.json()
        const eventsData = await eventsRes.json()

        if (!matchRes.ok || !matchData.match) {
          setError(matchData.error || 'Partido no encontrado')
          setLoading(false)
          return
        }

        setMatch(matchData.match)
        setEvents(eventsData.events || [])
      } catch {
        setError('Error al cargar el partido')
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchMatch()
    }
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
        <div className="mx-auto max-w-2xl px-4 py-4">
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
        <div className="mx-auto max-w-2xl px-4 py-4">
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
      <div className="mx-auto max-w-2xl px-4 py-4">
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

        <div className="mb-6 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
          <div
            className="h-1"
            style={{ backgroundColor: accentColor }}
          />
          <div className="p-6">
            <div className="mb-4 flex items-center justify-center gap-2">
              <div className="relative h-6 w-6 overflow-hidden rounded">
                <Image
                  src={match.league.logo}
                  alt={match.league.name}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <span className="text-sm text-[#a1a1a1]">{match.league.name}</span>
            </div>

            <ScoreDisplay match={match} />
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
          <div className="border-b border-[#262626] px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Timeline</h2>
          </div>
          <div className="p-6">
            <MatchTimeline events={events} />
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-xl border border-[#262626] bg-[#141414]">
          <div className="border-b border-[#262626] px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Streaming</h2>
          </div>
          <div className="p-6">
            <StreamLinks links={match.streamLinks} />
          </div>
        </div>
      </div>
    </div>
  )
}
