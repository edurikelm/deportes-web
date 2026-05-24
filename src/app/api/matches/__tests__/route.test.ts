import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const { mockFootballFixtures, mockBasketballFixtures, mockMmaFixtures } = vi.hoisted(() => ({
  mockFootballFixtures: vi.fn(),
  mockBasketballFixtures: vi.fn(),
  mockMmaFixtures: vi.fn(),
}))

vi.mock('@/lib/api/adapterRegistry', () => ({
  ADAPTERS: {
    football: { fetchFixtures: mockFootballFixtures },
    basketball: { fetchFixtures: mockBasketballFixtures },
    mma: { fetchFixtures: mockMmaFixtures },
  },
}))

const baseMatch = {
  id: '1',
  homeTeam: { id: '1', name: 'A', shortName: 'A', logo: '' },
  awayTeam: { id: '2', name: 'B', shortName: 'B', logo: '' },
  startTime: '2026-05-01T14:00:00Z',
  league: { id: '39', name: 'Premier League', country: 'England', logo: '', color: '#000' },
  events: [],
  streamLinks: [],
}

function makeRequest(url: string): NextRequest {
  return new NextRequest(url)
}

describe('GET /api/matches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns matches with no params (defaults to football)', async () => {
    mockFootballFixtures.mockResolvedValue({
      matches: [{ ...baseMatch, sport: 'football' as const, status: 'live' as const }],
      cached: false,
      cacheAge: 0,
    })

    const response = await GET(makeRequest('http://localhost:3000/api/matches'))
    const body = await response.json()

    expect(body.matches).toHaveLength(1)
    expect(body.matches[0].sport).toBe('football')
  })

  it('calls football adapter when sport=football', async () => {
    mockFootballFixtures.mockResolvedValue({
      matches: [{ ...baseMatch, sport: 'football' as const, status: 'finished' as const }],
      cached: false,
      cacheAge: 0,
    })

    await GET(makeRequest('http://localhost:3000/api/matches?sport=football'))

    expect(mockFootballFixtures).toHaveBeenCalledOnce()
    expect(mockBasketballFixtures).not.toHaveBeenCalled()
    expect(mockMmaFixtures).not.toHaveBeenCalled()
  })

  it('calls basketball adapter when sport=basketball', async () => {
    mockBasketballFixtures.mockResolvedValue({
      matches: [{ ...baseMatch, sport: 'basketball' as const, status: 'finished' as const }],
      cached: false,
      cacheAge: 0,
    })

    await GET(makeRequest('http://localhost:3000/api/matches?sport=basketball'))

    expect(mockBasketballFixtures).toHaveBeenCalledOnce()
    expect(mockFootballFixtures).not.toHaveBeenCalled()
  })

  it('filters to live matches when status=live', async () => {
    mockFootballFixtures.mockResolvedValue({
      matches: [
        { ...baseMatch, sport: 'football' as const, status: 'live' as const },
        { ...baseMatch, id: '2', sport: 'football' as const, status: 'finished' as const },
      ],
      cached: false,
      cacheAge: 0,
    })

    const response = await GET(makeRequest('http://localhost:3000/api/matches?sport=football&status=live'))
    const body = await response.json()

    expect(body.matches).toHaveLength(1)
    expect(body.matches[0].status).toBe('live')
  })

  it('filters by league_id', async () => {
    mockFootballFixtures.mockResolvedValue({
      matches: [
        { ...baseMatch, id: '1', sport: 'football' as const, status: 'live' as const, league: { id: '39', name: 'Premier League', country: 'England', logo: '', color: '#000' } },
        { ...baseMatch, id: '2', sport: 'football' as const, status: 'live' as const, league: { id: '140', name: 'La Liga', country: 'Spain', logo: '', color: '#000' } },
      ],
      cached: false,
      cacheAge: 0,
    })

    const response = await GET(makeRequest('http://localhost:3000/api/matches?sport=football&league_id=39'))
    const body = await response.json()

    expect(body.matches).toHaveLength(1)
    expect(body.matches[0].league.id).toBe('39')
  })

  it('returns 400 for malformed sport param', async () => {
    const response = await GET(makeRequest('http://localhost:3000/api/matches?sport=invalid'))
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toContain('invalid')
  })
})
