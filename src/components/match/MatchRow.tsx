'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Match, Sport } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from './MatchClockContext'

interface MatchRowProps {
  match: Match
  sport: Sport
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function getMMAMethod(match: Match): string | null {
  const finishEvent = match.events.find(e =>
    e.type === 'knockout' || e.type === 'submission' || e.type === 'tko' || e.type === 'decision'
  )
  if (!finishEvent) return null

  const methodMap: Record<string, string> = {
    knockout: 'KO',
    tko: 'TKO',
    submission: 'SUB',
    decision: 'DEC',
  }

  const method = methodMap[finishEvent.type]
  const roundMatch = finishEvent.comment?.match(/Round (\d+)/)
  const round = roundMatch ? `R${roundMatch[1]}` : ''

  return `${method} ${round}`.trim()
}

export function MatchRow({ match, sport }: MatchRowProps) {
  const { lastFetchTimestamp } = useMatchClockContext()
  const clock = useMatchClock(match, lastFetchTimestamp)
  const showScore = match.status !== 'upcoming' && match.score != null
  const showSecondLine = match.status !== 'upcoming'

  function renderSecondLine(): string | null {
    const parts: string[] = []
    if (sport === 'football') {
      if (match.status === 'finished') {
        parts.push('FT')
      } else if (match.score?.ht) {
        parts.push(`HT: ${match.score.ht.home}-${match.score.ht.away}`)
      }
    }
    if (sport === 'basketball' && match.score?.quarters) {
      parts.push(...match.score.quarters.map((q, i) => `Q${i + 1}: ${q.home}-${q.away}`))
    }
    if (sport === 'mma' && match.status === 'finished') {
      const method = getMMAMethod(match)
      if (method) parts.push(method)
    }
    if (match.streamLinks.length > 0) {
      parts.push(...match.streamLinks.map(s => s.name))
    }
    return parts.length > 0 ? parts.join(' · ') : null
  }

  const secondLine = renderSecondLine()

  return (
    <Link
      href={`/match/${match.id}`}
      className="group grid grid-cols-[84px_minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-x-2 border-b border-[#1f1f1f] px-3 py-2.5 transition-colors hover:bg-[#121212] sm:grid-cols-[116px_minmax(0,1fr)_96px_minmax(0,1fr)] sm:gap-x-3 sm:px-4"
    >
      <div className={showSecondLine && secondLine ? 'row-span-2 self-start pt-0.5' : ''}>
          {match.status === 'live' && (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#ef4444] opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#ef4444]" />
              </span>
              <span
                title={clock.formatted}
                className="max-w-[70px] truncate font-mono text-xs font-semibold text-[#ef4444] sm:max-w-[96px]"
              >
                {clock.formatted}
              </span>
            </div>
          )}
          {match.status === 'finished' && (
            <span className="rounded bg-[#102416] px-1.5 py-0.5 text-[11px] font-semibold text-[#22c55e]">
              Finalizado
            </span>
          )}
          {match.status === 'upcoming' && (
            <span className="font-mono text-xs text-[#8a8a8a]">{formatTime(match.startTime)}</span>
          )}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative h-5 w-5 shrink-0 sm:h-6 sm:w-6">
          {match.homeTeam.logo ? (
            <Image src={match.homeTeam.logo} alt={match.homeTeam.name} fill sizes="24px" className="object-contain" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#666]">
              {match.homeTeam.shortName?.[0] || '?'}
            </span>
          )}
        </div>
        <span className="truncate text-sm font-medium text-white">{match.homeTeam.name}</span>
      </div>
      <div className="text-center">
        {showScore && match.score ? (
          <span className="font-mono text-base font-bold text-white sm:text-lg">
            {match.score.home} - {match.score.away}
          </span>
        ) : (
          <span className="font-mono text-sm font-bold text-[#666]">- -</span>
        )}
      </div>
      <div className="flex min-w-0 items-center justify-end gap-2">
        <span className="truncate text-right text-sm font-medium text-white">{match.awayTeam.name}</span>
        <div className="relative h-5 w-5 shrink-0 sm:h-6 sm:w-6">
          {match.awayTeam.logo ? (
            <Image src={match.awayTeam.logo} alt={match.awayTeam.name} fill sizes="24px" className="object-contain" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xs font-bold text-[#666]">
              {match.awayTeam.shortName?.[0] || '?'}
            </span>
          )}
        </div>
      </div>
      {showSecondLine && secondLine && (
        <div className="col-span-1 col-start-2 mt-0.5 truncate text-xs text-[#9a9a9a] group-hover:text-[#b6b6b6]">
          {secondLine}
        </div>
      )}
    </Link>
  )
}
