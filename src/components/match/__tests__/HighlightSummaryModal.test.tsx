import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { HighlightSummaryModal } from '../HighlightSummaryModal'
import type { Match } from '@/lib/types'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function makeMatch(): Match {
  return {
    id: 'f1',
    sport: 'football',
    homeTeam: { id: '1', name: 'Arsenal', shortName: 'ARS', logo: '' },
    awayTeam: { id: '2', name: 'Chelsea', shortName: 'CHE', logo: '' },
    status: 'finished',
    startTime: '2026-05-01T14:00:00Z',
    league: { id: '1', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
    score: { home: 2, away: 1 },
    events: [],
    streamLinks: [],
  }
}

describe('HighlightSummaryModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
  })

  it('renders trigger button', () => {
    render(<HighlightSummaryModal match={makeMatch()} />)

    expect(screen.getByRole('button', { name: /ver resumen del partido/i })).toBeDefined()
  })

  it('opens modal and shows loading while fetching', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<HighlightSummaryModal match={makeMatch()} />)

    fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
      expect(screen.getByText(/buscando resumen/i)).toBeDefined()
    })
  })

  it('renders iframe when videoUrl is returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videoUrl: 'https://www.youtube.com/embed/abc123', title: 'Highlights' }),
    })

    render(<HighlightSummaryModal match={makeMatch()} />)

    fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

    await waitFor(() => {
      expect(screen.getByTitle(/resumen del partido/i)).toBeDefined()
    })
  })

  it('shows unavailable state when response has no videoUrl', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videoUrl: null, thumbnail: null, title: null }),
    })

    render(<HighlightSummaryModal match={makeMatch()} />)

    fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

    await waitFor(() => {
      expect(screen.getByText(/resumen no disponible/i)).toBeDefined()
    })
  })

  it('shows error state when request fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Failed' }),
    })

    render(<HighlightSummaryModal match={makeMatch()} />)

    fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

    await waitFor(() => {
      expect(screen.getByText(/no se pudo cargar el resumen/i)).toBeDefined()
    })
  })

  it('closes modal when clicking close button', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videoUrl: null, thumbnail: null, title: null }),
    })

    render(<HighlightSummaryModal match={makeMatch()} />)

    fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /cerrar resumen/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('focuses close button when opened', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))

    render(<HighlightSummaryModal match={makeMatch()} />)

    const trigger = screen.getByRole('button', { name: /ver resumen del partido/i })
    trigger.focus()
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /cerrar resumen/i }))
    })
  })

  it('closes modal on Escape key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videoUrl: null, thumbnail: null, title: null }),
    })

    render(<HighlightSummaryModal match={makeMatch()} />)

    fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })

    fireEvent.keyDown(document, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
    })
  })

  it('restores focus to trigger when closed', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ videoUrl: null, thumbnail: null, title: null }),
    })

    render(<HighlightSummaryModal match={makeMatch()} />)

    const trigger = screen.getByRole('button', { name: /ver resumen del partido/i })
    trigger.focus()
    fireEvent.click(trigger)

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeDefined()
    })

    fireEvent.click(screen.getByRole('button', { name: /cerrar resumen/i }))

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull()
      expect(document.activeElement).toBe(trigger)
    })
  })
})
