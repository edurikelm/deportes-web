import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarContent } from '../SidebarContent'

const { mockPinnedIds, mockUsePathname, mockUseSearchParams } = vi.hoisted(() => {
  let pinnedIds: string[] = []

  return {
    mockPinnedIds: pinnedIds,
    mockUsePathname: vi.fn(() => '/'),
    mockUseSearchParams: vi.fn(() => new URLSearchParams()),
  }
})

const mockTogglePin = vi.fn()
const mockIsPinned = vi.fn((id: string) => mockPinnedIds.includes(id))

vi.mock('@/hooks/usePinnedLeagues', () => ({
  usePinnedLeagues: vi.fn(() => ({
    get pinnedIds() { return mockPinnedIds },
    togglePin: mockTogglePin,
    isPinned: mockIsPinned,
  })),
}))

vi.mock('next/navigation', () => ({
  usePathname: mockUsePathname,
  useSearchParams: () => mockUseSearchParams(),
}))

beforeEach(() => {
  mockPinnedIds.length = 0
  mockTogglePin.mockClear()
  mockIsPinned.mockClear()
  mockUseSearchParams.mockClear()
  mockUsePathname.mockClear()
  mockUsePathname.mockReturnValue('/')
  mockUseSearchParams.mockReturnValue(new URLSearchParams())
})

describe('SidebarContent', () => {
  it('shows pin icon that calls togglePin when clicked', () => {
    render(<SidebarContent />)
    const premierLink = screen.getByText('Premier League').closest('a')!
    const pinBtn = premierLink.querySelector('button')
    expect(pinBtn).toBeDefined()
    fireEvent.click(pinBtn!)
    expect(mockTogglePin).toHaveBeenCalledWith('39')
  })

  it('highlights active league when liga param is present', () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('liga=39'))
    render(<SidebarContent />)
    const premierLink = screen.getByText('Premier League').closest('a')!
    expect(premierLink.className).toContain('bg-[#1a1a1a]')
    expect(premierLink.className).toContain('text-white')
  })

  it('expands active sport when its league is in the URL', () => {
    mockUsePathname.mockReturnValue('/basketball')
    mockUseSearchParams.mockReturnValue(new URLSearchParams('liga=nba'))
    render(<SidebarContent />)
    expect(screen.getByText('NBA')).toBeDefined()
    expect(screen.getByText('EuroLeague')).toBeDefined()
    expect(() => screen.getByText('Premier League')).toThrow()
  })

  it('shows filled pin icon for pinned leagues', () => {
    mockPinnedIds.push('39')
    render(<SidebarContent />)
    const premierLink = screen.getByText('Premier League').closest('a')!
    const pinSvg = premierLink.querySelector('button svg')
    expect(pinSvg?.getAttribute('class')).toContain('fill-current')
  })

  it('shows pinned leagues before unpinned ones under a sport', () => {
    mockPinnedIds.push('140')
    render(<SidebarContent />)
    const leagueLinks = screen.getAllByRole('link').filter(
      (link) => link.getAttribute('href')?.includes('?liga=')
    )
    expect(leagueLinks[0].textContent).toContain('La Liga')
    expect(leagueLinks[1].textContent).toContain('Premier League')
  })

  it('collapses and expands leagues when clicking a sport', () => {
    render(<SidebarContent />)
    expect(screen.getByText('Premier League')).toBeDefined()
    const futbolBtn = screen.getByText('Futbol').closest('button')!
    fireEvent.click(futbolBtn)
    expect(() => screen.getByText('Premier League')).toThrow()

    const basquetBtn = screen.getByText('Basquet').closest('button')!
    expect(() => screen.getByText('NBA')).toThrow()
    fireEvent.click(basquetBtn)
    expect(screen.getByText('NBA')).toBeDefined()
    expect(screen.getByText('EuroLeague')).toBeDefined()
  })
  it('renders logo "LiveScores" at the top', () => {
    render(<SidebarContent />)
    expect(screen.getByText('Live')).toBeDefined()
    expect(screen.getByText('Scores')).toBeDefined()
  })

  it('renders sport navigation links', () => {
    render(<SidebarContent />)
    expect(screen.getByText('Futbol')).toBeDefined()
    expect(screen.getByText('Basquet')).toBeDefined()
    expect(screen.getByText('MMA')).toBeDefined()
  })

  it('renders "En vivo" with live status indicator', () => {
    render(<SidebarContent />)
    expect(screen.getByText('En vivo')).toBeDefined()
  })

  it('renders "Buscar" link', () => {
    render(<SidebarContent />)
    expect(screen.getByText('Buscar')).toBeDefined()
  })

  it('active sport (Futbol on /) has green accent bar', () => {
    render(<SidebarContent />)
    const futbolItem = screen.getByText('Futbol').closest('button')
    expect(futbolItem?.className).toContain('border-l-2')
    expect(futbolItem?.className).toContain('border-[#22c55e]')
  })

  it('renders league sub-items for the first sport (Futbol) as expanded', () => {
    render(<SidebarContent />)
    expect(screen.getByText('Premier League')).toBeDefined()
    expect(screen.getByText('La Liga')).toBeDefined()
    expect(screen.getByText('Bundesliga')).toBeDefined()
    expect(screen.getByText('Serie A')).toBeDefined()
    expect(screen.getByText('Ligue 1')).toBeDefined()
    expect(() => screen.getByText('NBA')).toThrow()
    expect(() => screen.getByText('EuroLeague')).toThrow()
    expect(() => screen.getByText('UFC')).toThrow()
  })
})
