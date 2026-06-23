import type { Lineup, Match } from '@/lib/types'

export interface FetchFixturesOptions {
  date: string
  isLive: boolean
  timeZone?: string
}

export interface LineupResult {
  lineup?: Lineup
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
}
