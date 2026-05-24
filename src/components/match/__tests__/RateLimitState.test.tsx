import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RateLimitState } from '../RateLimitState'

describe('RateLimitState', () => {
  it('renders the countdown value', () => {
    render(<RateLimitState nextRetryInSeconds={120} />)
    expect(screen.getByText('120')).toBeDefined()
    expect(screen.getByText('Límite de solicitudes excedido')).toBeDefined()
  })
})
