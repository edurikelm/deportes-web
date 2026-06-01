import type { SportDataAdapter } from './sportDataAdapter'
import type { Match } from '@/lib/types'
import type { ApiFootballMatch } from './types'
import { fetchWithCache } from './client'
import { normalizeMatch } from './normalizer'
import { MOCK_MATCHES } from '@/lib/mock-data'
import { resolveStreamLinks } from '@/lib/streaming-links'

type ApiSportsEventTime = number | { elapsed?: number | null; extra?: number | null } | null | undefined

interface ApiSportsFixture {
  fixture: {
    id: number
    date: string
    status: { short?: string | null; long?: string | null; elapsed?: number | null }
  }
  league: { id: number; name: string; country: string; logo: string }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals?: { home?: number | null; away?: number | null }
  score?: {
    fulltime?: { home?: number | null; away?: number | null }
    halftime?: { home: number; away: number }
  }
  events?: Array<{
    type: string
    detail?: string | null
    time?: ApiSportsEventTime
    player?: { name: string }
    team?: { id: number; name?: string }
    assist?: { name: string }
    comment?: string
  }>
  errors?: Record<string, unknown>
}

interface ApiSportsFixturesResponse {
  response?: ApiSportsFixture[]
  errors?: Record<string, unknown>
}

export class FootballAdapter implements SportDataAdapter {
  async fetchFixtures(date: string, isLive: boolean) {
    const apiKey = process.env.API_FOOTBALL_API_KEY

    if (!apiKey) {
      let matches = MOCK_MATCHES
      if (isLive) {
        matches = matches.filter(m => m.status === 'live')
      }
      return { matches, cached: false, cacheAge: 0 }
    }

    const url = `https://v3.football.api-sports.io/fixtures?date=${date}`
    const ttl = isLive ? 10 : 60

    const { data, cached, cacheAge } = await fetchWithCache<ApiSportsFixturesResponse>(
      url,
      { headers: { 'x-no-cache': isLive ? 'true' : 'false' } },
      ttl,
    )

    if (data.errors && Object.keys(data.errors).length > 0) {
      let matches = MOCK_MATCHES
      if (isLive) {
        matches = matches.filter(m => m.status === 'live')
      }
      return { matches, cached: false, cacheAge: 0 }
    }

    const matches: Match[] = (data.response || []).map((f) => {
      const raw: ApiFootballMatch = {
        id: f.fixture.id,
        tournament: {
          id: f.league.id,
          name: f.league.name,
          slug: f.league.name.toLowerCase().replace(/\s+/g, '-'),
          country: f.league.country,
          logo: f.league.logo,
        },
        homeTeam: {
          id: f.teams.home.id,
          name: f.teams.home.name,
          shortName: f.teams.home.name.substring(0, 3),
          logo: f.teams.home.logo,
        },
        awayTeam: {
          id: f.teams.away.id,
          name: f.teams.away.name,
          shortName: f.teams.away.name.substring(0, 3),
          logo: f.teams.away.logo,
        },
        startTime: f.fixture.date,
        status: { code: f.fixture.status.short || 'TBD', description: f.fixture.status.long || 'Match Not Started', elapsed: f.fixture.status.elapsed },
        score: {
          home: f.goals?.home ?? f.score?.fulltime?.home ?? null,
          away: f.goals?.away ?? f.score?.fulltime?.away ?? null,
          ht: f.score?.halftime,
        },
        events: (f.events || []).map((e) => ({
          id: String(typeof e.time === 'number' ? e.time : e.time?.elapsed ?? ''),
          type: e.type,
          detail: e.detail,
          time: e.time,
          player: e.player,
          team: e.team,
          assist: e.assist,
          comment: e.comment,
        })),
      }
      const match = normalizeMatch(raw)
      if (match.streamLinks.length === 0) {
        const links = resolveStreamLinks(match.league.id)
        if (links) match.streamLinks = links
      }
      return match
    })

    return { matches, cached, cacheAge }
  }
}
