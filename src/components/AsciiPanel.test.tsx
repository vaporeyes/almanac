// ABOUTME: Tests for AsciiPanel component title and content rendering
// ABOUTME: Ensures custom classes and untitled panels work correctly

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AsciiPanel } from './AsciiPanel'

describe('AsciiPanel', () => {
  it('should render with a Qt group title', () => {
    const { container } = render(
      <AsciiPanel title="TODAY">
        <div>Test content</div>
      </AsciiPanel>
    )
    
    const panel = container.querySelector('.ascii-panel')
    expect(panel).toBeDefined()

    const title = container.querySelector('.ascii-title')
    expect(title).toBeTruthy()
    expect(title?.textContent).toBe('TODAY')

    expect(panel?.classList.contains('ascii-panel')).toBe(true)
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
