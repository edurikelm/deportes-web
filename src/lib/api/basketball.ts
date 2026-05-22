const API_KEY = process.env.API_FOOTBALL_API_KEY
const BASE_URL = 'https://v2.nba.api-sports.io'

const cache = new Map<string, { data: unknown; timestamp: number }>()

interface CacheEntry {
  data: unknown
  timestamp: number
}

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
    throw new Error(`NBA API Error: ${response.status} ${response.statusText}`)
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

function mapNbaStatus(short: string): 'upcoming' | 'live' | 'finished' {
  const liveStatuses = ['1Q', '2Q', '3Q', '4Q', 'OT', 'inprogress', 'halftime']
  const finishedStatuses = ['FT', 'AET', 'finished', 'canceled', 'postponed']

  if (liveStatuses.includes(short)) return 'live'
  if (finishedStatuses.includes(short)) return 'finished'
  return 'upcoming'
}

function extractMinute(description: string): number | undefined {
  if (!description) return undefined
  const match = description.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : undefined
}

function mapBasketballEventType(type: string): string {
  const map: Record<string, string> = {
    '3points': 'triple',
    '3points Made': 'triple',
    '2points': 'two_pointer',
    '2points Made': 'two_pointer',
    'freethrow': 'freethrow',
    'Free Throw': 'freethrow',
    'rebounds': 'rebound',
    'Rebound': 'rebound',
    'assists': 'assist',
    'Assist': 'assist',
    'steals': 'steal',
    'Steal': 'steal',
    'blocks': 'block',
    'Block': 'block',
    'turnovers': 'turnover',
    'Turnover': 'turnover',
    'fouls': 'foul',
    'Foul': 'foul',
    'substitution': 'substitution',
    'Substitution': 'substitution',
    'timeout': 'timeout',
    'Timeout': 'timeout',
    'start': 'start',
    'end': 'end',
    'jump ball': 'jump_ball',
    'Jump Ball': 'jump_ball',
  }
  return map[type] || type
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
    isLive ? 10 : 60
  )

  const matches = (data.response || []).map(normalizeBasketballMatch)

  return { matches, cached, cacheAge }
}
