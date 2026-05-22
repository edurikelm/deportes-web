const API_KEY = process.env.API_FOOTBALL_API_KEY
const BASE_URL = 'https://v1.mma.api-sports.io'

const cache = new Map<string, { data: unknown; timestamp: number }>()

interface CacheEntry {
  data: unknown
  timestamp: number
}

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

async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  ttlSeconds = 60
): Promise<{ data: T; cached: boolean; cacheAge: number }> {
  const cacheKey = url
  const now = Date.now()
  const headers = options.headers as Record<string, string> | undefined
  const noCache = headers?.['x-no-cache'] === 'true'

  if (!noCache) {
    const cached = cache.get(cacheKey) as CacheEntry | undefined
    if (cached && now - cached.timestamp < ttlSeconds * 1000) {
      return { data: cached.data as T, cached: true, cacheAge: Math.floor((now - cached.timestamp) / 1000) }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'x-apisports-key': API_KEY || '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 429 && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey) as CacheEntry
      return { data: cached.data as T, cached: true, cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000) }
    }
    throw new Error(`MMA API Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (!noCache) {
    cache.set(cacheKey, { data, timestamp: now })
  }

  return { data: data as T, cached: false, cacheAge: 0 }
}

export function clearCache() {
  cache.clear()
}

function mapMmaStatus(short: string): 'upcoming' | 'live' | 'finished' {
  const liveStatuses = ['1R', '2R', '3R', '4R', '5R', 'inprogress', 'live']
  const finishedStatuses = ['FT', 'AET', 'finished', 'ko', 'submission', 'decision', 'canceled', 'postponed']

  if (liveStatuses.includes(short)) return 'live'
  if (finishedStatuses.includes(short)) return 'finished'
  return 'upcoming'
}

function mapMmaEventType(type: string): string {
  const map: Record<string, string> = {
    'ko': 'knockout',
    'Knockout': 'knockout',
    'knockout': 'knockout',
    'submission': 'submission',
    'Submission': 'submission',
    'decision': 'decision',
    'Decision': 'decision',
    'tko': 'tko',
    'TKO': 'tko',
    'round': 'round',
    ' Round ': 'round',
    'start': 'start',
    'end': 'end',
  }
  return map[type] || type
}

export function normalizeMmaMatch(raw: MmaFixture): NormalizedMmaMatch {
  const status = mapMmaStatus(raw.status.short)
  const homeFighter = raw.fighters?.home
  const awayFighter = raw.fighters?.away

  const getName = (f: typeof homeFighter) => f?.name || 'Unknown'
  const getShortName = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 3)

  const events: NormalizedMmaMatch['events'] = []

  if (raw.result?.method) {
    const resultMethod = raw.result.method.toLowerCase()
    let eventType = 'decision'
    if (resultMethod.includes('ko') || resultMethod.includes('knockout')) {
      eventType = 'knockout'
    } else if (resultMethod.includes('submission')) {
      eventType = 'submission'
    } else if (resultMethod.includes('tko')) {
      eventType = 'tko'
    }

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
    isLive ? 10 : 60
  )

  const matches = (data.response || []).map(normalizeMmaMatch)

  return { matches, cached, cacheAge }
}
