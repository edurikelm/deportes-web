import { NextRequest, NextResponse } from 'next/server'
import { ADAPTERS } from '@/lib/api/adapterRegistry'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const searchParams = request.nextUrl.searchParams
  const sport = searchParams.get('sport') || 'football'

  if (sport !== 'football') {
    return NextResponse.json(
      { error: `Lineups not supported for sport: ${sport}` },
      { status: 400 }
    )
  }

  try {
    const result = await ADAPTERS.football.fetchLineup?.(id)

    if (!result?.lineup) {
      return NextResponse.json({ error: 'Lineup not found' }, { status: 404 })
    }

    return NextResponse.json({
      lineup: result.lineup,
      meta: {
        cached: result.cached,
        cacheAge: result.cacheAge,
      },
    })
  } catch (error) {
    console.error('Lineup API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch lineup', lineup: undefined },
      { status: 500 }
    )
  }
}
