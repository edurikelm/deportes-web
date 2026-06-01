'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Match, MatchEvent } from '@/lib/types'
import { useMatchClock } from '@/hooks/useMatchClock'
import { useMatchClockContext } from './MatchClockContext'

interface MatchRowProps {
  match: Match
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

const GOAL_TYPES = new Set(['goal', 'own_goal', 'penalty'])

function getPlayerName(player: unknown): string {
  if (typeof player === 'string') return player
  if (player && typeof player === 'object') {
    const p = player as Record<string, unknown>
    return (p.name || p.shortName || '') as string
  }
  return ''
}

function formatEventMinute(minute: unknown): string {
  if (typeof minute === 'number') return `${minute}'`
  if (minute && typeof minute === 'object') {
    const m = minute as Record<string, unknown>
    const elapsed = typeof m.elapsed === 'number' ? m.elapsed : 0
    const extra = typeof m.extra === 'number' ? m.extra : 0
    return `${elapsed + extra}'`
  }
  return ''
}

function getGoalScorers(events: MatchEvent[], team: 'home' | 'away'): string[] {
  return events
    .filter(e => GOAL_TYPES.has(e.type) && e.team === team && e.player)
    .sort((a, b) => a.minute - b.minute)
    .map(e => `${getPlayerName(e.player)} ${formatEventMinute(e.minute)}`.trim())
}

export function MatchRow({ match }: MatchRowProps) {
  const { lastFetchTimestamp } = useMatchClockContext()
  const clock = useMatchClock(match, lastFetchTimestamp)
  const showScore = match.status !== 'upcoming' && match.score != null
  const streamInfo = match.streamLinks.length > 0 ? match.streamLinks.map(s => s.name).join(' · ') : null

  const homeScorers = getGoalScorers(match.events, 'home')
  const awayScorers = getGoalScorers(match.events, 'away')
  const showScorers = showScore && (homeScorers.length > 0 || awayScorers.length > 0)

  return (
    <Link
      href={`/match/${match.id}`}
      className="group grid grid-cols-[84px_minmax(0,1fr)_72px_minmax(0,1fr)] items-center gap-x-2 border-b border-[#1f1f1f] px-3 py-2.5 transition-colors hover:bg-[#121212] sm:grid-cols-[116px_minmax(0,1fr)_96px_minmax(0,1fr)] sm:gap-x-3 sm:px-4"
    >
      <div className={streamInfo || showScorers ? 'row-span-2 self-start pt-0.5' : ''}>
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
      <div className={streamInfo && !showScorers ? 'row-span-2 flex items-center justify-center' : 'flex items-center justify-center'}>
        {showScore && match.score ? (
          <span className="font-mono text-base font-bold text-white sm:text-lg">
            {match.score.home} - {match.score.away}
          </span>
        ) : (
          <span className="font-mono text-sm font-bold text-[#666]">- -</span>
        )}
      </div>
      <div className={streamInfo && !showScorers ? 'row-span-2 flex min-w-0 items-center justify-end gap-2' : 'flex min-w-0 items-center justify-end gap-2'}>
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
      {showScorers && (
        <>
          {homeScorers.length > 0 && (
            <div className="col-start-2 mt-0.5 space-y-0.5 text-xs text-[#9a9a9a] group-hover:text-[#b6b6b6]">
              {homeScorers.map((scorer) => (
                <span key={scorer} className="block break-words">
                  {scorer}
                </span>
              ))}
            </div>
          )}
          {awayScorers.length > 0 && (
            <div className="col-start-4 mt-0.5 space-y-0.5 text-right text-xs text-[#9a9a9a] group-hover:text-[#b6b6b6]">
              {awayScorers.map((scorer) => (
                <span key={scorer} className="block break-words">
                  {scorer}
                </span>
              ))}
            </div>
          )}
        </>
      )}
      {streamInfo && (
        <div className="col-start-3 mt-0.5 truncate text-center text-xs text-[#9a9a9a] group-hover:text-[#b6b6b6]">
          {streamInfo}
        </div>
      )}
    </Link>
  )
}
