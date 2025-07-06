// ABOUTME: Sparkline component for displaying temperature trends using unicode characters
// ABOUTME: Creates compact visual representation of temperature data over time

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

  // Unicode block characters for sparkline
  const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
  
  // Find min and max for scaling
  const min = Math.min(...temps)
  const max = Math.max(...temps)
  const range = max - min || 1 // Avoid division by zero
  
  // Generate sparkline
  const sparkline = temps.map(temp => {
    const normalized = (temp - min) / range
    const index = Math.floor(normalized * (sparkChars.length - 1))
    return sparkChars[Math.max(0, Math.min(sparkChars.length - 1, index))]
  }).join('')

  return (
    <span className={`spark-temp ${className}`}>
      {sparkline}
    </span>
  )
}