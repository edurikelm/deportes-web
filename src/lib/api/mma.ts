import type { FetchFixturesOptions, SportDataAdapter } from './sportDataAdapter'
import type { Match } from '@/lib/types'
import { fetchWithCache, clearCache as sharedClearCache } from './client'

const BASE_URL = 'https://v1.mma.api-sports.io'

interface MmaApiResponse {
  response: MmaFixture[]
}

interface MmaFixture {
  id: number
  date: string
  time?: string
  status: {
    long: string
    short: string
  }
  league: {
    id: number
    name: string
    logo: string
  }
  fighter?: {
    id: number
    name: string
    logo: string
  }
  fighters?: {
    home: {
      id: number
      name: string
      logo: string
      nickname?: string
    }
    away: {
      id: number
      name: string
      logo: string
      nickname?: string
    }
  }
  result?: {
    winner?: {
      id: number
      name: string
    }
    method?: string
    round?: number
    time?: string
  }
}

export interface NormalizedMmaMatch {
  id: string
  sport: 'mma'
  homeTeam: {
    id: string
    name: string
    shortName: string
    logo: string
    nickname?: string
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
    logo: string
    nickname?: string
  }
  status: 'upcoming' | 'live' | 'finished'
  startTime: string
  minute?: number
  league: {
    id: string
    name: string
    country: string
    logo: string
    color: string
  }
  score?: {
    home: number
    away: number
  }
  events: Array<{
    id: string
    type: string
    minute: number
    player?: string
    team?: 'home' | 'away'
    comment?: string
    extra?: Record<string, unknown>
  }>
  streamLinks: Array<{
    type: 'tv' | 'stream'
    name: string
    url?: string
  }>
}

export function clearCache() {
  sharedClearCache()
}

function mapMmaStatus(short: string): 'upcoming' | 'live' | 'finished' {
  const liveStatuses = ['1R', '2R', '3R', '4R', '5R', 'inprogress', 'live']
  const finishedStatuses = ['FT', 'AET', 'finished', 'ko', 'submission', 'decision', 'canceled', 'postponed']

  if (liveStatuses.includes(short)) return 'live'
  if (finishedStatuses.includes(short)) return 'finished'
  return 'upcoming'
}

export function mapMmaEventType(type: string): string {
  const map: Record<string, string> = {
    'ko': 'knockout',
    'knockout': 'knockout',
    'submission': 'submission',
    'decision': 'decision',
    'tko': 'tko',
    'round': 'round',
    'start': 'start',
    'end': 'end',
  }
  return map[type.toLowerCase().trim()] || type
}

export function normalizeMmaMatch(raw: MmaFixture): NormalizedMmaMatch {
  const status = mapMmaStatus(raw.status.short)
  const homeFighter = raw.fighters?.home
  const awayFighter = raw.fighters?.away

  const getName = (f: typeof homeFighter) => f?.name || 'Unknown'
  const getShortName = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 3)

  const events: NormalizedMmaMatch['events'] = []

  if (raw.result?.method) {
    const eventType = mapMmaEventType(raw.result.method)

    events.push({
      id: `result-${raw.id}`,
      type: eventType,
      minute: raw.result.round ? raw.result.round * 5 : 0,
      player: raw.result.winner?.name,
      comment: `${raw.result.method}${raw.result.round ? ` - Round ${raw.result.round}` : ''}${raw.result.time ? ` at ${raw.result.time}` : ''}`,
    })
  }

  return {
    id: String(raw.id),
    sport: 'mma',
    homeTeam: {
      id: String(homeFighter?.id || raw.id),
      name: getName(homeFighter),
      shortName: getShortName(getName(homeFighter)),
      logo: homeFighter?.logo || '',
      nickname: homeFighter?.nickname,
    },
    awayTeam: {
      id: String(awayFighter?.id || raw.id + 1),
      name: getName(awayFighter),
      shortName: getShortName(getName(awayFighter)),
      logo: awayFighter?.logo || '',
      nickname: awayFighter?.nickname,
    },
    status,
    startTime: raw.date,
    minute: status === 'live' ? 1 : undefined,
    league: {
      id: String(raw.league.id),
      name: raw.league.name,
      country: 'International',
      logo: raw.league.logo,
      color: '#B90000',
    },
    score: status === 'finished' ? { home: 1, away: 0 } : undefined,
    events,
    streamLinks: [],
  }
}

export async function fetchMmaFixtures(date: string, isLive = false): Promise<{
  matches: NormalizedMmaMatch[]
  cached: boolean
  cacheAge: number
}> {
  const url = `${BASE_URL}/fights?date=${date}`

  const { data, cached, cacheAge } = await fetchWithCache<MmaApiResponse>(
    url,
    { headers: { 'x-no-cache': isLive ? 'true' : 'false' } },
    isLive ? 10 : 60,
    'MMA API'
  )

  const errors = (data as any).errors
  if (errors && Object.keys(errors).length > 0) {
    console.error(`MMA API errors:`, errors)
    return { matches: [], cached: false, cacheAge: 0 }
  }

  const matches = (data.response || []).map(normalizeMmaMatch)

  return { matches, cached, cacheAge }
}

export class MmaAdapter implements SportDataAdapter {
  async fetchFixtures({ date, isLive }: FetchFixturesOptions) {
    const apiKey = process.env.API_SPORTS_KEY

    if (!apiKey) {
      const { MOCK_MMA_MATCHES } = await import('@/lib/mock-data')
      let matches = MOCK_MMA_MATCHES as unknown as Match[]
      if (isLive) {
        matches = matches.filter(m => m.status === 'live')
      }
      return { matches, cached: false, cacheAge: 0 }
    }

    const result = await fetchMmaFixtures(date, isLive)
    return { ...result, matches: result.matches as unknown as Match[] }
  }
}
