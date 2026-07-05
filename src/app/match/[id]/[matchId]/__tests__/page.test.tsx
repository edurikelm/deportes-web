import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Match } from '@/lib/types'
import MatchSportDetailPage from '../page'
import { useLiveMatchFloating } from '@/contexts/LiveMatchFloatingContext'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

let capturedOnData: ((data: unknown) => void) | undefined
let capturedLiveOnData: ((data: unknown) => void) | undefined
let capturedPipOptions: Record<string, unknown> = {}
let lastMatchPollingEnabled: boolean | undefined
let currentError: string | null = null
let currentPipError: string | null = null

let mockParams: Record<string, string> = { id: 'football', matchId: 'f1' }

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  useParams: () => mockParams,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} />
  },
}))

vi.mock('@/hooks/useMatchPolling', () => ({
  useMatchPolling: vi.fn(({ onData, enabled }: { onData?: (data: unknown) => void; enabled?: boolean }) => {
    capturedOnData = onData
    lastMatchPollingEnabled = enabled
    return {
      isPolling: true,
      lastUpdated: new Date(),
      error: currentError,
      rateLimitInfo: { active: false, remainingSeconds: 0 },
    }
  }),
}))

vi.mock('@/contexts/LiveMatchFloatingContext', () => ({
  useLiveMatchFloating: vi.fn(),
}))

vi.mock('@/hooks/useLiveMatchPolling', () => ({
  useLiveMatchPolling: vi.fn((options: Record<string, unknown>) => {
    capturedPipOptions = options
    capturedLiveOnData = options.onData as ((data: unknown) => void) | undefined
    return {
      isPolling: false,
      lastUpdated: null,
      error: currentPipError,
      rateLimitInfo: { active: false, remainingSeconds: 0 },
    }
  }),
}))

vi.mock('@/components/match/MatchClockContext', () => ({
  MatchClockProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useMatchClockContext: () => ({ lastFetchTimestamp: undefined }),
}))

vi.mock('@/components/match/ScoreDisplay', () => ({
  ScoreDisplay: ({ match }: { match: { homeTeam: { name: string }; awayTeam: { name: string }; score?: { home: number; away: number } } }) => (
    <div data-testid="score">
      <span>{match.homeTeam.name}</span>
      <span>{match.score?.home ?? '-'} - {match.score?.away ?? '-'}</span>
      <span>{match.awayTeam.name}</span>
    </div>
  ),
}))

vi.mock('@/components/match/StatusBadge', () => ({
  StatusBadge: ({ status }: { status: string }) => <span data-testid="status">{status}</span>,
}))

const mockUseLineup = vi.fn()
vi.mock('@/hooks/useLineup', () => ({
  useLineup: (...args: unknown[]) => mockUseLineup(...args),
}))

const mockUseLiveMatchFloating = vi.mocked(useLiveMatchFloating)

function makeMatch(overrides: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    sport: 'football',
    homeTeam: { id: '1', name: 'Arsenal', shortName: 'ARS', logo: '' },
    awayTeam: { id: '2', name: 'Chelsea', shortName: 'CHE', logo: '' },
    status: 'live' as const,
    startTime: '2026-05-01T14:00:00Z',
    minute: 67,
    league: { id: '1', name: 'Premier League', country: 'England', logo: '', color: '#3d1959' },
    score: { home: 2, away: 1 },
    events: [],
    streamLinks: [{ type: 'tv' as const, name: 'Sky Sports' }],
    ...overrides,
  }
}

describe('MatchSportDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    mockUseLineup.mockReset()
    mockUseLineup.mockReturnValue({
      lineup: null,
      loading: false,
      error: null,
      loadLineup: vi.fn(),
    })
    mockParams = { id: 'football', matchId: 'f1' }
    capturedOnData = undefined
    capturedLiveOnData = undefined
    capturedPipOptions = {}
    lastMatchPollingEnabled = undefined
    currentError = null
    currentPipError = null
    mockUseLiveMatchFloating.mockReturnValue({
      isSupported: true,
      isFloatingOpen: false,
      floatingMatch: null,
      openFloatingMatch: vi.fn(),
      updateFloatingContent: vi.fn(),
      closeFloatingMatch: vi.fn(),
      setFloatingError: vi.fn(),
      lastUpdated: null,
    })
  })

  it('renders a football match from the direct match endpoint', async () => {
    render(<MatchSportDetailPage />)

    capturedOnData?.({ match: makeMatch() })

    await waitFor(() => {
      expect(screen.getByText('Arsenal')).toBeDefined()
      expect(screen.getByText('Chelsea')).toBeDefined()
    })
  })

  it('renders match information section heading', async () => {
    render(<MatchSportDetailPage />)

    capturedOnData?.({ match: makeMatch() })

    await waitFor(() => {
      expect(screen.getByText('Arsenal')).toBeDefined()
    })

    expect(screen.getByRole('heading', { name: /información del partido/i })).toBeDefined()
  })

  it('renders a basketball match from the direct match endpoint', async () => {
    mockParams = { id: 'basketball', matchId: 'b1' }

    render(<MatchSportDetailPage />)

    capturedOnData?.({ match: makeMatch({ id: 'b1', sport: 'basketball', homeTeam: { id: '3', name: 'Lakers', shortName: 'LAL', logo: '' }, awayTeam: { id: '4', name: 'Celtics', shortName: 'BOS', logo: '' } }) })

    await waitFor(() => {
      expect(screen.getByText('Lakers')).toBeDefined()
      expect(screen.getByText('Celtics')).toBeDefined()
    })
  })

  it('shows error for unsupported sport', async () => {
    mockParams = { id: 'rugby', matchId: '1' }

    render(<MatchSportDetailPage />)

    await waitFor(() => {
      expect(screen.getByText(/deporte no soportado/i)).toBeDefined()
    })
  })

  it('shows error when match is not found', async () => {
    render(<MatchSportDetailPage />)

    capturedOnData?.({ match: null })

    await waitFor(() => {
      expect(screen.getByText(/partido no encontrado/i)).toBeDefined()
    })
  })

  describe('floating match action', () => {
    it('shows enabled "Abrir flotante" button for live match', async () => {
      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByText('Arsenal')).toBeDefined()
      })

      const btn = screen.getByRole('button', { name: /abrir flotante/i })
      expect(btn.getAttribute('disabled')).toBeNull()
    })

    it('shows disabled button with incompatibility message for unsupported browser', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: false,
        isFloatingOpen: false,
        floatingMatch: null,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        const btn = screen.getByRole('button', { name: /abrir flotante/i })
        expect(btn.getAttribute('disabled')).not.toBeNull()
        expect(screen.getByText(/no compatible con este navegador/i)).toBeDefined()
      })
    })

    it('opens floating match when "Abrir flotante" is clicked for live match', async () => {
      const openFloatingMatch = vi.fn()
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: false,
        floatingMatch: null,
        openFloatingMatch,
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByText('Arsenal')).toBeDefined()
      })

      fireEvent.click(screen.getByRole('button', { name: /abrir flotante/i }))

      expect(openFloatingMatch).toHaveBeenCalledOnce()
      expect(openFloatingMatch).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'f1' }),
        expect.any(Date),
      )
    })

    it('shows "Reemplazar flotante" when another match is already floating', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'other-match' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByText('Arsenal')).toBeDefined()
      })

      expect(screen.getByRole('button', { name: /reemplazar flotante/i })).toBeDefined()
    })

    it('uses updateFloatingContent during background polling, not openFloatingMatch', async () => {
      const updateFloatingContent = vi.fn()
      const openFloatingMatch = vi.fn()
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch,
        updateFloatingContent,
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedLiveOnData?.({ matches: [makeMatch({ score: { home: 3, away: 1 } })] })

      await waitFor(() => {
        expect(updateFloatingContent).toHaveBeenCalledWith(
          expect.objectContaining({ id: 'f1', score: { home: 3, away: 1 } }),
          expect.any(Date),
        )
      })

      expect(openFloatingMatch).not.toHaveBeenCalled()
    })

    it('keeps main detail polling enabled when PiP is open so page can hydrate on direct navigation', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      expect(lastMatchPollingEnabled).toBe(true)
    })

    it('hydrates page from main polling when navigating directly with PiP open showing different match', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'different-match' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByText('Arsenal')).toBeDefined()
        expect(screen.getByText('Chelsea')).toBeDefined()
      })
    })

    it('PiP polling updates do not call openFloatingMatch even when page state is updated', async () => {
      const openFloatingMatch = vi.fn()
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch,
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedLiveOnData?.({ matches: [makeMatch({ score: { home: 3, away: 1 } })] })

      expect(openFloatingMatch).not.toHaveBeenCalled()
    })

    it('shows open state and Cerrar button when current match is floating', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByText('Arsenal')).toBeDefined()
      })

      expect(screen.getByText(/ventana flotante abierta/i)).toBeDefined()
      expect(screen.getByRole('button', { name: /cerrar/i })).toBeDefined()
    })

    it('renders match data from PiP polling when main polling is disabled', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      capturedLiveOnData?.({ matches: [makeMatch()] })

      await waitFor(() => {
        expect(screen.getByText('Arsenal')).toBeDefined()
        expect(screen.getByText('Chelsea')).toBeDefined()
      })
    })

    it('does not pass status filter to PiP polling options', async () => {
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError: vi.fn(),
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      expect(capturedPipOptions.status).toBeUndefined()
    })

    it('syncs PiP polling error to floating context', async () => {
      currentPipError = 'Network error'
      const setFloatingError = vi.fn()
      mockUseLiveMatchFloating.mockReturnValue({
        isSupported: true,
        isFloatingOpen: true,
        floatingMatch: { id: 'f1' } as unknown as Match,
        openFloatingMatch: vi.fn(),
        updateFloatingContent: vi.fn(),
        closeFloatingMatch: vi.fn(),
        setFloatingError,
        lastUpdated: null,
      })

      render(<MatchSportDetailPage />)

      await waitFor(() => {
        expect(setFloatingError).toHaveBeenCalledWith('Network error')
      })
    })
  })

  describe('match summary highlights', () => {
    it('renders a visible "Ver resumen del partido" button for football match', async () => {
      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /ver resumen del partido/i })).toBeDefined()
      })
    })

    it('opens modal and fetches /api/highlights with current match data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          videoUrl: 'https://www.youtube.com/embed/abc123',
          thumbnail: 'https://img.youtube.com/abc.jpg',
          title: 'Arsenal vs Chelsea highlights',
        }),
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => expect(screen.getByText('Arsenal')).toBeDefined())

      fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledOnce()
        const url = mockFetch.mock.calls[0][0] as string
        expect(url).toContain('/api/highlights?')
        expect(url).toContain('matchId=f1')
        expect(url).toContain(`homeTeam=${encodeURIComponent('Arsenal')}`)
        expect(url).toContain(`awayTeam=${encodeURIComponent('Chelsea')}`)
        expect(url).toContain('leagueName=Premier+League')
        expect(url).toContain('leagueCountry=England')
      })

      await waitFor(() => {
        expect(screen.getByTitle(/resumen del partido/i)).toBeDefined()
      })
    })

    it('shows unavailable state when highlight has no videoUrl', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ videoUrl: null, thumbnail: null, title: null }),
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => expect(screen.getByText('Arsenal')).toBeDefined())

      fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

      await waitFor(() => {
        expect(screen.getByText(/resumen no disponible/i)).toBeDefined()
      })
    })

    it('shows error state when highlights request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Failed to search highlight video' }),
      })

      render(<MatchSportDetailPage />)

      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => expect(screen.getByText('Arsenal')).toBeDefined())

      fireEvent.click(screen.getByRole('button', { name: /ver resumen del partido/i }))

      await waitFor(() => {
        expect(screen.getByText(/no se pudo cargar el resumen/i)).toBeDefined()
      })
    })
  })

  describe('tabs', () => {
    it('renders default summary tab for football', async () => {
      render(<MatchSportDetailPage />)
      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /información del partido/i })).toBeDefined()
      })

      expect(screen.getByRole('tab', { name: /resumen/i })).toBeDefined()
      expect(screen.getByRole('tab', { name: /cronología/i })).toBeDefined()
      expect(screen.getByRole('tab', { name: /alineaciones/i })).toBeDefined()
      expect(screen.getByRole('tab', { name: /transmisión/i })).toBeDefined()
    })

    it('does not fetch lineup on initial render for football', async () => {
      const loadLineup = vi.fn()
      mockUseLineup.mockReturnValue({
        lineup: null,
        loading: false,
        error: null,
        loadLineup,
      })

      render(<MatchSportDetailPage />)
      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => expect(screen.getByText('Arsenal')).toBeDefined())

      expect(loadLineup).not.toHaveBeenCalled()
    })

    it('fetches lineup once when activating lineups tab for football', async () => {
      const loadLineup = vi.fn()
      mockUseLineup.mockReturnValue({
        lineup: null,
        loading: false,
        error: null,
        loadLineup,
      })

      render(<MatchSportDetailPage />)
      capturedOnData?.({ match: makeMatch() })

      await waitFor(() => expect(screen.getByText('Arsenal')).toBeDefined())

      expect(loadLineup).not.toHaveBeenCalled()

      fireEvent.click(screen.getByRole('tab', { name: /alineaciones/i }))

      await waitFor(() => {
        expect(loadLineup).toHaveBeenCalledTimes(1)
      })

      fireEvent.click(screen.getByRole('tab', { name: /cronología/i }))
      fireEvent.click(screen.getByRole('tab', { name: /alineaciones/i }))

      expect(loadLineup).toHaveBeenCalledTimes(1)
    })

    it('does not show lineups tab for basketball', async () => {
      mockParams = { id: 'basketball', matchId: 'b1' }
      render(<MatchSportDetailPage />)
      capturedOnData?.({ match: makeMatch({ id: 'b1', sport: 'basketball', homeTeam: { id: '3', name: 'Lakers', shortName: 'LAL', logo: '' }, awayTeam: { id: '4', name: 'Celtics', shortName: 'BOS', logo: '' } }) })

      await waitFor(() => expect(screen.getByText('Lakers')).toBeDefined())

      expect(screen.queryByRole('tab', { name: /alineaciones/i })).toBeNull()
    })

    it('does not show lineups tab for mma', async () => {
      mockParams = { id: 'mma', matchId: 'm1' }
      render(<MatchSportDetailPage />)
      capturedOnData?.({ match: makeMatch({ id: 'm1', sport: 'mma', homeTeam: { id: '5', name: 'Fighter A', shortName: 'A', logo: '' }, awayTeam: { id: '6', name: 'Fighter B', shortName: 'B', logo: '' } }) })

      await waitFor(() => expect(screen.getByText('Fighter A')).toBeDefined())

      expect(screen.queryByRole('tab', { name: /alineaciones/i })).toBeNull()
    })
  })
})
