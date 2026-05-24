import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import { SportPage } from '../SportPage'
import { SPORT_PAGE_CONFIGS } from '@/lib/sportPageConfig'
import { MOCK_MATCHES } from '@/lib/mock-data'

beforeEach(() => {
  vi.useFakeTimers()
  globalThis.fetch = vi.fn().mockResolvedValue({
    json: () =>
      Promise.resolve({
        matches: [],
        meta: { total: 0, cached: false, cacheAge: 0 },
      }),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('SportPage', () => {
  it('renders without crashing for football', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })
  })

  it('renders without crashing for basketball', async () => {
    await act(async () => {
      render(<SportPage sport="basketball" />)
    })
  })

  it('renders without crashing for mma', async () => {
    await act(async () => {
      render(<SportPage sport="mma" />)
    })
  })

  it('renders all tab buttons', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })

    expect(screen.getByText('Todos')).toBeDefined()
    const liveElements = screen.getAllByText('En vivo')
    expect(liveElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Próximos')).toBeDefined()
    expect(screen.getByText('Finalizados')).toBeDefined()
  })

  it('shows MatchListSkeleton while loading', () => {
    render(<SportPage sport="football" />)

    const skeleton = document.querySelector('.grid.gap-3')
    expect(skeleton).not.toBeNull()
  })

  it('renders the correct title for each sport', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })
    expect(screen.getByText('Fútbol')).toBeDefined()

    await act(async () => {
      render(<SportPage sport="basketball" />)
    })
    expect(screen.getByText('Básquet')).toBeDefined()

    await act(async () => {
      render(<SportPage sport="mma" />)
    })
    expect(screen.getByText('MMA')).toBeDefined()
  })

  it('opens league dropdown and shows football leagues when button clicked', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })

    const ligaButton = screen.getByText('Liga')
    await act(async () => {
      fireEvent.click(ligaButton)
    })

    for (const league of SPORT_PAGE_CONFIGS.football.leagues) {
      expect(screen.getByText(league.name)).toBeDefined()
    }
  })

  it('opens league dropdown and shows basketball leagues when button clicked', async () => {
    await act(async () => {
      render(<SportPage sport="basketball" />)
    })

    const ligaButton = screen.getByText('Liga')
    await act(async () => {
      fireEvent.click(ligaButton)
    })

    for (const league of SPORT_PAGE_CONFIGS.basketball.leagues) {
      expect(screen.getByText(league.name)).toBeDefined()
    }
  })

  it('opens league dropdown and shows mma leagues when button clicked', async () => {
    await act(async () => {
      render(<SportPage sport="mma" />)
    })

    const ligaButton = screen.getByText('Liga')
    await act(async () => {
      fireEvent.click(ligaButton)
    })

    for (const league of SPORT_PAGE_CONFIGS.mma.leagues) {
      expect(screen.getByText(league.name)).toBeDefined()
    }
  })

  it('renders live count badge in the Live tab button', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })

    const liveButtons = screen.getAllByText('En vivo')
    expect(liveButtons.length).toBeGreaterThanOrEqual(1)
  })

  it('has a SearchBar with default text', async () => {
    await act(async () => {
      render(<SportPage sport="football" />)
    })

    expect(screen.getByPlaceholderText('Buscar equipo...')).toBeDefined()
  })

  it('clearing search restores all matches (search is not destructive)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          matches: MOCK_MATCHES,
          meta: { total: 6, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<SportPage sport="football" />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    expect(screen.getByText('Arsenal FC')).toBeDefined()
    expect(screen.getByText('Real Madrid')).toBeDefined()
    expect(screen.getByText('Bayern Munich')).toBeDefined()

    const input = screen.getByPlaceholderText('Buscar equipo...')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Arsenal' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    const arsenalElements = screen.getAllByText('Arsenal FC')
    expect(arsenalElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Real Madrid')).toBeNull()

    await act(async () => {
      fireEvent.change(input, { target: { value: '' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText('Arsenal FC')).toBeDefined()
    expect(screen.getByText('Real Madrid')).toBeDefined()
    expect(screen.getByText('Bayern Munich')).toBeDefined()
  })

  it('search and tab filters compose correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          matches: MOCK_MATCHES,
          meta: { total: 6, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<SportPage sport="football" />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    const input = screen.getByPlaceholderText('Buscar equipo...')

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Arsenal' } })
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    const arsenalElements1 = screen.getAllByText('Arsenal FC')
    expect(arsenalElements1.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Real Madrid')).toBeNull()

    const upcomingTab = screen.getByText('Próximos')
    await act(async () => {
      fireEvent.click(upcomingTab)
    })

    await act(async () => {
      fireEvent.mouseDown(document.body)
    })

    expect(screen.queryByText('Premier League')).toBeNull()

    const allTab = screen.getByText('Todos')
    await act(async () => {
      fireEvent.click(allTab)
    })

    const leagueNames = screen.getAllByText('Premier League')
    expect(leagueNames.length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('Real Madrid')).toBeNull()
  })

  it('search and league filter compose correctly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          matches: MOCK_MATCHES,
          meta: { total: 6, cached: false, cacheAge: 0 },
        }),
    })

    await act(async () => {
      render(<SportPage sport="football" />)
    })

    await act(async () => {
      vi.advanceTimersByTime(0)
    })

    await act(async () => {
      fireEvent.click(screen.getByText('Liga'))
    })

    const premierLeagueOption = screen.getAllByText('Premier League')[0]
    await act(async () => {
      fireEvent.click(premierLeagueOption)
    })

    expect(screen.getByText('Arsenal FC')).toBeDefined()
    expect(screen.getByText('Manchester City')).toBeDefined()
    expect(screen.queryByText('Real Madrid')).toBeNull()

    await act(async () => {
      const upcomingTab = screen.getAllByText('Próximos')[0]
      fireEvent.click(upcomingTab)
    })

    expect(screen.queryByText('Arsenal FC')).toBeNull()
    expect(screen.getByText('Manchester City')).toBeDefined()
  })
})
