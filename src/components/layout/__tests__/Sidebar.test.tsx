import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Sidebar', () => {
  it('renders navigation links from SidebarContent', () => {
    render(<Sidebar />)
    expect(screen.getByText('Futbol')).toBeDefined()
    expect(screen.getByText('Basquet')).toBeDefined()
    expect(screen.getByText('MMA')).toBeDefined()
  })
})
