import { NextRequest, NextResponse } from 'next/server'
import { MOCK_MATCHES } from '@/lib/mock-data'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const apiKey = process.env.API_FOOTBALL_API_KEY

  if (!apiKey) {
    const match = MOCK_MATCHES.find(m => m.id === id)
    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }
    return NextResponse.json({ match })
  }

  try {
    const url = `https://v3.football.api-sports.io/fixtures?id=${id}`
    const { data } = await fetchWithCache<{
      response: Array<{
        fixture: { id: number; date: string; status: { short: string; long: string; elapsed: number | null } }
        league: { id: number; name: string; country: string; logo: string }
        teams: {
          home: { id: number; name: string; logo: string }
          away: { id: number; name: string; logo: string }
        }
        goals: { home: number; away: number }
        status: { long: string; short: string }
        score?: {
          fulltime: { home: number; away: number }
          halftime: { home: number; away: number }
        }
        events: Array<{
          time: number | { elapsed?: number | null; extra?: number | null }
          team: { id: number }
          type: string
          detail?: string | null
          player: { name: string }
          assist: { name: string }
          comment: string
        }>
      }>
    }>(url, {}, 60)

    if (!data.response || data.response.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    const f = data.response[0]
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
      status: { code: f.fixture.status.short || 'TBD', description: f.fixture.status.long || 'Match Not Started', elapsed: f.fixture.status.elapsed },
      score: {
        home: f.goals?.home ?? f.score?.fulltime?.home ?? null,
        away: f.goals?.away ?? f.score?.fulltime?.away ?? null,
        ht: f.score?.halftime,
      },
      events: (f.events || []).map(e => ({
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
    const match = normalizeMatch(raw as Parameters<typeof normalizeMatch>[0])

    return NextResponse.json({ match })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 })
  }
}

import { normalizeMatch } from '@/lib/api/normalizer'
import { fetchWithCache } from '@/lib/api/client'
