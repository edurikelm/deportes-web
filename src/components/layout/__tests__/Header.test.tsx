import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from '../Header'

describe('Header', () => {
  it('renders logo text "LiveScores"', () => {
    render(<Header />)
    expect(screen.getByText('Live')).toBeDefined()
    expect(screen.getByText('Scores')).toBeDefined()
  })

  it('renders "Live" in white and "Scores" in red', () => {
    render(<Header />)
    const liveSpan = screen.getByText('Live')
    const scoresSpan = screen.getByText('Scores')
    expect(liveSpan.className).toContain('text-white')
    expect(scoresSpan.className).toContain('text-[#ef4444]')
  })

  it('renders search and settings icons', () => {
    render(<Header />)
    expect(screen.getByTestId('search-icon')).toBeDefined()
    expect(screen.getByTestId('settings-icon')).toBeDefined()
  })
})
