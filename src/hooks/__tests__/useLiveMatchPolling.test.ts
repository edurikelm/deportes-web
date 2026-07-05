import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useLiveMatchPolling } from '../useLiveMatchPolling'

function mockFetchResponse(data: unknown, options?: { ok?: boolean; status?: number }): Response {
  return {
    ok: options?.ok ?? true,
    status: options?.status ?? 200,
    json: () => Promise.resolve(data),
  } as unknown as Response
}

describe('useLiveMatchPolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ matches: [{ id: '1', status: 'live' }] }),
    } as unknown as Response)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('continues polling when keepAlive=true even if document.hidden is true', async () => {
    const fetchSpy = vi.mocked(fetch)

    renderHook(() => useLiveMatchPolling({ url: '/api/match/1', keepAlive: true }))

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(30000)

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  it('pauses polling when keepAlive=false and document.hidden is true', async () => {
    const fetchSpy = vi.mocked(fetch)

    renderHook(() => useLiveMatchPolling({ url: '/api/match/1', keepAlive: false }))

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('preserves lastUpdated on fetch error (stale-while-revalidate)', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() => useLiveMatchPolling({ url: '/api/match/1', keepAlive: true }))

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(result.current.lastUpdated).toBeInstanceOf(Date)
    })

    const capturedLastUpdated = result.current.lastUpdated

    fetchSpy.mockRejectedValue(new Error('Network error'))

    await vi.advanceTimersByTimeAsync(30000)

    await vi.waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })

    expect(result.current.lastUpdated).toBe(capturedLastUpdated)
  })

  it('preserves last data on 429 and shows rateLimitInfo', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() => useLiveMatchPolling({ url: '/api/match/1', keepAlive: true }))

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(result.current.lastUpdated).toBeInstanceOf(Date)
    })

    const capturedLastUpdated = result.current.lastUpdated

    fetchSpy.mockResolvedValue(mockFetchResponse({}, { ok: false, status: 429 }))

    await vi.advanceTimersByTimeAsync(30000)

    await vi.waitFor(() => {
      expect(result.current.rateLimitInfo.active).toBe(true)
    })

    expect(result.current.error).toContain('429')
    expect(result.current.lastUpdated).toBe(capturedLastUpdated)
  })

  it('stops polling when trackedMatchId match is finished', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '1', status: 'finished' }] }))

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(result.current.isPolling).toBe(false)
  })

  it('calls onData before stopping for tracked finished match', async () => {
    const fetchSpy = vi.mocked(fetch)
    const onData = vi.fn()

    renderHook(() =>
      useLiveMatchPolling({
        url: '/api/match/1',
        keepAlive: true,
        trackedMatchId: '1',
        onData,
      }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      expect(onData).toHaveBeenCalledTimes(1)
    })

    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '1', status: 'finished' }] }))

    await vi.advanceTimersByTimeAsync(30000)

    expect(onData).toHaveBeenCalledWith(
      expect.objectContaining({
        matches: expect.arrayContaining([
          expect.objectContaining({ id: '1', status: 'finished' }),
        ]),
      }),
    )

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(onData).toHaveBeenCalledTimes(2)
  })

  it('does not stop polling when another match finishes, only when tracked match finishes', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '2', status: 'finished' }, { id: '1', status: 'live' }] }))

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(result.current.isPolling).toBe(true)
  })

  it('stops polling when tracked match disappears from response after 2 consecutive misses', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    // First miss: polling continues
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '2', status: 'live' }] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    expect(result.current.isPolling).toBe(true)

    // Second consecutive miss: polling stops
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(false)
    })
  })

  it('does NOT stop on first disappearance, only after second consecutive', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    // Mock response without tracked match
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '2', status: 'live' }] }))
    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })
  })

  it('missing count resets when match reappears', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    // Tick 1: tracked match missing (count=1)
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '2', status: 'live' }] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })

    // Tick 2: tracked match reappears → counter resets
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '1', status: 'live' }, { id: '2', status: 'live' }] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })

    // Tick 3: tracked match missing again (count=1, not enough)
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '2', status: 'live' }] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(4)
    expect(result.current.isPolling).toBe(true)

    // Tick 4: second consecutive miss → stops
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(5)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(false)
    })
  })

  it('does not stop on first empty response, only after second consecutive', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    // First miss: empty response should not stop immediately
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [] }))
    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })
  })

  it('resets missing count when match reappears after empty responses', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true, trackedMatchId: '1' }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    // Tick 1: tracked match missing in empty response (count=1)
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })

    // Tick 2: tracked match reappears → counter resets
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '1', status: 'live' }] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(true)
    })

    // Tick 3: tracked match missing again (count=1, not enough)
    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [] }))
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(4)
    expect(result.current.isPolling).toBe(true)

    // Tick 4: second consecutive miss → stops
    await vi.advanceTimersByTimeAsync(30000)
    expect(fetchSpy).toHaveBeenCalledTimes(5)
    await vi.waitFor(() => {
      expect(result.current.isPolling).toBe(false)
    })
  })

  it('continues polling when no trackedMatchId even if matches are finished', async () => {
    const fetchSpy = vi.mocked(fetch)

    const { result } = renderHook(() =>
      useLiveMatchPolling({ url: '/api/match/1', keepAlive: true }),
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    fetchSpy.mockResolvedValue(mockFetchResponse({ matches: [{ id: '1', status: 'finished' }] }))

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(3)
    expect(result.current.isPolling).toBe(true)
  })

  it('reverts to normal hidden behavior when keepAlive goes from true to false', async () => {
    const fetchSpy = vi.mocked(fetch)

    Object.defineProperty(document, 'hidden', { value: true, configurable: true, writable: true })

    const { rerender } = renderHook(
      ({ keepAlive }: { keepAlive: boolean }) =>
        useLiveMatchPolling({ url: '/api/match/1', keepAlive }),
      { initialProps: { keepAlive: true } },
    )

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    await vi.advanceTimersByTimeAsync(30000)

    await vi.waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    rerender({ keepAlive: false })

    await vi.advanceTimersByTimeAsync(30000)

    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})
