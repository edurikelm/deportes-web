'use client'

import { useState, useMemo } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Match, Sport } from '@/lib/types'
import { usePinnedLeagues } from '@/hooks/usePinnedLeagues'
import { cn } from '@/lib/utils'
import { SectionHeader } from './SectionHeader'
import { MatchRow } from './MatchRow'

interface MatchListCompactProps {
  matches: Match[]
  sport: Sport
  activeDate: MatchDateKey
  onDateChange: (date: MatchDateKey) => void
}

export type MatchDateKey = string
type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished'

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'TODOS' },
  { key: 'live', label: 'EN DIRECTO' },
  { key: 'finished', label: 'FINALIZADOS' },
  { key: 'upcoming', label: 'PRÓXIMOS' },
]

const WEEKDAY_LABELS = ['DO', 'LU', 'MA', 'MI', 'JU', 'VI', 'SA']

function toDateKey(date: Date): MatchDateKey {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: MatchDateKey): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function shiftDateKey(dateKey: MatchDateKey, days: number): MatchDateKey {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

function formatDateControl(dateKey: MatchDateKey): string {
  const date = parseDateKey(dateKey)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month} ${WEEKDAY_LABELS[date.getDay()]}`
}

export function getTodayDateKey(): MatchDateKey {
  return toDateKey(new Date())
}

export function MatchListCompact({
  matches,
  sport,
  activeDate,
  onDateChange,
}: MatchListCompactProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all')
  const { pinnedIds, togglePin, isPinned: checkIsPinned } = usePinnedLeagues(sport)

  const liveCount = useMemo(() => {
    return matches.filter(m => m.status === 'live').length
  }, [matches])

  const handleDateShift = (days: number) => {
    onDateChange(shiftDateKey(activeDate, days))
  }

  const filteredMatches = useMemo(() => {
    if (activeFilter === 'all') return matches
    return matches.filter(m => m.status === activeFilter)
  }, [matches, activeFilter])

  const groups = useMemo(() => {
    const grouped = filteredMatches.reduce((acc, match) => {
      const leagueId = match.league.id
      if (!acc[leagueId]) {
        acc[leagueId] = { league: match.league, matches: [] }
      }
      acc[leagueId].matches.push(match)
      return acc
    }, {} as Record<string, { league: Match['league']; matches: Match[] }>)

    return Object.values(grouped).sort((a, b) => {
      const aPinned = pinnedIds.includes(a.league.id) ? 0 : 1
      const bPinned = pinnedIds.includes(b.league.id) ? 0 : 1
      if (aPinned !== bPinned) return aPinned - bPinned
      return 0
    })
  }, [filteredMatches, pinnedIds])

  return (
    <div className="w-full max-w-6xl px-2 py-3 sm:px-4 lg:py-4">
      <div className="rounded-md border border-[#1f1f1f] bg-[#101010] p-2">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {STATUS_FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveFilter(key)}
                className={cn(
                  'flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3.5 text-[11px] font-black uppercase tracking-[0.08em] transition-colors sm:px-4',
                  activeFilter === key
                    ? 'bg-[#ef4444] text-white'
                    : 'bg-[#1a1a1a] text-[#d4d4d4] hover:bg-[#262626] hover:text-white'
                )}
              >
                {label}
                {key === 'live' && liveCount > 0 && (
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-black text-[#ef4444]">
                    {liveCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto md:overflow-visible">
            <div className="flex h-9 shrink-0 items-center overflow-hidden rounded-md border border-[#262626] bg-[#0a0a0a] text-white">
              <button
                type="button"
                aria-label="Fecha anterior"
                onClick={() => handleDateShift(-1)}
                className="flex h-full w-9 items-center justify-center text-[#a1a1a1] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex h-full min-w-[126px] items-center justify-center gap-2 border-x border-[#262626] px-3">
                <CalendarDays className="h-4 w-4 text-[#a1a1a1]" />
                <span className="font-mono text-xs font-black tracking-[0.08em]">
                  {formatDateControl(activeDate)}
                </span>
              </div>
              <button
                type="button"
                aria-label="Fecha siguiente"
                onClick={() => handleDateShift(1)}
                className="flex h-full w-9 items-center justify-center text-[#a1a1a1] transition-colors hover:bg-[#1a1a1a] hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-lg font-semibold text-white">Sin partidos hoy</h3>
          <p className="text-sm text-[#666]">
            No hay partidos programados para esta fecha.
          </p>
        </div>
      ) : (
        groups.map(group => (
          <div
            key={group.league.id}
            className="overflow-hidden border border-[#1f1f1f] bg-[#0d0d0d] first:mt-2 [&+&]:mt-4"
          >
            <SectionHeader
              league={group.league}
              isPinned={checkIsPinned(group.league.id)}
              onTogglePin={() => togglePin(group.league.id)}
            />
            {group.matches.map(match => (
              <MatchRow key={match.id} match={match} />
            ))}
          </div>
        ))
      )}
    </div>
  )
}
