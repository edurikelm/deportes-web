import { NextRequest, NextResponse } from 'next/server'
import { ADAPTERS } from '@/lib/api/adapterRegistry'
import type { Match, Sport } from '@/lib/types'
import { getTodayDateKey } from '@/lib/date'

const VALID_SPORTS: Sport[] = ['football', 'basketball', 'mma']

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

async function fetchAllSports(date: string, isLive: boolean, timeZone: string | undefined) {
  const results = await Promise.allSettled(VALID_SPORTS.map(s => ADAPTERS[s].fetchFixtures({ date, isLive, timeZone })))
  const matches: Match[] = []
  let cached = false
  let cacheAge = 0
  let fulfilledCount = 0
  for (const r of results) {
    if (r.status === 'fulfilled') {
      fulfilledCount++
      matches.push(...r.value.matches)
      if (r.value.cached) cached = true
      if (r.value.cacheAge > cacheAge) cacheAge = r.value.cacheAge
    } else {
      console.error(`fetchAllSports: one adapter failed`, r.reason)
    }
  }
  if (fulfilledCount === 0) {
    throw new Error('All sport adapters failed')
  }
  return { matches, cached, cacheAge }
}

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const rawSport = searchParams.get('sport') || 'football'

  if (rawSport !== 'all' && !VALID_SPORTS.includes(rawSport as Sport)) {
    return NextResponse.json(
      { error: `Invalid sport: ${rawSport}`, matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 400 }
    )
  }

  const rawTimezone = searchParams.get('timezone') || 'UTC'
  const timeZone = isValidTimeZone(rawTimezone) ? rawTimezone : 'UTC'
  const date = searchParams.get('date') || getTodayDateKey(timeZone)
  const status = searchParams.get('status')
  const leagueId = searchParams.get('league_id')
  const teamId = searchParams.get('team_id')
  const isLive = status === 'live'

  try {
    const { matches, cached, cacheAge } = rawSport === 'all'
      ? await fetchAllSports(date, isLive, timeZone)
      : await ADAPTERS[rawSport as Sport].fetchFixtures({ date, isLive, timeZone })

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
    const label = rawSport === 'all' ? 'all sports' : rawSport
    console.error(`${label} API Error:`, error)
    return NextResponse.json(
      { error: `Failed to fetch ${label} matches`, matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 500 }
    )
  }
}
