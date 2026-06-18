const API_KEY = process.env.API_SPORTS_KEY

const cache = new Map<string, { data: unknown; timestamp: number }>()

interface CacheEntry {
  data: unknown
  timestamp: number
}

export async function fetchWithCache<T>(
  url: string,
  options: RequestInit = {},
  ttlSeconds = 60,
  serviceName = 'API'
): Promise<{ data: T; cached: boolean; cacheAge: number }> {
  const cacheKey = url
  const now = Date.now()
  const headers = options.headers as Record<string, string> | undefined
  const noCache = headers?.['x-no-cache'] === 'true'

  if (!noCache) {
    const cached = cache.get(cacheKey) as CacheEntry | undefined
    if (cached && now - cached.timestamp < ttlSeconds * 1000) {
      return { data: cached.data as T, cached: true, cacheAge: Math.floor((now - cached.timestamp) / 1000) }
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'x-apisports-key': API_KEY || '',
      ...options.headers,
    },
  })

  if (!response.ok) {
    if (response.status === 429 && cache.has(cacheKey)) {
      const cached = cache.get(cacheKey) as CacheEntry
      return { data: cached.data as T, cached: true, cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000) }
    }
    throw new Error(`${serviceName} Error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  if (!noCache) {
    cache.set(cacheKey, { data, timestamp: now })
  }

  return { data: data as T, cached: false, cacheAge: 0 }
}

export function clearCache() {
  cache.clear()
}
