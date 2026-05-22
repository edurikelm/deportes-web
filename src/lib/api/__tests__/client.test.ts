import { describe, it, expect, beforeEach, vi } from 'vitest'
import { fetchWithCache, clearCache } from '../client'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

describe('fetchWithCache', () => {
  beforeEach(() => {
    clearCache()
    mockFetch.mockReset()
  })

  it('caches responses with TTL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'test' }),
    })

    const result1 = await fetchWithCache('https://api.example.com/data')
    expect(result1.data).toEqual({ data: 'test' })
    expect(result1.cached).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const result2 = await fetchWithCache('https://api.example.com/data')
    expect(result2.data).toEqual({ data: 'test' })
    expect(result2.cached).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('bypasses cache when x-no-cache header is true', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'fresh' }),
    })

    await fetchWithCache('https://api.example.com/data')
    const result2 = await fetchWithCache('https://api.example.com/data', {
      headers: { 'x-no-cache': 'true' },
    })
    expect(result2.cached).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns stale cache on 429 when cache exists', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => Promise.resolve({ data: 'stale' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({}),
      })

    await fetchWithCache('https://api.example.com/data')
    const result2 = await fetchWithCache('https://api.example.com/data')
    expect(result2.data).toEqual({ data: 'stale' })
    expect(result2.cached).toBe(true)
  })

  it('expired TTL re-fetches data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'first' }),
    })

    await fetchWithCache('https://api.example.com/data', {}, 0, '')

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ data: 'second' }),
    })

    const result2 = await fetchWithCache('https://api.example.com/data', {}, 0, '')
    expect(result2.data).toEqual({ data: 'second' })
    expect(result2.cached).toBe(false)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('returns error on 429 when no cache exists', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: () => Promise.resolve({}),
    })

    await expect(
      fetchWithCache('https://api.example.com/rate-limited', {}, 60, 'Test API')
    ).rejects.toThrow('Test API Error: 429 Too Many Requests')
  })

  it('includes serviceName in error messages', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({}),
    })

    await expect(
      fetchWithCache('https://api.example.com/error', {}, 60, 'NBA API')
    ).rejects.toThrow('NBA API Error: 500 Internal Server Error')
  })
})
