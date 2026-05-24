import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useMatchPolling } from '../useMatchPolling'

describe('useMatchPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [] }),
    }))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('fetches from url when url is provided', async () => {
    const fetchSpy = vi.mocked(fetch)

    renderHook(() =>
      useMatchPolling({ url: '/api/matches?status=live' })
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/matches?status=live')
    })
  })

  it('constructs URL from sport and status when url is not provided', async () => {
    const fetchSpy = vi.mocked(fetch)

    renderHook(() =>
      useMatchPolling({ sport: 'football', status: 'live' })
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/matches?sport=football&status=live')
    })
  })

  it('calls onData with parsed response when url is provided', async () => {
    const data = { matches: [{ id: '1' }] }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    }))
    const onData = vi.fn()

    renderHook(() =>
      useMatchPolling({ url: '/api/matches', onData })
    )

    await vi.waitFor(() => {
      expect(onData).toHaveBeenCalledWith(data)
    })
  })

  it('falls back to onFetch when neither url nor sport/status provided', async () => {
    const onFetch = vi.fn().mockResolvedValue(undefined)

    renderHook(() =>
      useMatchPolling({ onFetch })
    )

    await vi.waitFor(() => {
      expect(onFetch).toHaveBeenCalledTimes(1)
      expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    })
  })

  it('sets lastUpdated after successful fetch via url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [] }),
    }))
    vi.setSystemTime(new Date('2026-05-23T12:00:00Z'))

    const { result } = renderHook(() =>
      useMatchPolling({ url: '/api/matches' })
    )

    await vi.waitFor(() => {
      expect(result.current.lastUpdated).toBeInstanceOf(Date)
      expect(result.current.error).toBeNull()
    })
  })

  it('handles HTTP errors when fetching via url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    }))

    const { result } = renderHook(() =>
      useMatchPolling({ url: '/api/matches' })
    )

    await vi.waitFor(() => {
      expect(result.current.error).toBe('HTTP 500')
    })
  })

  it('handles 429 rate limiting when fetching via url', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({}),
    }))

    const { result } = renderHook(() =>
      useMatchPolling({ url: '/api/matches' })
    )

    await vi.waitFor(() => {
      expect(result.current.rateLimitInfo.active).toBe(true)
      expect(result.current.rateLimitInfo.remainingSeconds).toBe(120)
    })
  })
})
