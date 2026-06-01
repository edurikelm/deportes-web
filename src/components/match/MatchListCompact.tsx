'use client'

import { useState, useMemo } from 'react'
import { Calendar } from 'lucide-react'
import type { Match, Sport } from '@/lib/types'
import { usePinnedLeagues } from '@/hooks/usePinnedLeagues'
import { cn } from '@/lib/utils'
import { SectionHeader } from './SectionHeader'
import { MatchRow } from './MatchRow'

interface MatchListCompactProps {
  matches: Match[]
  sport: Sport
  activeDate: DateOption
  onDateChange: (date: DateOption) => void
  includeAllLeagues: boolean
  onToggleAllLeagues: () => void
}

export type DateOption = 'today' | 'yesterday' | 'tomorrow'
type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished'

const DATE_LABELS: Record<DateOption, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  tomorrow: 'Mañana',
}

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'live', label: 'En vivo' },
  { key: 'upcoming', label: 'Próximos' },
  { key: 'finished', label: 'Finalizados' },
]

export function MatchListCompact({
  matches,
  sport,
  activeDate,
  onDateChange,
  includeAllLeagues,
  onToggleAllLeagues,
}: MatchListCompactProps) {
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('all')
  const { pinnedIds, togglePin, isPinned: checkIsPinned } = usePinnedLeagues(sport)

  const liveCount = useMemo(() => {
    return matches.filter(m => m.status === 'live').length
  }, [matches])

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
    <div className="w-full max-w-5xl px-3 py-3 sm:px-4 lg:py-4">
      <div className="flex items-center gap-2 overflow-x-auto py-3">
        <Calendar className="h-4 w-4 text-[#a1a1a1]" />
        {(Object.keys(DATE_LABELS) as DateOption[]).map(dateKey => (
          <button
            key={dateKey}
            onClick={() => onDateChange(dateKey)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              activeDate === dateKey
                ? 'bg-[#22c55e] text-white'
                : 'bg-[#262626] text-[#a1a1a1] hover:bg-[#333]'
            )}
          >
            {DATE_LABELS[dateKey]}
          </button>
        ))}
        <button
          type="button"
          onClick={onToggleAllLeagues}
          className={cn(
            'ml-1 rounded-full border px-3 py-1 text-sm font-medium transition-colors',
            includeAllLeagues
              ? 'border-[#22c55e] bg-[#102416] text-[#22c55e]'
              : 'border-[#303030] bg-[#171717] text-[#a1a1a1] hover:text-white'
          )}
        >
          {includeAllLeagues ? 'Todas las ligas' : 'Solo importantes'}
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto py-2">
        {STATUS_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium transition-colors',
              activeFilter === key
                ? 'bg-[#22c55e] text-white'
                : 'bg-[#262626] text-[#a1a1a1] hover:bg-[#333]'
            )}
          >
            {label}
            {key === 'live' && liveCount > 0 && (
              <span className="ml-1 rounded-full bg-[#ef4444] px-1.5 py-0.5 text-[10px] font-bold text-white">
                {liveCount}
              </span>
            )}
          </button>
        ))}
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
