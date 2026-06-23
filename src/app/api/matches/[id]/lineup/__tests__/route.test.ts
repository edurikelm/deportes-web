import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '../route'

const { mockFetchLineup } = vi.hoisted(() => ({
  mockFetchLineup: vi.fn(),
}))

vi.mock('@/lib/api/adapterRegistry', () => ({
  ADAPTERS: {
    football: { fetchFixtures: vi.fn(), fetchLineup: mockFetchLineup },
    basketball: { fetchFixtures: vi.fn() },
    mma: { fetchFixtures: vi.fn() },
  },
}))

function makeRequest(url: string): NextRequest {
  return new NextRequest(url)
}

const baseLineup = {
  home: {
    team: { id: '1', name: 'Arsenal', logo: '' },
    formation: '4-2-3-1',
    coach: 'Arteta',
    startXI: [{ id: 'p1', name: 'Raya', number: 22, pos: 'G', grid: '1:1' }],
    substitutes: [],
  },
  away: {
    team: { id: '2', name: 'Chelsea', logo: '' },
    formation: '4-3-3',
    coach: 'Maresca',
    startXI: [{ id: 'p21', name: 'Sanchez', number: 1, pos: 'G', grid: '1:1' }],
    substitutes: [],
  },
}

describe('GET /api/matches/[id]/lineup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchLineup.mockReset()
  })

  it('returns lineup normalized from football adapter', async () => {
    mockFetchLineup.mockResolvedValue({
      lineup: baseLineup,
      cached: false,
      cacheAge: 0,
    })

    const response = await GET(makeRequest('http://localhost:3000/api/matches/123/lineup?sport=football'), { params: Promise.resolve({ id: '123' }) })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.lineup).toEqual(baseLineup)
    expect(body.meta).toEqual({ cached: false, cacheAge: 0 })
    expect(mockFetchLineup).toHaveBeenCalledWith('123')
  })

  it('returns 404 when adapter returns no lineup data', async () => {
    mockFetchLineup.mockResolvedValue({
      cached: false,
      cacheAge: 0,
    })

    const response = await GET(makeRequest('http://localhost:3000/api/matches/123/lineup?sport=football'), { params: Promise.resolve({ id: '123' }) })
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body.error).toContain('Lineup not found')
  })

  it('returns 400 for non-football sport', async () => {
    const response = await GET(makeRequest('http://localhost:3000/api/matches/123/lineup?sport=basketball'), { params: Promise.resolve({ id: '123' }) })
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toContain('basketball')
  })

  it('defaults to football when sport is omitted', async () => {
    mockFetchLineup.mockResolvedValue({
      cached: false,
      cacheAge: 0,
    })

    await GET(makeRequest('http://localhost:3000/api/matches/123/lineup'), { params: Promise.resolve({ id: '123' }) })

    expect(mockFetchLineup).toHaveBeenCalledWith('123')
  })

  it('returns 500 when adapter throws', async () => {
    mockFetchLineup.mockRejectedValue(new Error('API down'))

    const response = await GET(makeRequest('http://localhost:3000/api/matches/123/lineup?sport=football'), { params: Promise.resolve({ id: '123' }) })
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toContain('Failed to fetch lineup')
  })
})
