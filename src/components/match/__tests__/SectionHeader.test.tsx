import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionHeader } from '../SectionHeader'
import type { League } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: React.ReactNode; href: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    <img src={src || undefined} alt={alt} className={className} />
  ),
}))

const league: League = {
  id: '39',
  name: 'Premier League',
  country: 'Inglaterra',
  logo: '',
  color: '#3d1959',
}

describe('SectionHeader', () => {
  it('renders league name and country', () => {
    render(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} sport="football" />)
    expect(screen.getByText('Premier League')).toBeDefined()
    expect(screen.getByText('Inglaterra')).toBeDefined()
  })

  it('shows colored left accent bar', () => {
    render(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} sport="football" />)
    const header = screen.getByTestId('section-header')
    expect(header.className).toContain('border-l-2')
    expect(header.style.borderLeftColor).toBe('rgb(61, 25, 89)')
  })

  it('shows pin toggle and calls onTogglePin on click', () => {
    const onTogglePin = vi.fn()
    render(<SectionHeader league={league} isPinned={false} onTogglePin={onTogglePin} sport="football" />)
    const pinButton = screen.getByLabelText(/Fijar Premier League/)
    expect(pinButton).toBeDefined()
    fireEvent.click(pinButton)
    expect(onTogglePin).toHaveBeenCalledTimes(1)
  })

  it('hides Tabla button for all sports when standings feature is disabled', () => {
    const { rerender } = render(
      <SectionHeader league={league} isPinned={false} onTogglePin={() => {}} sport="football" />
    )
    expect(screen.queryByRole('button', { name: /tabla/i })).toBeNull()

    rerender(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} sport="basketball" />)
    expect(screen.queryByRole('button', { name: /tabla/i })).toBeNull()

    rerender(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} sport="mma" />)
    expect(screen.queryByRole('button', { name: /tabla/i })).toBeNull()
  })

  it('keeps pin button accessible when standings feature is disabled', () => {
    render(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} sport="football" />)
    expect(screen.getByLabelText(/Fijar Premier League/)).toBeDefined()
    expect(screen.queryByRole('button', { name: /tabla/i })).toBeNull()
  })
})
