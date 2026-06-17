import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'
import type { HighlightSearchContext, YouTubeSearchResult } from '../youtube'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const ORIGINAL_YOUTUBE_KEY = process.env.YOUTUBE_API_KEY

let testCounter = 0
function makeCtx(overrides: Partial<HighlightSearchContext> = {}): HighlightSearchContext {
  testCounter++
  return {
    matchId: `test-match-${testCounter}`,
    homeTeam: 'Arsenal FC',
    awayTeam: 'Chelsea FC',
    minute: 23,
    eventType: 'goal',
    startTime: '2026-04-28T14:00:00Z',
    leagueName: 'Premier League',
    leagueCountry: 'England',
    ...overrides,
  }
}

function mockYouTubeResponse(items: Array<{ videoId: string; title: string; channelTitle: string; publishedAt: string }>) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      items: items.map(item => ({
        id: { videoId: item.videoId },
        snippet: {
          title: item.title,
          thumbnails: { high: { url: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` } },
          channelTitle: item.channelTitle,
          publishedAt: item.publishedAt,
        },
      })),
    }),
  })
}

const REJECT_KEYWORDS = [
  'preview', 'predicción', 'pronóstico', 'prediction', 'simulation',
  'fifa', 'pes', 'efootball', 'efoot', 'konami', 'ea sports', 'gameplay',
  'partido completo', 'full match', 'live', 'directo', 'transmisión',
  'streaming', 'en vivo', 'ahora', 'today', 'highlights 2025', 'highlights 2024',
  'highlights 2023', 'highlights 2022', 'top 10', 'best goals', 'besthighlights',
]

const OFFICIAL_CHANNELS = [
  'espn', 'sky sports', 'bein sports', 'cbs sports', 'nbc sports',
  'tnt sports', 'tnt sport', 'fox sports', 'fox soccer', 'dazn', 'paramount+',
  'paramount plus', 'cbs golazo', 'fifa', 'uefa', 'conmebol', 'concacaf',
  'libertadores', 'sudamericana', 'premier league', 'laliga', 'serie a',
  'bundesliga', 'ligue 1',
]

const EXACT_OFFICIAL_CHANNELS = [
  'fifa',
  'fifa+',
  'uefa',
  'conmebol',
  'concacaf',
]

const TRUSTED_CHANNELS = [
  ...OFFICIAL_CHANNELS, 'football', 'gol', 'goals', 'highlights',
  'compilation', 'resumen', 'momentos', 'deportes', 'sports',
]

function isTrustedChannel(channelTitle: string): boolean {
  const lower = channelTitle.toLowerCase()
  return TRUSTED_CHANNELS.some(pref => lower.includes(pref))
}

function isOfficialChannel(channelTitle: string): boolean {
  const lower = channelTitle.toLowerCase().trim().replace(/\s+/g, ' ')
  if (EXACT_OFFICIAL_CHANNELS.includes(lower)) {
    return true
  }
  return OFFICIAL_CHANNELS
    .filter(pref => !EXACT_OFFICIAL_CHANNELS.includes(pref))
    .some(pref => lower.includes(pref))
}

function containsRejectKeyword(title: string, channel: string): boolean {
  const text = isOfficialChannel(channel) ? title.toLowerCase() : `${title} ${channel}`.toLowerCase()
  return REJECT_KEYWORDS.some(kw => text.includes(kw))
}

function scoreResult(result: YouTubeSearchResult, ctx: HighlightSearchContext, publishedInRange: boolean): number {
  const title = result.title.toLowerCase()
  let score = 0
  if (isOfficialChannel(result.channelTitle)) score += 70
  else if (isTrustedChannel(result.channelTitle)) score += 40
  const homeShort = ctx.homeTeam.replace(/ fc| afc| cf| sc| ac|\s+/gi, '').trim().toLowerCase()
  const awayShort = ctx.awayTeam.replace(/ fc| afc| cf| sc| ac|\s+/gi, '').trim().toLowerCase()
  const teamInTitle = homeShort.length >= 3 && title.includes(homeShort) || awayShort.length >= 3 && title.includes(awayShort)
  const playerInTitle = ctx.player && ctx.player.length >= 3 && title.includes(ctx.player.toLowerCase())
  if (teamInTitle) score += 25
  if (playerInTitle) score += 15
  if (publishedInRange) score += 20
  const minuteStr = typeof ctx.minute === 'number' ? `${ctx.minute}'` : null
  if (minuteStr && title.includes(minuteStr)) score += 15
  const eventKeywords: Record<string, string[]> = {
    goal: ['goal', 'gol', 'score', 'scores', 'anotación'],
    penalty: ['penalty', 'penales', 'penalti'],
    yellow_card: ['yellow card', 'amarilla', 'tarjeta'],
    red_card: ['red card', 'roja', 'tarjeta roja', 'expulsión'],
    own_goal: ['own goal', 'gol en contra'],
    subst: ['substitution', 'cambio', 'subst'],
  }
  if (ctx.eventType) {
    const keywords = eventKeywords[ctx.eventType] || [ctx.eventType]
    const hasEventKeyword = keywords.some(kw => title.includes(kw))
    if (hasEventKeyword) score += 10
  } else if (title.includes('highlights') || title.includes('resumen')) {
    score += 10
  }
  return score
}

function buildSearchQuery(ctx: HighlightSearchContext): string {
  const home = ctx.homeTeam.replace(/ fc| afc| cf| sc| ac|$/i, '').trim()
  const away = ctx.awayTeam.replace(/ fc| afc| cf| sc| ac|$/i, '').trim()
  let query = `${home} vs ${away} highlights resumen`
  if (typeof ctx.minute === 'number' && ctx.eventType) {
    const minuteStr = `${ctx.minute}'`
    const typeStr = ctx.eventType === 'goal' ? 'gol' : ctx.eventType
    query = `${home} vs ${away} ${minuteStr} ${typeStr} highlights`
  }
  if (ctx.player && ctx.player.length >= 3) {
    query += ` ${ctx.player}`
  }
  return query
}

describe('youtube.ts pure functions', () => {
  describe('containsRejectKeyword', () => {
    it('returns true for preview/pronóstico in title', () => {
      expect(containsRejectKeyword('Arsenal vs Chelsea 23 Preview', 'ESPN')).toBe(true)
    })
    it('returns true for prediction keywords', () => {
      expect(containsRejectKeyword('Arsenal vs Chelsea prediction', 'Sky Sports')).toBe(true)
      expect(containsRejectKeyword('Arsenal vs Chelsea pronóstico', 'ESPN')).toBe(true)
    })
    it('returns true for simulation/fifa/pes keywords', () => {
      expect(containsRejectKeyword('Arsenal 23 FIFA gol', 'FIFA Tips')).toBe(true)
      expect(containsRejectKeyword('Arsenal 23 PES gameplay', 'PES Channel')).toBe(true)
      expect(containsRejectKeyword('Arsenal eFootball 23', 'Konami')).toBe(true)
    })
    it('rejects gaming channels that only look official because they contain FIFA', () => {
      expect(containsRejectKeyword('Morocco vs Madagascar highlights', 'FIFA Gameplay')).toBe(true)
    })
    it('returns true for full match/live keywords', () => {
      expect(containsRejectKeyword('Arsenal vs Chelsea full match', 'Channel')).toBe(true)
      expect(containsRejectKeyword('Arsenal vs Chelsea live', 'Channel')).toBe(true)
      expect(containsRejectKeyword('Partido completo Arsenal Chelsea', 'Channel')).toBe(true)
    })
    it('returns false for clean titles', () => {
      expect(containsRejectKeyword('Arsenal vs Chelsea 23 gol highlight', 'ESPN')).toBe(false)
      expect(containsRejectKeyword('Arsenal Chelsea 23 minutos', 'Sky Sports')).toBe(false)
    })
  })

  describe('scoreResult', () => {
    it('awards +40 for trusted channels', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Arsenal gol', thumbnail: '', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' }
      expect(scoreResult(result, makeCtx(), true)).toBeGreaterThanOrEqual(70)
    })
    it('prioritizes official sports channels over generic trusted channels', () => {
      const ctx = makeCtx()
      const official: YouTubeSearchResult = { videoId: 'x', title: 'Arsenal Chelsea highlights', thumbnail: '', channelTitle: 'FOX Sports', publishedAt: '2026-04-29T16:00:00Z' }
      const generic: YouTubeSearchResult = { videoId: 'y', title: 'Arsenal Chelsea highlights', thumbnail: '', channelTitle: 'Best Football Highlights', publishedAt: '2026-04-29T16:00:00Z' }
      expect(scoreResult(official, ctx, true)).toBeGreaterThan(scoreResult(generic, ctx, true))
    })
    it('awards +25 when team name in title', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Arsenal 23 gol', thumbnail: '', channelTitle: 'RandomChannel', publishedAt: '2026-04-29T16:00:00Z' }
      const score = scoreResult(result, makeCtx(), false)
      expect(score).toBeGreaterThanOrEqual(25)
    })
    it('awards +15 when player name in title', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Saka 23 gol', thumbnail: '', channelTitle: 'RandomChannel', publishedAt: '2026-04-29T16:00:00Z' }
      const score = scoreResult(result, makeCtx({ player: 'Saka' }), false)
      expect(score).toBeGreaterThanOrEqual(15)
    })
    it('awards +20 for published in date range', () => {
      const ctx = makeCtx()
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Arsenal gol', thumbnail: '', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' }
      const inRange = scoreResult(result, ctx, true)
      const outRange = scoreResult(result, ctx, false)
      expect(inRange - outRange).toBe(20)
    })
    it('awards +15 when minute in title', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: "Arsenal 23' gol", thumbnail: '', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' }
      const score = scoreResult(result, makeCtx({ minute: 23 }), false)
      expect(score).toBeGreaterThanOrEqual(15)
    })
    it('awards +10 for event keyword in title', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Arsenal vs Chelsea gol', thumbnail: '', channelTitle: 'RandomChannel', publishedAt: '2026-04-29T16:00:00Z' }
      const score = scoreResult(result, makeCtx({ eventType: 'goal' }), false)
      expect(score).toBeGreaterThanOrEqual(10)
    })
    it('awards +10 for summary keywords when no event type is provided', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Arsenal vs Chelsea highlights', thumbnail: '', channelTitle: 'RandomChannel', publishedAt: '2026-04-29T16:00:00Z' }
      const score = scoreResult(result, makeCtx({ minute: undefined, eventType: undefined }), false)
      expect(score).toBeGreaterThanOrEqual(10)
    })
    it('returns score below threshold 25 for unknown channel + no team in title', () => {
      const result: YouTubeSearchResult = { videoId: 'x', title: 'Random video', thumbnail: '', channelTitle: 'SomeChannel', publishedAt: '2026-04-29T16:00:00Z' }
      const score = scoreResult(result, makeCtx(), false)
      expect(score).toBeLessThan(25)
    })
  })

  describe('buildSearchQuery', () => {
    it('includes both team names with vs', () => {
      const query = buildSearchQuery(makeCtx({ homeTeam: 'Real Madrid CF', awayTeam: 'Barcelona FC' }))
      expect(query).toContain('Real Madrid')
      expect(query).toContain('Barcelona')
      expect(query).toContain('vs')
    })
    it('includes minute and event type', () => {
      const query = buildSearchQuery(makeCtx({ minute: 45, eventType: 'goal' }))
      expect(query).toContain("45'")
      expect(query).toContain('gol')
    })
    it('includes player name when provided', () => {
      const query = buildSearchQuery(makeCtx({ player: 'Saka' }))
      expect(query).toContain('Saka')
    })
    it('does not include player when length < 3', () => {
      const query = buildSearchQuery(makeCtx({ player: 'Bo' }))
      expect(query).not.toContain('Bo')
    })
    it('builds match summary query when minute and event type are absent', () => {
      const query = buildSearchQuery(makeCtx({ minute: undefined, eventType: undefined }))
      expect(query).toContain('Arsenal')
      expect(query).toContain('Chelsea')
      expect(query).toContain('highlights')
      expect(query).toContain('resumen')
      expect(query).not.toContain("23'")
    })
  })
})

describe('youtube.ts searchHighlightVideo (integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    process.env.YOUTUBE_API_KEY = 'test-api-key'
  })

  afterAll(() => {
    process.env.YOUTUBE_API_KEY = ORIGINAL_YOUTUBE_KEY ?? ''
  })

  it('rejects videos with preview/pronóstico keywords', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'abc', title: 'Arsenal vs Chelsea 23 Preview', channelTitle: 'ESPN', publishedAt: '2026-04-28T16:00:00Z' },
      { videoId: 'def', title: 'Arsenal vs Chelsea 23 gol', channelTitle: 'Sky Sports', publishedAt: '2026-04-28T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx())
    expect(result).not.toBeNull()
    expect(result?.videoId).toBe('def')
  })

  it('rejects simulation/fifa/pes videos', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'fifa1', title: 'Arsenal 23 FIFA 26 gol', channelTitle: 'FIFA Tips', publishedAt: '2026-04-28T16:00:00Z' },
      { videoId: 'real1', title: 'Arsenal vs Chelsea 23 gol highlight', channelTitle: 'ESPN', publishedAt: '2026-04-28T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx())
    expect(result?.videoId).toBe('real1')
  })

  it('returns null when no video meets score threshold', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'bad1', title: 'Random video', channelTitle: 'SomeChannel', publishedAt: '2026-04-28T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx())
    expect(result).toBeNull()
  })

  it('uses date window based on match startTime (not generic 90 days)', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'good1', title: 'Arsenal Chelsea 23 gol', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    await searchHighlightVideo(makeCtx({ startTime: '2026-04-28T14:00:00Z' }))

    const calledUrl = mockFetch.mock.calls[0][0] as string
    const url = new URL(calledUrl)
    const publishedAfter = url.searchParams.get('publishedAfter')
    const publishedBefore = url.searchParams.get('publishedBefore')

    expect(publishedAfter).toBeTruthy()
    expect(publishedBefore).toBeTruthy()

    const afterDate = new Date(publishedAfter!)
    const beforeDate = new Date(publishedBefore!)

    expect(afterDate.getTime()).toBeLessThan(new Date('2026-04-28T14:00:00Z').getTime())
    expect(beforeDate.getTime()).toBeGreaterThanOrEqual(new Date('2026-05-12T14:00:00Z').getTime())
  })

  it('includes videoEmbeddable and videoSyndicated params', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'v1', title: 'Arsenal Chelsea 23 gol', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    await searchHighlightVideo(makeCtx())

    const calledUrl = mockFetch.mock.calls[0][0] as string
    const url = new URL(calledUrl)

    expect(url.searchParams.get('videoEmbeddable')).toBe('true')
    expect(url.searchParams.get('videoSyndicated')).toBe('true')
    expect(url.searchParams.get('videoCategoryId')).toBe('17')
  })

  it('prioritizes result with team name in title', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'no-team', title: 'Amazing goal 23', channelTitle: 'RandomChannel', publishedAt: '2026-04-29T16:00:00Z' },
      { videoId: 'with-team', title: 'Arsenal 23 gol highlight', channelTitle: 'RandomChannel', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx())
    expect(result?.videoId).toBe('with-team')
  })

  it('prioritizes result with player name in title when provided', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'no-player', title: 'Arsenal Chelsea 23 gol', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
      { videoId: 'with-player', title: 'Saka 23 Arsenal gol', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx({ player: 'Saka' }))
    expect(result?.videoId).toBe('with-player')
  })

  it('rejects videos published outside match date window', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'outside-window', title: 'Arsenal Chelsea 23 gol', channelTitle: 'ESPN', publishedAt: '2026-03-01T16:00:00Z' },
      { videoId: 'in-window', title: 'Arsenal Chelsea 23 gol', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx())
    expect(result?.videoId).toBe('in-window')
  })

  it('returns null when YOUTUBE_API_KEY is not configured', async () => {
    process.env.YOUTUBE_API_KEY = ''
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    const result = await searchHighlightVideo(makeCtx())
    expect(result).toBeNull()
  })

  it('builds correct query with vs between teams', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'v1', title: 'Arsenal vs Chelsea 23 gol', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    await searchHighlightVideo(makeCtx({ homeTeam: 'Real Madrid CF', awayTeam: 'Barcelona FC' }))

    const calledUrl = mockFetch.mock.calls[0][0] as string
    const url = new URL(calledUrl)
    const query = url.searchParams.get('q') || ''
    expect(query).toContain('Real Madrid')
    expect(query).toContain('Barcelona')
  })

  it('searches match summary without minute or event type', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'summary1', title: 'Arsenal vs Chelsea highlights resumen', channelTitle: 'ESPN', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx({ minute: undefined, eventType: undefined }))

    const calledUrl = mockFetch.mock.calls[0][0] as string
    const url = new URL(calledUrl)
    const query = url.searchParams.get('q') || ''
    expect(query).toContain('highlights')
    expect(query).toContain('resumen')
    expect(query).not.toContain("23'")
    expect(result?.videoId).toBe('summary1')
  })

  it('prefers official sports channels for match summaries', async () => {
    const { searchHighlightVideo } = await import('@/lib/api/youtube')

    mockYouTubeResponse([
      { videoId: 'generic1', title: 'Arsenal vs Chelsea highlights resumen', channelTitle: 'Best Football Highlights', publishedAt: '2026-04-29T16:00:00Z' },
      { videoId: 'official1', title: 'Arsenal vs Chelsea highlights resumen', channelTitle: 'TNT Sports', publishedAt: '2026-04-29T16:00:00Z' },
    ])

    const result = await searchHighlightVideo(makeCtx({ minute: undefined, eventType: undefined }))

    expect(result?.videoId).toBe('official1')
  })
})

describe('getYouTubeEmbedUrl', () => {
  it('returns embed URL with video ID', async () => {
    const { getYouTubeEmbedUrl } = await import('@/lib/api/youtube')
    const url = getYouTubeEmbedUrl('dQw4w9WgXcQ')
    expect(url).toContain('youtube.com/embed/dQw4w9WgXcQ')
  })
})

describe('getYouTubeThumbnailUrl', () => {
  it('returns thumbnail URL with video ID and quality', async () => {
    const { getYouTubeThumbnailUrl } = await import('@/lib/api/youtube')
    const url = getYouTubeThumbnailUrl('dQw4w9WgXcQ', 'hqdefault')
    expect(url).toContain('img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  })
})
