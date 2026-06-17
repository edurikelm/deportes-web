export interface HighlightSearchContext {
  matchId: string
  homeTeam: string
  awayTeam: string
  minute?: number
  eventType?: string
  startTime: string
  leagueName: string
  leagueCountry: string
  player?: string
  eventTeam?: 'home' | 'away'
}

export interface YouTubeSearchResult {
  videoId: string
  title: string
  thumbnail: string
  channelTitle: string
  publishedAt: string
}

interface YouTubeSearchResponse {
  items: Array<{
    id: { videoId: string }
    snippet: {
      title: string
      thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } }
      channelTitle: string
      publishedAt: string
    }
  }>
}

const positiveCache = new Map<string, { data: YouTubeSearchResult; timestamp: number }>()
const negativeCache = new Map<string, number>()
const POSITIVE_CACHE_TTL = 1800 * 1000
const NEGATIVE_CACHE_TTL = 300 * 1000

const OFFICIAL_CHANNELS = [
  'espn',
  'fox sports',
  'fox soccer',
  'sky sports',
  'bein sports',
  'cbs sports',
  'nbc sports',
  'tnt sports',
  'tnt sport',
  'dazn',
  'paramount+',
  'paramount plus',
  'cbs golazo',
  'fifa',
  'uefa',
  'conmebol',
  'concacaf',
  'libertadores',
  'sudamericana',
  'premier league',
  'laliga',
  'serie a',
  'bundesliga',
  'ligue 1',
]

const EXACT_OFFICIAL_CHANNELS = [
  'fifa',
  'fifa+',
  'uefa',
  'conmebol',
  'concacaf',
]

const TRUSTED_CHANNELS = [
  ...OFFICIAL_CHANNELS,
  'dazn',
  'football',
  'gol',
  'goals',
  'highlights',
  'compilation',
  'resumen',
  'momentos',
  'deportes',
  'sports',
]

const REJECT_KEYWORDS = [
  'preview',
  'predicción',
  'pronóstico',
  'prediction',
  'simulation',
  'fifa',
  'pes',
  'efootball',
  'efoot',
  'konami',
  'ea sports',
  'gameplay',
  'partido completo',
  'full match',
  'live',
  'directo',
  'transmisión',
  'streaming',
  'en vivo',
  'ahora',
  'today',
  'ahora',
  'highlights 2025',
  'highlights 2024',
  'highlights 2023',
  'highlights 2022',
  'top 10',
  'best goals',
  'besthighlights',
]

const SCORE_THRESHOLD = 25

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
  const text = isOfficialChannel(channel)
    ? title.toLowerCase()
    : `${title} ${channel}`.toLowerCase()
  return REJECT_KEYWORDS.some(kw => text.includes(kw))
}

function scoreResult(result: YouTubeSearchResult, ctx: HighlightSearchContext, publishedInRange: boolean): number {
  const title = result.title.toLowerCase()
  let score = 0

  if (isOfficialChannel(result.channelTitle)) {
    score += 70
  } else if (isTrustedChannel(result.channelTitle)) {
    score += 40
  }

  const homeShort = ctx.homeTeam.replace(/ fc| afc| cf| sc| ac|\s+/gi, '').trim().toLowerCase()
  const awayShort = ctx.awayTeam.replace(/ fc| afc| cf| sc| ac|\s+/gi, '').trim().toLowerCase()
  const teamInTitle = homeShort.length >= 3 && title.includes(homeShort) ||
    awayShort.length >= 3 && title.includes(awayShort)
  const playerInTitle = ctx.player && ctx.player.length >= 3 && title.includes(ctx.player.toLowerCase())

  if (teamInTitle) {
    score += 25
  }
  if (playerInTitle) {
    score += 15
  }

  if (publishedInRange) {
    score += 20
  }

  const minuteStr = typeof ctx.minute === 'number' ? `${ctx.minute}'` : null
  if (minuteStr && title.includes(minuteStr)) {
    score += 15
  }

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
    if (hasEventKeyword) {
      score += 10
    }
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

export async function searchHighlightVideo(
  ctx: HighlightSearchContext
): Promise<YouTubeSearchResult | null> {
  const youtubeApiKey = process.env.YOUTUBE_API_KEY

  if (!youtubeApiKey) {
    console.warn('[YouTube] No YOUTUBE_API_KEY configured')
    return null
  }

  const cacheKey = `${ctx.matchId}|${ctx.homeTeam}|${ctx.awayTeam}|${ctx.minute ?? 'match'}|${ctx.eventType ?? 'summary'}|${ctx.player || ''}`
  const now = Date.now()

  const negTs = negativeCache.get(cacheKey)
  if (negTs && now - negTs < NEGATIVE_CACHE_TTL) {
    return null
  }

  const cached = positiveCache.get(cacheKey)
  if (cached && now - cached.timestamp < POSITIVE_CACHE_TTL) {
    return cached.data
  }

  const query = buildSearchQuery(ctx)

  let matchStart: Date
  try {
    matchStart = new Date(ctx.startTime)
  } catch {
    matchStart = new Date(0)
  }

  const publishedAfter = new Date(matchStart.getTime() - 7 * 24 * 60 * 60 * 1000)
  const publishedBefore = new Date(matchStart.getTime() + 14 * 24 * 60 * 60 * 1000)

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    key: youtubeApiKey,
    maxResults: '10',
    relevanceLanguage: 'es',
    regionCode: 'CL',
    videoCategoryId: '17',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    publishedAfter: publishedAfter.toISOString(),
    publishedBefore: publishedBefore.toISOString(),
  })

  const url = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.error('[YouTube] Search failed:', response.status, await response.text())
      return null
    }

    const data: YouTubeSearchResponse = await response.json()

    if (!data.items || data.items.length === 0) {
      negativeCache.set(cacheKey, now)
      return null
    }

    const scored = data.items
      .map(item => {
        const result: YouTubeSearchResult = {
          videoId: item.id.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails.maxres?.url ||
            item.snippet.thumbnails.high?.url ||
            item.snippet.thumbnails.medium?.url ||
            '',
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
        }
        const itemDate = new Date(result.publishedAt)
        const publishedInRange = itemDate >= publishedAfter && itemDate <= publishedBefore
        return { result, score: scoreResult(result, ctx, publishedInRange) }
      })
      .filter(({ result }) => !containsRejectKeyword(result.title, result.channelTitle))
      .sort((a, b) => b.score - a.score)

    if (scored.length === 0 || scored[0].score < SCORE_THRESHOLD) {
      negativeCache.set(cacheKey, now)
      return null
    }

    const best = scored[0].result
    positiveCache.set(cacheKey, { data: best, timestamp: now })
    return best
  } catch (err) {
    console.error('[YouTube] Search error:', err)
    return null
  }
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
}

export function getYouTubeThumbnailUrl(videoId: string, quality = 'maxresdefault'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}
