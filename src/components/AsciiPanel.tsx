// ABOUTME: Panel component with Qt style group box chrome and optional title
// ABOUTME: Provides a styled container for weather data sections

import React from 'react'

interface AsciiPanelProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function AsciiPanel({ title, children, className = '' }: AsciiPanelProps) {
  return (
    <div className={`ascii-panel ${className}`}>
      {title && (
        <div className="ascii-title">
          {title}
        </div>
      )}
      <div className="panel-content">
        {children}
      </div>
    </div>
  )
}
