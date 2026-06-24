import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const { mockFetchStandings } = vi.hoisted(() => ({
  mockFetchStandings: vi.fn(),
}))

vi.mock('@/lib/api/adapterRegistry', () => ({
  ADAPTERS: {
    football: { fetchFixtures: vi.fn(), fetchStandings: mockFetchStandings },
    basketball: { fetchFixtures: vi.fn() },
    mma: { fetchFixtures: vi.fn() },
  },
}))

function makeRequest(url: string): NextRequest {
  return new NextRequest(url)
}

const baseStandings = {
  league: { id: '39', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
  season: 2025,
  standings: [
    {
      rank: 1,
      team: { id: '1', name: 'Arsenal', logo: '' },
      points: 80,
      played: 38,
      wins: 24,
      draws: 8,
      losses: 6,
      goalsFor: 78,
      goalsAgainst: 30,
      goalDifference: 48,
    },
  ],
}

describe('GET /api/leagues/[id]/standings', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 1, 15))
    vi.clearAllMocks()
    mockFetchStandings.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns standings normalized from football adapter', async () => {
    mockFetchStandings.mockResolvedValue({
      standings: baseStandings,
      cached: false,
      cacheAge: 0,
    })

    const response = await GET(
      makeRequest('http://localhost:3000/api/leagues/39/standings?sport=football&season=2025'),
      { params: Promise.resolve({ id: '39' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.standings).toEqual(baseStandings)
    expect(body.meta).toEqual({ cached: false, cacheAge: 0 })
    expect(mockFetchStandings).toHaveBeenCalledWith({ leagueId: '39', season: 2025 })
  })

  it('defaults sport to football and season from current date', async () => {
    mockFetchStandings.mockResolvedValue({
      standings: null,
      cached: false,
      cacheAge: 0,
    })

    await GET(makeRequest('http://localhost:3000/api/leagues/39/standings'), {
      params: Promise.resolve({ id: '39' }),
    })

    expect(mockFetchStandings).toHaveBeenCalledWith({ leagueId: '39', season: 2025 })
  })

  it('returns 400 for non-football sport', async () => {
    const response = await GET(
      makeRequest('http://localhost:3000/api/leagues/39/standings?sport=basketball'),
      { params: Promise.resolve({ id: '39' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('basketball')
  })

  it('returns 400 for invalid season', async () => {
    const response = await GET(
      makeRequest('http://localhost:3000/api/leagues/39/standings?season=abc'),
      { params: Promise.resolve({ id: '39' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('season')
  })

  it('returns 400 for season out of reasonable range', async () => {
    const response = await GET(
      makeRequest('http://localhost:3000/api/leagues/39/standings?season=1899'),
      { params: Promise.resolve({ id: '39' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('season')
  })

  it('returns 200 with standings null when adapter returns no standings', async () => {
    mockFetchStandings.mockResolvedValue({
      standings: null,
      cached: true,
      cacheAge: 30,
    })

    const response = await GET(
      makeRequest('http://localhost:3000/api/leagues/39/standings?sport=football&season=2025'),
      { params: Promise.resolve({ id: '39' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.standings).toBeNull()
    expect(body.meta).toEqual({ cached: true, cacheAge: 30 })
  })

  it('returns 500 when adapter throws', async () => {
    mockFetchStandings.mockRejectedValue(new Error('API down'))

    const response = await GET(
      makeRequest('http://localhost:3000/api/leagues/39/standings?sport=football&season=2025'),
      { params: Promise.resolve({ id: '39' }) }
    )
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('Failed to fetch standings')
  })
})
