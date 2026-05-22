'use client'

import type { Match, SportConfig } from '@/lib/types'
import { getSportConfig } from '@/lib/types'
import { MatchCard } from './MatchCard'

interface MatchListProps {
  matches: Match[]
  sportConfig?: SportConfig
}

export function MatchList({ matches, sportConfig }: MatchListProps) {
  const effectiveConfig = sportConfig || getSportConfig(matches[0]?.sport || 'football')
  const groupedMatches = matches.reduce((acc, match) => {
    const leagueId = match.league.id
    if (!acc[leagueId]) {
      acc[leagueId] = {
        league: match.league,
        matches: [],
      }
    }
    acc[leagueId].matches.push(match)
    return acc
  }, {} as Record<string, { league: Match['league']; matches: Match[] }>)

  const leagues = Object.values(groupedMatches)

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 text-6xl">⚽</div>
        <h3 className="mb-2 text-lg font-semibold text-white">No matches today</h3>
        <p className="text-sm text-[#666]">
          There are no scheduled matches for this date.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {leagues.map(({ league, matches: leagueMatches }) => (
        <div key={league.id}>
          <div className="mb-4 flex items-center gap-3">
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: league.color }}
            />
            <h2 className="text-sm font-semibold text-[#a1a1a1]">
              {league.name}
            </h2>
            <div
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: league.color }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leagueMatches.map((match) => (
              <MatchCard key={match.id} match={match} sportConfig={effectiveConfig} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
