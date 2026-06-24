import type { LeagueStandings, Lineup, Match, Season } from '@/lib/types'

export interface FetchFixturesOptions {
  date: string
  isLive: boolean
  timeZone?: string
}

export interface FetchStandingsOptions {
  leagueId: string
  season: Season
}

export interface LineupResult {
  lineup?: Lineup
  cached: boolean
  cacheAge: number
}

export interface StandingsResult {
  standings: LeagueStandings | null
  cached: boolean
  cacheAge: number
}

export interface SportDataAdapter {
  fetchFixtures(opts: FetchFixturesOptions): Promise<{
    matches: Match[]
    cached: boolean
    cacheAge: number
  }>
  fetchLineup?(matchId: string): Promise<LineupResult>
  fetchStandings?(opts: FetchStandingsOptions): Promise<StandingsResult>
}
