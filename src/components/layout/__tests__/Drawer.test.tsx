import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Drawer } from '../Drawer'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Drawer', () => {
  it('renders hamburger button to open drawer', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={false} onClose={onClose} />)
    const hamburger = screen.getByTestId('hamburger-button')
    expect(hamburger).toBeDefined()
  })

  it('panel is hidden when isOpen is false', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={false} onClose={onClose} />)
    const panel = screen.getByTestId('drawer-panel')
    expect(panel.className).toContain('-translate-x-full')
  })

  it('panel is visible when isOpen is true', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={true} onClose={onClose} />)
    const panel = screen.getByTestId('drawer-panel')
    expect(panel.className).toContain('translate-x-0')
  })

  it('shows overlay when isOpen is true', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('drawer-overlay')
    expect(overlay).toBeDefined()
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={true} onClose={onClose} />)
    const closeBtn = screen.getByTestId('drawer-close-button')
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={true} onClose={onClose} />)
    const overlay = screen.getByTestId('drawer-overlay')
    fireEvent.click(overlay)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={true} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders SidebarContent with onNavigate that calls onClose', () => {
    const onClose = vi.fn()
    render(<Drawer isOpen={true} onClose={onClose} />)
    const futbolBtn = screen.getByText('Futbol').closest('button')
    expect(futbolBtn).toBeDefined()
    fireEvent.click(futbolBtn!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
