import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SectionHeader } from '../SectionHeader'
import type { League } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next/link', () => ({
  default: ({ children, href, className, ...rest }: Record<string, any>) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...rest }: Record<string, any>) => (
    <img src={src} alt={alt} className={className} {...rest} />
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
    render(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} />)
    expect(screen.getByText('Premier League')).toBeDefined()
    expect(screen.getByText('Inglaterra')).toBeDefined()
  })

  it('shows colored left accent bar', () => {
    render(<SectionHeader league={league} isPinned={false} onTogglePin={() => {}} />)
    const header = screen.getByTestId('section-header')
    expect(header.className).toContain('border-l-2')
    expect(header.style.borderColor).toBe('rgb(61, 25, 89)')
  })

  it('shows pin toggle and calls onTogglePin on click', () => {
    const onTogglePin = vi.fn()
    render(<SectionHeader league={league} isPinned={false} onTogglePin={onTogglePin} />)
    const pinButton = screen.getByRole('button')
    expect(pinButton).toBeDefined()
    fireEvent.click(pinButton)
    expect(onTogglePin).toHaveBeenCalledTimes(1)
  })
})
