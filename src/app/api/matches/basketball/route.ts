import { NextRequest, NextResponse } from 'next/server'
import { fetchNbaFixtures } from '@/lib/api/basketball'

const MOCK_BASKETBALL_MATCHES = [
  {
    id: 'b1',
    sport: 'basketball' as const,
    homeTeam: {
      id: 'b-home1',
      name: 'Los Angeles Lakers',
      shortName: 'LAL',
      logo: 'https://cdn.nba.com/logos/nba/1610612747/global/L/logo.svg',
    },
    awayTeam: {
      id: 'b-away1',
      name: 'Boston Celtics',
      shortName: 'BOS',
      logo: 'https://cdn.nba.com/logos/nba/1610612738/global/L/logo.svg',
    },
    status: 'live' as const,
    startTime: '2026-04-28T19:30:00Z',
    minute: 3,
    league: {
      id: 'b1',
      name: 'NBA',
      country: 'USA',
      logo: 'https://cdn.nba.com/logos/nba/primary/L/logo.svg',
      color: '#1D428A',
    },
    score: {
      home: 15,
      away: 12,
      quarters: [
        { home: 15, away: 12 },
      ],
    },
    events: [
      {
        id: 'e1',
        type: 'triple',
        minute: 1,
        player: 'LeBron James',
        team: 'home' as const,
        comment: '3pts',
      },
      {
        id: 'e2',
        type: 'two_pointer',
        minute: 2,
        player: 'Jayson Tatum',
        team: 'away' as const,
        comment: '2pts',
      },
      {
        id: 'e3',
        type: 'triple',
        minute: 3,
        player: 'Anthony Davis',
        team: 'home' as const,
        comment: '3pts',
      },
      {
        id: 'e4',
        type: 'foul',
        minute: 2,
        player: 'Jaylen Brown',
        team: 'away' as const,
        comment: 'Personal foul',
      },
    ],
    streamLinks: [
      { type: 'tv' as const, name: 'ESPN' },
      { type: 'stream' as const, name: 'NBA League Pass', url: 'https://nba. leaguepass.nba.com' },
    ],
  },
  {
    id: 'b2',
    sport: 'basketball' as const,
    homeTeam: {
      id: 'b-home2',
      name: 'Golden State Warriors',
      shortName: 'GSW',
      logo: 'https://cdn.nba.com/logos/nba/1610612744/global/L/logo.svg',
    },
    awayTeam: {
      id: 'b-away2',
      name: 'Miami Heat',
      shortName: 'MIA',
      logo: 'https://cdn.nba.com/logos/nba/1610612748/global/L/logo.svg',
    },
    status: 'live' as const,
    startTime: '2026-04-28T21:00:00Z',
    minute: 8,
    league: {
      id: 'b1',
      name: 'NBA',
      country: 'USA',
      logo: 'https://cdn.nba.com/logos/nba/primary/L/logo.svg',
      color: '#1D428A',
    },
    score: {
      home: 28,
      away: 24,
      quarters: [
        { home: 28, away: 24 },
      ],
    },
    events: [
      {
        id: 'e5',
        type: 'triple',
        minute: 4,
        player: 'Stephen Curry',
        team: 'home' as const,
        comment: '3pts',
      },
      {
        id: 'e6',
        type: 'two_pointer',
        minute: 5,
        player: 'Jimmy Butler',
        team: 'away' as const,
        comment: '2pts',
      },
      {
        id: 'e7',
        type: 'assist',
        minute: 4,
        player: 'Draymond Green',
        team: 'home' as const,
        assist: 'Stephen Curry',
        comment: 'Assist',
      },
      {
        id: 'e8',
        type: 'freethrow',
        minute: 6,
        player: 'Bam Adebayo',
        team: 'away' as const,
        comment: '1/2 FT',
      },
      {
        id: 'e9',
        type: 'rebound',
        minute: 7,
        player: 'Kevon Looney',
        team: 'home' as const,
        comment: 'Defensive rebound',
      },
      {
        id: 'e10',
        type: 'turnover',
        minute: 8,
        player: 'Tyler Herro',
        team: 'away' as const,
        comment: 'Lost ball',
      },
    ],
    streamLinks: [
      { type: 'tv' as const, name: 'TNT' },
      { type: 'stream' as const, name: 'NBA League Pass', url: 'https://nba.leaguepass.nba.com' },
    ],
  },
  {
    id: 'b3',
    sport: 'basketball' as const,
    homeTeam: {
      id: 'b-home3',
      name: 'Brooklyn Nets',
      shortName: 'BKN',
      logo: 'https://cdn.nba.com/logos/nba/1610612751/global/L/logo.svg',
    },
    awayTeam: {
      id: 'b-away3',
      name: 'Philadelphia 76ers',
      shortName: 'PHI',
      logo: 'https://cdn.nba.com/logos/nba/1610612755/global/L/logo.svg',
    },
    status: 'upcoming' as const,
    startTime: '2026-04-29T00:00:00Z',
    minute: undefined,
    league: {
      id: 'b1',
      name: 'NBA',
      country: 'USA',
      logo: 'https://cdn.nba.com/logos/nba/primary/L/logo.svg',
      color: '#1D428A',
    },
    score: undefined,
    events: [],
    streamLinks: [
      { type: 'tv' as const, name: 'ESPN' },
    ],
  },
  {
    id: 'b4',
    sport: 'basketball' as const,
    homeTeam: {
      id: 'b-home4',
      name: 'Chicago Bulls',
      shortName: 'CHI',
      logo: 'https://cdn.nba.com/logos/nba/1610612741/global/L/logo.svg',
    },
    awayTeam: {
      id: 'b-away4',
      name: 'Milwaukee Bucks',
      shortName: 'MIL',
      logo: 'https://cdn.nba.com/logos/nba/1610612749/global/L/logo.svg',
    },
    status: 'finished' as const,
    startTime: '2026-04-28T02:00:00Z',
    minute: 48,
    league: {
      id: 'b1',
      name: 'NBA',
      country: 'USA',
      logo: 'https://cdn.nba.com/logos/nba/primary/L/logo.svg',
      color: '#1D428A',
    },
    score: {
      home: 112,
      away: 118,
      quarters: [
        { home: 28, away: 30 },
        { home: 24, away: 29 },
        { home: 32, away: 28 },
        { home: 28, away: 31 },
      ],
      ht: { home: 52, away: 59 },
    },
    events: [
      {
        id: 'e11',
        type: 'triple',
        minute: 10,
        player: 'DeMar DeRozan',
        team: 'home' as const,
        comment: '3pts',
      },
      {
        id: 'e12',
        type: 'triple',
        minute: 20,
        player: 'Giannis Antetokounmpo',
        team: 'away' as const,
        comment: '3pts',
      },
      {
        id: 'e13',
        type: 'two_pointer',
        minute: 34,
        player: 'Damian Lillard',
        team: 'home' as const,
        comment: '2pts',
      },
      {
        id: 'e14',
        type: 'block',
        minute: 41,
        player: 'Brook Lopez',
        team: 'away' as const,
        comment: 'Blocked shot',
      },
      {
        id: 'e15',
        type: 'steal',
        minute: 45,
        player: 'Jrue Holiday',
        team: 'away' as const,
        comment: 'Steal',
      },
    ],
    streamLinks: [
      { type: 'tv' as const, name: 'NBA League Pass' },
    ],
  },
]

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const status = searchParams.get('status')
  const teamId = searchParams.get('team_id')

  const apiKey = process.env.API_FOOTBALL_API_KEY

  if (!apiKey) {
    let matches = MOCK_BASKETBALL_MATCHES

    if (status) {
      matches = matches.filter(m => m.status === status)
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

    const { matches, cached, cacheAge } = await fetchNbaFixtures(today, isLive)

    let filtered = matches
    if (status) {
      filtered = filtered.filter(m => m.status === status)
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
    console.error('NBA API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch basketball matches', matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 500 }
    )
  }
}
