import { NextRequest, NextResponse } from 'next/server'
import { ADAPTERS } from '@/lib/api/adapterRegistry'
import { inferSeasonFromDate } from '@/lib/standings'

export const dynamic = 'force-dynamic'

const MIN_SEASON = 1900

function getReasonableMaxSeason(): number {
  return new Date().getFullYear() + 1
}

function isValidSeason(value: string): number | null {
  const season = parseInt(value, 10)
  if (Number.isNaN(season)) return null
  if (String(season) !== value) return null
  if (season < MIN_SEASON || season > getReasonableMaxSeason()) return null
  return season
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport') || 'football'

  if (sport !== 'football') {
    return NextResponse.json(
      { error: `Standings not supported for sport: ${sport}` },
      { status: 400 }
    )
  }

  const seasonParam = searchParams.get('season')
  let season: number

  if (seasonParam === null) {
    season = inferSeasonFromDate(new Date())
  } else {
    const validated = isValidSeason(seasonParam)
    if (validated === null) {
      return NextResponse.json(
        { error: `Invalid season: ${seasonParam}` },
        { status: 400 }
      )
    }
    season = validated
  }

  try {
    const result = await ADAPTERS.football.fetchStandings?.({ leagueId: id, season })

    return NextResponse.json({
      standings: result?.standings ?? null,
      meta: {
        cached: result?.cached ?? false,
        cacheAge: result?.cacheAge ?? 0,
      },
    })
  } catch (error) {
    console.error('Standings API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    )
  }
}
