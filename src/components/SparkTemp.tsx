// ABOUTME: Sparkline component for displaying hoverable temperature trend bars
// ABOUTME: Creates compact visual representation of hourly temperature data

'use client'

import React from 'react'

interface SparkTempProps {
  temps: number[]
  className?: string
}

export function SparkTemp({ temps, className = '' }: SparkTempProps) {
  if (temps.length === 0) {
    return <span className={`spark-temp ${className}`}></span>
  }

  const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = max - min || 1
  const bars = temps.map((temp, hourIndex) => {
    const normalized = (temp - min) / range
    const index = Math.floor(normalized * (sparkChars.length - 1))
    const char = sparkChars[Math.max(0, Math.min(sparkChars.length - 1, index))]

    return {
      char,
      label: `Hour ${hourIndex + 1}: ${temp}°F`,
      temp,
    }
  })

  return (
    <span className={`spark-temp ${className}`}>
      {bars.map((bar, index) => (
        <span
          aria-label={bar.label}
          className="spark-temp-bar"
          data-tooltip={bar.label}
          key={`${index}-${bar.temp}`}
          tabIndex={0}
          title={bar.label}
        >
          {bar.char}
        </span>
      ))}
    </span>
  )
}
