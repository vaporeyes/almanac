// ABOUTME: Client-side Qt style window shell with draggable title bar and menus
// ABOUTME: Wraps weather content and exposes desktop-style controls

'use client'

import React, { FormEvent, useRef, useState } from 'react'

type MenuName = 'File' | 'View' | 'Location' | 'Tools' | 'Help'

interface QtWindowProps {
  children: React.ReactNode
  compactView: boolean
  isLoading: boolean
  locationLabel: string
  onCompactViewChange: (compactView: boolean) => void
  onLocationSubmit: (query: string) => Promise<void>
  onRefresh: () => Promise<void>
  title: string
  statusLeft: string
  statusRight: string
}

interface Point {
  x: number
  y: number
}

interface DragState {
  pointerId: number
  startPointer: Point
  startOffset: Point
  startRect: DOMRect
}

const MIN_VISIBLE_X = 48
const MIN_TITLEBAR_VISIBLE_Y = 30
const WINDOW_MARGIN = 8
const MENUS: MenuName[] = ['File', 'View', 'Location', 'Tools', 'Help']

function clamp(value: number, min: number, max: number) {
  if (min > max) {
    return value
  }

  return Math.min(Math.max(value, min), max)
}

function constrainOffset(nextOffset: Point, drag: DragState): Point {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  return {
    x: clamp(
      nextOffset.x,
      drag.startOffset.x + MIN_VISIBLE_X - drag.startRect.right,
      drag.startOffset.x + viewportWidth - MIN_VISIBLE_X - drag.startRect.left
    ),
    y: clamp(
      nextOffset.y,
      drag.startOffset.y + WINDOW_MARGIN - drag.startRect.top,
      drag.startOffset.y + viewportHeight - MIN_TITLEBAR_VISIBLE_Y - drag.startRect.top
    ),
  }
}

export function QtWindow({
  children,
  compactView,
  isLoading,
  locationLabel,
  onCompactViewChange,
  onLocationSubmit,
  onRefresh,
  title,
  statusLeft,
  statusRight,
}: QtWindowProps) {
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [activeMenu, setActiveMenu] = useState<MenuName | null>(null)
  const [dialog, setDialog] = useState<'location' | 'about' | null>(null)
  const [locationQuery, setLocationQuery] = useState('')
  const [locationError, setLocationError] = useState<string | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const windowRef = useRef<HTMLElement | null>(null)

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || !windowRef.current) {
      return
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startPointer: { x: event.clientX, y: event.clientY },
      startOffset: offset,
      startRect: windowRef.current.getBoundingClientRect(),
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
    setIsDragging(true)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    const nextOffset = {
      x: drag.startOffset.x + event.clientX - drag.startPointer.x,
      y: drag.startOffset.y + event.clientY - drag.startPointer.y,
    }

    setOffset(constrainOffset(nextOffset, drag))
  }

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current

    if (!drag || drag.pointerId !== event.pointerId) {
      return
    }

    dragRef.current = null
    setIsDragging(false)

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function resetPosition() {
    setOffset({ x: 0, y: 0 })
    setActiveMenu(null)
  }

  function toggleMenu(menu: MenuName) {
    setActiveMenu(currentMenu => currentMenu === menu ? null : menu)
  }

  async function refresh() {
    setActiveMenu(null)
    await onRefresh()
  }

  function openLocationDialog() {
    setLocationQuery('')
    setLocationError(null)
    setDialog('location')
    setActiveMenu(null)
  }

  async function handleLocationSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLocationError(null)

    try {
      await onLocationSubmit(locationQuery)
      setDialog(null)
      setLocationQuery('')
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Location lookup failed')
    }
  }

  function openAboutDialog() {
    setDialog('about')
    setActiveMenu(null)
  }

  function renderMenu(menu: MenuName) {
    if (activeMenu !== menu) {
      return null
    }

    if (menu === 'File') {
      return (
        <div className="qt-menu">
          <button className="qt-menu-item" disabled={isLoading} onClick={refresh} type="button">Refresh</button>
          <button className="qt-menu-item" onClick={resetPosition} type="button">Center Window</button>
        </div>
      )
    }

    if (menu === 'View') {
      return (
        <div className="qt-menu">
          <button
            className="qt-menu-item"
            onClick={() => onCompactViewChange(!compactView)}
            type="button"
          >
            {compactView ? 'Standard View' : 'Compact View'}
          </button>
        </div>
      )
    }

    if (menu === 'Location') {
      return (
        <div className="qt-menu">
          <button className="qt-menu-item" onClick={openLocationDialog} type="button">Change Location...</button>
          <button
            className="qt-menu-item"
            disabled={isLoading}
            onClick={() => {
              setLocationQuery('')
              setDialog('location')
              setActiveMenu(null)
            }}
            type="button"
          >
            Enter ZIP Code...
          </button>
        </div>
      )
    }

    if (menu === 'Tools') {
      return (
        <div className="qt-menu">
          <button className="qt-menu-item" onClick={resetPosition} type="button">Reset Window Position</button>
          <button className="qt-menu-item" disabled={isLoading} onClick={refresh} type="button">Reload Weather Data</button>
        </div>
      )
    }

    return (
      <div className="qt-menu">
        <button className="qt-menu-item" onClick={openAboutDialog} type="button">About Almanac Weather</button>
      </div>
    )
  }

  return (
    <section
      ref={windowRef}
      className={`qt-window max-w-6xl mx-auto ${isDragging ? 'qt-window-dragging' : ''}`}
      style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
    >
      <div
        className="qt-titlebar flex items-center justify-between gap-3 px-2"
        onDoubleClick={resetPosition}
        onPointerCancel={endDrag}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-4 w-4 shrink-0 border border-white/70 bg-[#fdfdf7] shadow-[inset_-1px_-1px_0_rgba(0,0,0,0.28)]" aria-hidden="true" />
          <h1 className="truncate text-sm">{title}</h1>
        </div>
        <div className="flex shrink-0 gap-1" aria-hidden="true">
          <span className="qt-window-control">_</span>
          <span className="qt-window-control">[]</span>
          <span className="qt-window-control">x</span>
        </div>
      </div>

      <div className="qt-menubar flex flex-wrap gap-x-1 gap-y-1 px-1 py-1 text-sm">
        {MENUS.map(menu => (
          <div className="qt-menu-slot" key={menu}>
            <button
              aria-expanded={activeMenu === menu}
              className="qt-menubar-button"
              onClick={() => toggleMenu(menu)}
              type="button"
            >
              {menu}
            </button>
            {renderMenu(menu)}
          </div>
        ))}
      </div>

      <div className="qt-toolbar flex flex-wrap items-center gap-1 px-2 py-2 text-sm">
        <button className="qt-toolbar-button px-3" disabled={isLoading} onClick={refresh} type="button">Refresh</button>
        <button className="qt-toolbar-button px-3" onClick={openLocationDialog} type="button">{locationLabel}</button>
        <button className="qt-toolbar-button px-3" onClick={openAboutDialog} type="button">NOAA</button>
        <div className="ml-auto terminal-dim">{isLoading ? 'Loading' : 'Ready'}</div>
      </div>

      {children}

      <div className="qt-statusbar flex flex-wrap justify-between gap-2 px-2 py-1 text-xs">
        <span>{statusLeft}</span>
        <span>{statusRight}</span>
      </div>

      {dialog === 'location' && (
        <div className="qt-dialog-backdrop" role="presentation">
          <form className="qt-dialog" onSubmit={handleLocationSubmit}>
            <div className="qt-dialog-title">Change Location</div>
            <label className="grid gap-1 text-sm">
              <span>ZIP code or address</span>
              <input
                autoFocus
                className="qt-input"
                onChange={event => setLocationQuery(event.target.value)}
                placeholder="90210 or 1600 Pennsylvania Ave NW"
                value={locationQuery}
              />
            </label>
            {locationError && <div className="qt-error">{locationError}</div>}
            <div className="flex justify-end gap-2">
              <button className="qt-toolbar-button px-3" onClick={() => setDialog(null)} type="button">Cancel</button>
              <button className="qt-toolbar-button px-3" disabled={isLoading} type="submit">Apply</button>
            </div>
          </form>
        </div>
      )}

      {dialog === 'about' && (
        <div className="qt-dialog-backdrop" role="presentation">
          <div className="qt-dialog">
            <div className="qt-dialog-title">About Almanac Weather</div>
            <p className="text-sm">Weather and almanac conditions from public data sources.</p>
            <div className="flex justify-end">
              <button className="qt-toolbar-button px-3" onClick={() => setDialog(null)} type="button">OK</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
