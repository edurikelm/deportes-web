import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/youtube', () => ({
  searchHighlightVideo: vi.fn(),
  getYouTubeEmbedUrl: vi.fn((id: string) => `https://www.youtube.com/embed/${id}`),
  getYouTubeThumbnailUrl: vi.fn((id: string) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`),
}))

function makeUrl(base: string): string {
  return `http://localhost:3000/api/highlights${base}`
}

describe('GET /api/highlights', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when missing required params', async () => {
    const { GET } = await import('../route')
    const res = await GET(new NextRequest(makeUrl('')))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Missing required params')
  })

  it('returns 400 when minute is not a number', async () => {
    const { GET } = await import('../route')
    const res = await GET(new NextRequest(makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&minute=abc&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England')))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('minute must be a number')
  })

  it('allows match summary requests without minute or eventType', async () => {
    const { GET } = await import('../route')
    const { searchHighlightVideo } = await import('@/lib/api/youtube')
    ;(searchHighlightVideo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const res = await GET(new NextRequest(makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England')))

    expect(res.status).toBe(200)
    const ctx = (searchHighlightVideo as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(ctx.minute).toBeUndefined()
    expect(ctx.eventType).toBeUndefined()
  })

  it('returns 400 when event minute is not a number', async () => {
    const { GET } = await import('../route')
    const res = await GET(new NextRequest(makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&minute=abc&eventType=goal&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England')))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('minute must be a number')
  })

  it('returns 400 when missing startTime', async () => {
    const { GET } = await import('../route')
    const res = await GET(new NextRequest(makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&minute=23&leagueName=Premier%20League&leagueCountry=England')))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('Missing required params')
  })

  it('returns videoUrl when YouTube finds a match', async () => {
    const { GET } = await import('../route')
    const { searchHighlightVideo } = await import('@/lib/api/youtube')
    ;(searchHighlightVideo as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      videoId: 'abc123',
      title: 'Arsenal vs Chelsea 23 gol',
      thumbnail: 'https://img.youtube.com/vi/abc123/hqdefault.jpg',
      channelTitle: 'ESPN',
      publishedAt: '2026-04-29T00:00:00Z',
    })

    const url = makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&minute=23&eventType=goal&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England')
    const res = await GET(new NextRequest(url))
    const body = await res.json()

    expect(body.videoUrl).toContain('youtube.com/embed/abc123')
    expect(body.title).toBe('Arsenal vs Chelsea 23 gol')
  })

  it('returns null videoUrl when YouTube finds no good match', async () => {
    const { GET } = await import('../route')
    const { searchHighlightVideo } = await import('@/lib/api/youtube')
    ;(searchHighlightVideo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const url = makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&minute=23&eventType=goal&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England')
    const res = await GET(new NextRequest(url))
    const body = await res.json()

    expect(body.videoUrl).toBeNull()
    expect(body.title).toBeNull()
  })

  it('passes all new params to searchHighlightVideo', async () => {
    const { GET } = await import('../route')
    const { searchHighlightVideo } = await import('@/lib/api/youtube')
    ;(searchHighlightVideo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const url = makeUrl('?matchId=fixture-123&homeTeam=Arsenal&awayTeam=Chelsea&minute=23&eventType=goal&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England&player=Saka&eventTeam=home')
    await GET(new NextRequest(url))

    expect(searchHighlightVideo).toHaveBeenCalledOnce()
    const ctx = (searchHighlightVideo as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(ctx.matchId).toBe('fixture-123')
    expect(ctx.homeTeam).toBe('Arsenal')
    expect(ctx.awayTeam).toBe('Chelsea')
    expect(ctx.minute).toBe(23)
    expect(ctx.eventType).toBe('goal')
    expect(ctx.startTime).toBe('2026-04-28T14:00:00Z')
    expect(ctx.leagueName).toBe('Premier League')
    expect(ctx.leagueCountry).toBe('England')
    expect(ctx.player).toBe('Saka')
    expect(ctx.eventTeam).toBe('home')
  })

  it('handles optional player and eventTeam as undefined', async () => {
    const { GET } = await import('../route')
    const { searchHighlightVideo } = await import('@/lib/api/youtube')
    ;(searchHighlightVideo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const url = makeUrl('?matchId=1&homeTeam=Arsenal&awayTeam=Chelsea&minute=23&eventType=goal&startTime=2026-04-28T14:00:00Z&leagueName=Premier%20League&leagueCountry=England')
    await GET(new NextRequest(url))

    const ctx = (searchHighlightVideo as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(ctx.player).toBeUndefined()
    expect(ctx.eventTeam).toBeUndefined()
  })
})

import { NextRequest } from 'next/server'
