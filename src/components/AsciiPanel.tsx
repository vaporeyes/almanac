// ABOUTME: ASCII panel component with retro double borders and optional FIGlet title
// ABOUTME: Provides a styled container for weather data with classic terminal aesthetics

'use client'

import React, { useEffect, useState } from 'react'
import figlet from 'figlet'
// @ts-expect-error - figlet fonts don't have TypeScript definitions
import standard from 'figlet/importable-fonts/Standard'

interface AsciiPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function AsciiPanel({ title, children, className = '' }: AsciiPanelProps) {
  const [asciiTitle, setAsciiTitle] = useState<string>('')

  useEffect(() => {
    if (title) {
      // Parse and load the font synchronously
      figlet.parseFont('Standard', standard)
      
      // Generate ASCII art title
      figlet.text(title, {
        font: 'Standard',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
      }, (err, data) => {
        if (!err && data) {
          setAsciiTitle(data)
        }
      })
    }
  }, [title])

  return (
    <div className={`ascii-panel ${className}`}>
      {asciiTitle && (
        <pre className="ascii-title text-center mb-4 text-xs leading-none">
          {asciiTitle}
        </pre>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  )
}