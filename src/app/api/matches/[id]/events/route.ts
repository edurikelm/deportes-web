import { NextRequest, NextResponse } from 'next/server'
import { fetchWithCache } from '@/lib/api/client'

export const dynamic = 'force-dynamic'

interface ApiEvent {
  time: { elapsed: number; extra: number | null }
  team: { id: number; name: string; logo: string }
  player: { id: number; name: string }
  assist: { id: number | null; name: string | null } | null
  type: string
  detail: string
  comments: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const [eventsUrl, fixtureUrl] = await Promise.all([
      `https://v3.football.api-sports.io/fixtures/events?fixture=${id}`,
      `https://v3.football.api-sports.io/fixtures?id=${id}`
    ])

    const [eventsData, fixtureData] = await Promise.all([
      fetchWithCache<{ response: ApiEvent[] }>(eventsUrl, {}, 120),
      fetchWithCache<{ response: Array<{ teams: { home: { id: number }; away: { id: number } } }> }>(fixtureUrl, {}, 120)
    ])

    const homeTeamId = fixtureData.data.response[0]?.teams?.home?.id
    const awayTeamId = fixtureData.data.response[0]?.teams?.away?.id

    const events = eventsData.data.response.map((e) => ({
      id: `${e.time.elapsed}-${e.type}`,
      type: mapEventType(e.type, e.detail),
      minute: e.time.elapsed,
      player: e.player?.name,
      team: homeTeamId && e.team.id === homeTeamId ? 'home' as const : 'away' as const,
      assist: e.assist?.name,
      comment: e.comments,
    }))

    return NextResponse.json({
      events,
      meta: {
        cached: eventsData.cached && fixtureData.cached,
        cacheAge: Math.min(eventsData.cacheAge, fixtureData.cacheAge),
      },
    })
  } catch (error) {
    console.error('Events API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events', events: [] },
      { status: 500 }
    )
  }
}

function mapEventType(type: string, detail: string): string {
  if (type === 'Goal') {
    if (detail === 'Penalty') return 'penalty'
    if (detail === 'Own Goal') return 'own_goal'
    return 'goal'
  }
  if (type === 'Card') {
    if (detail === 'Yellow Card') return 'yellow_card'
    if (detail === 'Red Card') return 'red_card'
    return 'yellow_card'
  }
  if (type === 'subst') return 'subst'
  return 'goal'
}