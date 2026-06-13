// ABOUTME: Tests for SparkTemp component hoverable temperature sparkline rendering
// ABOUTME: Ensures each hourly bar exposes its temperature label

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SparkTemp } from './SparkTemp'

describe('SparkTemp', () => {
  it('should render a unicode sparkline for temperature data', () => {
    const temps = [72, 71, 70, 69, 68, 67, 66, 65]
    const { container } = render(<SparkTemp temps={temps} />)
    
    const sparkline = container.querySelector('.spark-temp')
    expect(sparkline).toBeTruthy()
    
    // Should contain sparkline characters
    const text = sparkline?.textContent || ''
    expect(text.length).toBeGreaterThan(0)
    
    // Should contain unicode block characters
    const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
    const hasSparkChar = sparkChars.some(char => text.includes(char))
    expect(hasSparkChar).toBe(true)
  })

  it('should expose a temperature tooltip for each hourly bar', () => {
    const { container } = render(<SparkTemp temps={[72, 68]} />)

    const bars = container.querySelectorAll('.spark-temp-bar')
    expect(bars).toHaveLength(2)
    expect(bars[0].getAttribute('data-tooltip')).toBe('Hour 1: 72°F')
    expect(bars[0].getAttribute('aria-label')).toBe('Hour 1: 72°F')
    expect(bars[1].getAttribute('title')).toBe('Hour 2: 68°F')
  })

  it('should handle empty temperature array', () => {
    const { container } = render(<SparkTemp temps={[]} />)
    
    const sparkline = container.querySelector('.spark-temp')
    expect(sparkline?.textContent).toBe('')
  })

  it('should handle single temperature value', () => {
    const { container } = render(<SparkTemp temps={[72]} />)
    
    const sparkline = container.querySelector('.spark-temp')
    expect(sparkline?.textContent?.length).toBe(1)
  })

  it('should apply custom className', () => {
    const { container } = render(<SparkTemp temps={[72, 71]} className="custom-class" />)
    
    const sparkline = container.querySelector('.spark-temp')
    expect(sparkline?.classList.contains('custom-class')).toBe(true)
  })
})
