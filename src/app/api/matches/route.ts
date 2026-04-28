import { NextRequest, NextResponse } from 'next/server'
import { normalizeMatch } from '@/lib/api/normalizer'
import { fetchWithCache } from '@/lib/api/client'
import { MOCK_MATCHES } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const status = searchParams.get('status')
  const leagueId = searchParams.get('league_id')
  const teamId = searchParams.get('team_id')

  const apiKey = process.env.API_FOOTBALL_API_KEY

  if (!apiKey) {
    let matches = MOCK_MATCHES

    if (status) {
      matches = matches.filter(m => m.status === status)
    }
    if (leagueId) {
      matches = matches.filter(m => m.league.id === leagueId)
    }
    if (teamId) {
      matches = matches.filter(m => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
    }

    return NextResponse.json({
      matches,
      meta: {
        total: matches.length,
        cached: false,
        cacheAge: 0,
      },
    })
  }

  try {
    const today = date || new Date().toISOString().split('T')[0]
    const isLive = status === 'live'
    const url = `https://v3.football.api-sports.io/fixtures?date=${today}`

    const { data, cached, cacheAge } = await fetchWithCache<{
      response: Array<{ fixture: { id: number; date: string }; league: { id: number; name: string; country: string; logo: string }; teams: { home: { id: number; name: string; logo: string }; away: { id: number; name: string; logo: string }; goals: { home: number; away: number } }; status: { long: string; short: string }; score?: { fulltime: { home: number; away: number }; halftime: { home: number; away: number } }; events: Array<{ time: number; team: { id: number }; type: string; player: { name: string }; assist: { name: string }; comment: string }> }>
    }>(url, { headers: { 'x-no-cache': isLive ? 'true' : 'false' } }, isLive ? 10 : 60)

    const matches = data.response.map((f) => {
      const raw = {
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
        status: { code: f.status?.short || 'TBD', description: f.status?.long || 'Match Not Started' },
        score: {
          home: f.teams.goals?.home ?? f.score?.fulltime?.home ?? null,
          away: f.teams.goals?.away ?? f.score?.fulltime?.away ?? null,
          ht: f.score?.halftime,
        },
        events: (f.events || []).map(e => ({
          id: String(e.time),
          type: e.type,
          time: e.time,
          player: e.player,
          team: e.team,
          assist: e.assist,
          comment: e.comment,
        })),
      }
      return normalizeMatch(raw as Parameters<typeof normalizeMatch>[0])
    })

    let filtered = matches
    if (status) {
      filtered = filtered.filter(m => m.status === status)
    }
    if (leagueId) {
      filtered = filtered.filter(m => m.league.id === leagueId)
    }
    if (teamId) {
      filtered = filtered.filter(m => m.homeTeam.id === teamId || m.awayTeam.id === teamId)
    }

    return NextResponse.json({
      matches: filtered,
      meta: {
        total: filtered.length,
        cached,
        cacheAge,
      },
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch matches', matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 500 }
    )
  }
}
