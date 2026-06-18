import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import LivePage from '../page'
import { MOCK_MATCHES } from '@/lib/mock-data'

const LIVE_MOCK_MATCHES = MOCK_MATCHES.filter(m => m.status === 'live')

beforeEach(() => {
  vi.useFakeTimers()
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        matches: LIVE_MOCK_MATCHES,
        meta: { total: LIVE_MOCK_MATCHES.length, cached: false, cacheAge: 0 },
      }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('LivePage', () => {
  it('shows "En Vivo" header with live count', async () => {
    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('En Vivo')).toBeDefined()

    const liveCount = MOCK_MATCHES.filter(m => m.status === 'live').length
    const countElements = screen.getAllByText(String(liveCount))
    expect(countElements.length).toBeGreaterThanOrEqual(1)
  })

  it('shows empty state when no live matches', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          matches: [],
          meta: { total: 0, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('No hay partidos en vivo ahora')).toBeDefined()
    expect(screen.queryByText('Error al cargar partidos')).toBeNull()
  })

  it('renders loading skeleton initially', () => {
    render(<LivePage />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).not.toBeNull()
  })

  it('passes date, timezone, and status=live query params to the API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          matches: [],
          meta: { total: 0, cached: false, cacheAge: 0 },
        }),
    })
    globalThis.fetch = fetchMock

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    const callUrl = fetchMock.mock.calls[0][0]
    const url = new URL(callUrl, 'http://localhost')
    expect(url.searchParams.get('sport')).toBe('all')
    expect(url.searchParams.get('status')).toBe('live')
    expect(url.searchParams.get('timezone')).toBeTruthy()
    expect(url.searchParams.get('date')).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('shows error message when API returns 500 with valid JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          error: 'Internal Server Error',
          matches: [],
        }),
    })

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('Error al cargar partidos')).toBeDefined()
  })

  it('preserves previous matches when a subsequent fetch fails', async () => {
    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    const liveCount = MOCK_MATCHES.filter(m => m.status === 'live').length

    expect(screen.getByText('En Vivo')).toBeDefined()
    const countElements = screen.getAllByText(String(liveCount))
    expect(countElements.length).toBeGreaterThanOrEqual(1)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error', matches: [] }),
    })

    await act(async () => {
      vi.advanceTimersByTime(30000)
    })

    expect(screen.getByText('Error al cargar partidos')).toBeDefined()
    expect(screen.queryByText('No hay partidos en vivo ahora')).toBeNull()
  })

  it('shows sport breakdown counts', async () => {
    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    const liveMatches = MOCK_MATCHES.filter(m => m.status === 'live')
    const footballCount = liveMatches.filter(m => m.sport === 'football').length
    const basketballCount = liveMatches.filter(m => m.sport === 'basketball').length

    expect(screen.getByText(new RegExp(`${footballCount} fútbol`))).toBeDefined()
    expect(screen.getByText(new RegExp(`${basketballCount} básquet`))).toBeDefined()
  })

  it('does not show empty state when initial API fetch fails', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          error: 'Internal Server Error',
          matches: [],
        }),
    })

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.queryByText('No hay partidos en vivo ahora')).toBeNull()
  })

  it('shows error banner on initial API fetch failure', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () =>
        Promise.resolve({
          error: 'Internal Server Error',
          matches: [],
        }),
    })

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('Error al cargar partidos')).toBeDefined()
  })

  it('shows empty state on successful empty response and no error banner', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          matches: [],
          meta: { total: 0, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('No hay partidos en vivo ahora')).toBeDefined()
    expect(screen.queryByText('Error al cargar partidos')).toBeNull()
  })
})
