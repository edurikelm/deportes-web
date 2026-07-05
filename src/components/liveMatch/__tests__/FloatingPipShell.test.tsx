import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FloatingPipShell } from '../FloatingPipShell'
import { MatchClockProvider } from '@/components/match/MatchClockContext'
import type { Match } from '@/lib/types'

function createMatch(overrides?: Partial<Match>): Match {
  return {
    id: 'test-1',
    sport: 'football',
    homeTeam: { id: 'h1', name: 'Home Team', logo: '' },
    awayTeam: { id: 'a1', name: 'Away Team', logo: '' },
    status: 'live',
    startTime: '2026-06-17T12:00:00Z',
    league: { id: 'l1', name: 'Test League', country: 'Test Country', logo: '', color: '#000' },
    score: { home: 2, away: 1 },
    events: [],
    streamLinks: [],
    ...overrides,
  }
}

describe('FloatingPipShell', () => {
  let match: Match

  beforeEach(() => {
    match = createMatch()
  })

  it('renders the scoreboard content', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={vi.fn()}
        />
      </MatchClockProvider>,
    )
    expect(screen.getByText('Home Team')).toBeDefined()
    expect(screen.getByText('Away Team')).toBeDefined()
    expect(screen.getByText(/Test League/)).toBeDefined()
  })

  it('calls onClose when Cerrar is clicked', () => {
    const onClose = vi.fn()
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={onClose}
          onViewDetail={vi.fn()}
        />
      </MatchClockProvider>,
    )
    fireEvent.click(screen.getByText('Cerrar'))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onViewDetail with the match when Ver detalle is clicked', () => {
    const onViewDetail = vi.fn()
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={onViewDetail}
        />
      </MatchClockProvider>,
    )
    fireEvent.click(screen.getByText('Ver detalle'))
    expect(onViewDetail).toHaveBeenCalledOnce()
    expect(onViewDetail).toHaveBeenCalledWith(match)
  })

  it('renders error indicator when pollingError is provided', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={vi.fn()}
          pollingError="Network error"
        />
      </MatchClockProvider>,
    )
    expect(screen.getByText(/Error al actualizar/i)).toBeDefined()
  })

  it('shows retrying indicator when rateLimitInfo is active and no pollingError', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={vi.fn()}
          rateLimitInfo={{ active: true, remainingSeconds: 45 }}
        />
      </MatchClockProvider>,
    )
    expect(screen.getByText(/Reintentando en 45s/i)).toBeDefined()
  })

  it('does not show retrying indicator when pollingError is present', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={vi.fn()}
          pollingError="Network error"
          rateLimitInfo={{ active: true, remainingSeconds: 30 }}
        />
      </MatchClockProvider>,
    )
    expect(screen.queryByText(/Reintentando en/i)).toBeNull()
    expect(screen.getByText(/Error al actualizar/i)).toBeDefined()
  })

  it('does not show retrying indicator when rateLimitInfo.active is false', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={vi.fn()}
          rateLimitInfo={{ active: false, remainingSeconds: 0 }}
        />
      </MatchClockProvider>,
    )
    expect(screen.queryByText(/Reintentando en/i)).toBeNull()
  })

  it('shows correct remaining seconds in retrying indicator', () => {
    render(
      <MatchClockProvider lastFetchTimestamp={undefined}>
        <FloatingPipShell
          match={match}
          lastUpdated={null}
          onClose={vi.fn()}
          onViewDetail={vi.fn()}
          rateLimitInfo={{ active: true, remainingSeconds: 120 }}
        />
      </MatchClockProvider>,
    )
    expect(screen.getByText(/Reintentando en 120s/i)).toBeDefined()
  })
})
