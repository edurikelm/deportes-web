import { NextRequest, NextResponse } from 'next/server'
import { fetchMmaFixtures } from '@/lib/api/mma'

const MOCK_MMA_MATCHES = [
  {
    id: 'mma1',
    sport: 'mma' as const,
    homeTeam: {
      id: 'mma-home1',
      name: 'Islam Makhachev',
      shortName: 'IM',
      logo: '',
      nickname: 'The Eagle',
    },
    awayTeam: {
      id: 'mma-away1',
      name: 'Dustin Poirier',
      shortName: 'DP',
      logo: '',
      nickname: 'The Diamond',
    },
    status: 'live' as const,
    startTime: '2026-04-28T22:00:00Z',
    minute: 1,
    league: {
      id: 'mma1',
      name: 'UFC',
      country: 'USA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ultimate_Fighting_Championship_logo.svg/512px-Ultimate_Fighting_Championship_logo.svg.png',
      color: '#B90000',
    },
    score: { home: 0, away: 0 },
    events: [
      {
        id: 'mma-e1',
        type: 'start',
        minute: 0,
        player: 'Islam Makhachev',
        team: 'home' as const,
        comment: 'Fight started',
      },
    ],
    streamLinks: [
      { type: 'tv' as const, name: 'ESPN+ PPV' },
    ],
  },
  {
    id: 'mma2',
    sport: 'mma' as const,
    homeTeam: {
      id: 'mma-home2',
      name: 'Alex Pereira',
      shortName: 'AP',
      logo: '',
      nickname: 'Poison',
    },
    awayTeam: {
      id: 'mma-away2',
      name: 'Jamahal Hill',
      shortName: 'JH',
      logo: '',
      nickname: 'Sweet Dreams',
    },
    status: 'finished' as const,
    startTime: '2026-04-28T20:00:00Z',
    minute: 25,
    league: {
      id: 'mma1',
      name: 'UFC',
      country: 'USA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ultimate_Fighting_Championship_logo.svg/512px-Ultimate_Fighting_Championship_logo.svg.png',
      color: '#B90000',
    },
    score: { home: 1, away: 0 },
    events: [
      {
        id: 'mma-e2',
        type: 'knockout',
        minute: 5,
        player: 'Alex Pereira',
        team: 'home' as const,
        comment: 'Knockout - Round 1 at 2:35',
      },
    ],
    streamLinks: [
      { type: 'tv' as const, name: 'ESPN+ PPV' },
    ],
  },
  {
    id: 'mma3',
    sport: 'mma' as const,
    homeTeam: {
      id: 'mma-home3',
      name: 'Julianna Pena',
      shortName: 'JP',
      logo: '',
      nickname: 'The Venezuelan Vixen',
    },
    awayTeam: {
      id: 'mma-away3',
      name: 'Amanda Nunes',
      shortName: 'AN',
      logo: '',
      nickname: 'The Lioness',
    },
    status: 'upcoming' as const,
    startTime: '2026-04-29T02:00:00Z',
    minute: undefined,
    league: {
      id: 'mma1',
      name: 'UFC',
      country: 'USA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ultimate_Fighting_Championship_logo.svg/512px-Ultimate_Fighting_Championship_logo.svg.png',
      color: '#B90000',
    },
    score: undefined,
    events: [],
    streamLinks: [
      { type: 'stream' as const, name: 'ESPN+', url: 'https://espn.com/espnplus' },
    ],
  },
  {
    id: 'mma4',
    sport: 'mma' as const,
    homeTeam: {
      id: 'mma-home4',
      name: 'Charles Oliveira',
      shortName: 'CO',
      logo: '',
      nickname: 'Do Bronx',
    },
    awayTeam: {
      id: 'mma-away4',
      name: 'Arman Tsarukyan',
      shortName: 'AT',
      logo: '',
      nickname: 'The Armenian Tiger',
    },
    status: 'finished' as const,
    startTime: '2026-04-28T18:00:00Z',
    minute: 15,
    league: {
      id: 'mma2',
      name: 'UFC',
      country: 'USA',
      logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Ultimate_Fighting_Championship_logo.svg/512px-Ultimate_Fighting_Championship_logo.svg.png',
      color: '#B90000',
    },
    score: { home: 1, away: 0 },
    events: [
      {
        id: 'mma-e3',
        type: 'submission',
        minute: 3,
        player: 'Charles Oliveira',
        team: 'home' as const,
        comment: 'Submission - Round 3 at 4:12 (Rear Naked Choke)',
      },
    ],
    streamLinks: [
      { type: 'tv' as const, name: 'ESPN+ PPV' },
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
    let matches = MOCK_MMA_MATCHES

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

    const { matches, cached, cacheAge } = await fetchMmaFixtures(today, isLive)

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
    console.error('MMA API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch MMA matches', matches: [], meta: { total: 0, cached: false, cacheAge: 0 } },
      { status: 500 }
    )
  }
}
