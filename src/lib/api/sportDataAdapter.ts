import type { Match } from '@/lib/types'

export interface SportDataAdapter {
  fetchFixtures(date: string, isLive: boolean): Promise<{
    matches: Match[]
    cached: boolean
    cacheAge: number
  }>
}
