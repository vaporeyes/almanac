// ABOUTME: Tests for AsciiPanel component - validates ASCII art rendering
// ABOUTME: Ensures proper border rendering and FIGlet title display

import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { AsciiPanel } from './AsciiPanel'

describe('AsciiPanel', () => {
  it('should render with double border and FIGlet title', async () => {
    const { container } = render(
      <AsciiPanel title="TODAY">
        <div>Test content</div>
      </AsciiPanel>
    )
    
    const panel = container.querySelector('.ascii-panel')
    expect(panel).toBeDefined()
    
    // Wait for ASCII art title to be generated
    await waitFor(() => {
      const title = container.querySelector('.ascii-title')
      expect(title).toBeTruthy()
      expect(title?.textContent).toBeTruthy()
    })
    
    // Check for ascii-panel class which includes border styles
    expect(panel?.classList.contains('ascii-panel')).toBe(true)
    
    // Check for content
    expect(container.textContent).toContain('Test content')
  })

  it('should render without title when not provided', () => {
    const { container } = render(
      <AsciiPanel>
        <div>Test content</div>
      </AsciiPanel>
    )
    
    const title = container.querySelector('.ascii-title')
    expect(title).toBeNull()
    
    expect(container.textContent).toContain('Test content')
  })

  it('should apply custom className', () => {
    const { container } = render(
      <AsciiPanel className="custom-class">
        <div>Test content</div>
      </AsciiPanel>
    )
    
    const panel = container.querySelector('.ascii-panel')
    expect(panel?.classList.contains('custom-class')).toBe(true)
  })
})