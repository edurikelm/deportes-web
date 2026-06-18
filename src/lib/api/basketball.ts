import type { FetchFixturesOptions, SportDataAdapter } from './sportDataAdapter'
import type { Match } from '@/lib/types'
import { fetchWithCache, clearCache as sharedClearCache } from './client'
import { formatDateInTimeZone } from '@/lib/date'

const BASE_URL = 'https://v2.nba.api-sports.io'

interface NbaApiResponse {
  response: NbaFixture[]
}

interface NbaFixture {
  id: number
  date: {
    start: string
  }
  status: {
    clock: string | null
    halftime: boolean
    short: number
    long: string
  }
  periods: {
    current: number
    total: number
  }
  league: string
  teams: {
    visitors: {
      id: number
      name: string
      nickname: string
      code: string
      logo: string
    }
    home: {
      id: number
      name: string
      nickname: string
      code: string
      logo: string
    }
  }
  scores: {
    visitors: {
      win: number
      loss: number
      linescore: string[]
      points: number | null
    }
    home: {
      win: number
      loss: number
      linescore: string[]
      points: number | null
    }
  }
}

interface NbaEvent {
  id: number
  time: string
  team: {
    id: number
    name: string
  }
  type: string
  player: {
    id: number
    name: string
  }
  assist?: {
    id: number
    name: string
  }
  description?: string
}

export interface NormalizedBasketballMatch {
  id: string
  sport: 'basketball'
  homeTeam: {
    id: string
    name: string
    shortName: string
    logo: string
  }
  awayTeam: {
    id: string
    name: string
    shortName: string
    logo: string
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
    quarters?: Array<{ home: number; away: number }>
    ht?: { home: number; away: number }
  }
  events: Array<{
    id: string
    type: string
    minute: number
    player?: string
    team?: 'home' | 'away'
    assist?: string
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
export function normalizeBasketballMatch(raw: NbaFixture): NormalizedBasketballMatch {
  const statusShort = raw.status.short
  let status: 'upcoming' | 'live' | 'finished' = 'upcoming'
  if (statusShort === 3) status = 'finished'
  else if (statusShort === 2) status = 'live'

  const startTime = raw.date.start
  const minute = status === 'live' ? raw.periods.current : undefined

  const linescore = raw.scores.visitors.linescore
  const quarters: Array<{ home: number; away: number }> = []
  if (linescore.length === 4) {
    for (let i = 0; i < 4; i++) {
      const homePoints = parseInt(raw.scores.home.linescore[i]) || 0
      const awayPoints = parseInt(linescore[i]) || 0
      quarters.push({ home: homePoints, away: awayPoints })
    }
  }

  return {
    id: String(raw.id),
    sport: 'basketball',
    homeTeam: {
      id: String(raw.teams.home.id),
      name: raw.teams.home.name,
      shortName: raw.teams.home.code,
      logo: raw.teams.home.logo,
    },
    awayTeam: {
      id: String(raw.teams.visitors.id),
      name: raw.teams.visitors.name,
      shortName: raw.teams.visitors.code,
      logo: raw.teams.visitors.logo,
    },
    status,
    startTime,
    minute,
    league: {
      id: 'nba',
      name: 'NBA',
      country: 'USA',
      logo: '',
      color: '#1D428A',
    },
    score: status !== 'upcoming' ? {
      home: raw.scores.home.points ?? 0,
      away: raw.scores.visitors.points ?? 0,
      quarters: quarters.length > 0 ? quarters : undefined,
    } : undefined,
    events: [],
    streamLinks: [],
  }
}

export async function fetchNbaFixtures(date: string, isLive = false): Promise<{
  matches: NormalizedBasketballMatch[]
  cached: boolean
  cacheAge: number
}> {
  const url = `${BASE_URL}/games?date=${date}`

  const { data, cached, cacheAge } = await fetchWithCache<NbaApiResponse>(
    url,
    { headers: { 'x-no-cache': isLive ? 'true' : 'false' } },
    isLive ? 10 : 60,
    'NBA API'
  )

    const errors = (data as any).errors
  if (errors && Object.keys(errors).length > 0) {
    console.error(`Basketball API errors:`, errors)
    return { matches: [], cached: false, cacheAge: 0 }
  }

  const matches = (data.response || []).map(normalizeBasketballMatch)

  return { matches, cached, cacheAge }
}

function getNeighboringDates(date: string): [string, string, string] {
  const d = new Date(date + 'T00:00:00Z')
  const prev = new Date(d)
  prev.setUTCDate(prev.getUTCDate() - 1)
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + 1)
  return [prev.toISOString().slice(0, 10), date, next.toISOString().slice(0, 10)]
}

export class BasketballAdapter implements SportDataAdapter {
  async fetchFixtures({ date, isLive, timeZone }: FetchFixturesOptions) {
    const apiKey = process.env.API_SPORTS_KEY

    if (!apiKey) {
      const { MOCK_BASKETBALL_MATCHES } = await import('@/lib/mock-data')
      let matches = MOCK_BASKETBALL_MATCHES as unknown as Match[]
      if (isLive) {
        matches = matches.filter(m => m.status === 'live')
      }
      return { matches, cached: false, cacheAge: 0 }
    }

    if (timeZone) {
      const dates = getNeighboringDates(date)
      const results = await Promise.all(dates.map(d => fetchNbaFixtures(d, isLive)))
      const allMatches = results.flatMap(r => r.matches)
      const cached = results.some(r => r.cached)
      const cacheAge = Math.max(...results.map(r => r.cacheAge))
      const seen = new Set<string>()
      const deduped = allMatches.filter(m => {
        if (seen.has(m.id)) return false
        seen.add(m.id)
        return true
      })
      const filtered = deduped.filter(m => formatDateInTimeZone(new Date(m.startTime), timeZone) === date)
      return { matches: filtered as unknown as Match[], cached, cacheAge }
    }

    const result = await fetchNbaFixtures(date, isLive)
    return { ...result, matches: result.matches as unknown as Match[] }
  }
}
