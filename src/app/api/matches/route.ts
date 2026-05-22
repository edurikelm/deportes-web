import { NextRequest, NextResponse } from 'next/server'
import { ADAPTERS } from '@/lib/api/adapterRegistry'
import type { Sport } from '@/lib/types'

const VALID_SPORTS: Sport[] = ['football', 'basketball', 'mma']

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawSport = searchParams.get('sport') || 'football'

  if (!VALID_SPORTS.includes(rawSport as Sport)) {
    return NextResponse.json(
      { error: `Invalid sport: ${rawSport}`, matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 400 }
    )
  }

  const sport = rawSport as Sport
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const status = searchParams.get('status')
  const leagueId = searchParams.get('league_id')
  const teamId = searchParams.get('team_id')
  const isLive = status === 'live'

  const adapter = ADAPTERS[sport]

  try {
    const { matches, cached, cacheAge } = await adapter.fetchFixtures(date, isLive)

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
    console.error(`${sport} API Error:`, error)
    return NextResponse.json(
      { error: `Failed to fetch ${sport} matches`, matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 500 }
    )
  }
}
