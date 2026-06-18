import type { Match } from '@/lib/types'

export interface FetchFixturesOptions {
  date: string
  isLive: boolean
}

export interface SportDataAdapter {
  fetchFixtures(opts: FetchFixturesOptions): Promise<{
    matches: Match[]
    cached: boolean
    cacheAge: number
  }>
}
