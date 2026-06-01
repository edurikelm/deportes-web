import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import LivePage from '../page'
import { MOCK_MATCHES } from '@/lib/mock-data'

beforeEach(() => {
  vi.useFakeTimers()
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        matches: MOCK_MATCHES,
        meta: { total: 6, cached: false, cacheAge: 0 },
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
      json: () =>
        Promise.resolve({
          matches: MOCK_MATCHES.filter(m => m.status === 'upcoming'),
          meta: { total: 2, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<LivePage />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('No hay partidos en vivo ahora')).toBeDefined()
  })

  it('renders loading skeleton initially', () => {
    render(<LivePage />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).not.toBeNull()
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
})
