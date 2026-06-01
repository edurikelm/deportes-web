import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SidebarLayout } from '../SidebarLayout'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('SidebarLayout', () => {
  it('renders Header with logo', () => {
    render(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>
    )
    const liveElements = screen.getAllByText('Live')
    expect(liveElements.length).toBeGreaterThanOrEqual(1)
    const scoresElements = screen.getAllByText('Scores')
    expect(scoresElements.length).toBeGreaterThanOrEqual(1)
  })

  it('renders children content inside main', () => {
    render(
      <SidebarLayout>
        <div>main content here</div>
      </SidebarLayout>
    )
    expect(screen.getByText('main content here')).toBeDefined()
  })

  it('opens drawer when hamburger button is clicked', () => {
    render(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>
    )
    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)
    const panel = screen.getByTestId('drawer-panel')
    expect(panel.className).toContain('translate-x-0')
  })

  it('closes drawer when close button is clicked', () => {
    render(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>
    )
    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)
    const closeBtn = screen.getByTestId('drawer-close-button')
    fireEvent.click(closeBtn)
    const panel = screen.getByTestId('drawer-panel')
    expect(panel.className).toContain('-translate-x-full')
  })

  it('closes drawer when overlay is clicked', () => {
    render(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>
    )
    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)
    const overlay = screen.getByTestId('drawer-overlay')
    fireEvent.click(overlay)
    const panel = screen.getByTestId('drawer-panel')
    expect(panel.className).toContain('-translate-x-full')
  })

  it('closes drawer when navigation link is clicked', () => {
    render(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>
    )
    const hamburger = screen.getByTestId('hamburger-button')
    fireEvent.click(hamburger)
    const panel = screen.getByTestId('drawer-panel')
    const futbolBtns = panel.querySelectorAll('button')
    const futbolBtn = Array.from(futbolBtns).find((b) => b.textContent?.includes('Futbol'))
    expect(futbolBtn).toBeDefined()
    fireEvent.click(futbolBtn!)
    expect(panel.className).toContain('-translate-x-full')
  })

  it('main content has proper padding classes', () => {
    render(
      <SidebarLayout>
        <div>content</div>
      </SidebarLayout>
    )
    const main = document.querySelector('main')
    expect(main?.className).toContain('pt-12')
    expect(main?.className).toContain('lg:pl-')
    expect(main?.className).toContain('min-h-screen')
  })
})
