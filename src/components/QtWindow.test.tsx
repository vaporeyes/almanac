// ABOUTME: Tests for QtWindow draggable shell behavior, menus, and dialogs
// ABOUTME: Verifies title bar movement, status text, and location submissions

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { fireEvent, render, waitFor, within } from '@testing-library/react'
import { QtWindow } from './QtWindow'

beforeAll(() => {
  HTMLElement.prototype.setPointerCapture = () => {}
  HTMLElement.prototype.releasePointerCapture = () => {}
  HTMLElement.prototype.hasPointerCapture = () => true
})

function renderWindow() {
  const callbacks = {
    onCompactViewChange: vi.fn(),
    onLocationSubmit: vi.fn().mockResolvedValue(undefined),
    onRefresh: vi.fn().mockResolvedValue(undefined),
  }

  return render(
    <QtWindow
      compactView={false}
      isLoading={false}
      locationLabel="Kansas, USA"
      onCompactViewChange={callbacks.onCompactViewChange}
      onLocationSubmit={callbacks.onLocationSubmit}
      onRefresh={callbacks.onRefresh}
      statusLeft="Location: Kansas, USA"
      statusRight="Data: NWS/NOAA"
      title="Farmer's Almanac Weather"
    >
      <div>Window content</div>
    </QtWindow>
  )
}

describe('QtWindow', () => {
  it('should render window chrome and status text', () => {
    const { getByText } = renderWindow()

    expect(getByText("Farmer's Almanac Weather")).toBeTruthy()
    expect(getByText('File')).toBeTruthy()
    expect(getByText('Location: Kansas, USA')).toBeTruthy()
    expect(getByText('Data: NWS/NOAA')).toBeTruthy()
    expect(getByText('Window content')).toBeTruthy()
  })

  it('should move when dragging the title bar and reset on double click', () => {
    const { container, getByText } = renderWindow()
    const windowElement = container.querySelector('.qt-window') as HTMLElement
    const titleBar = getByText("Farmer's Almanac Weather").closest('.qt-titlebar') as HTMLElement

    windowElement.getBoundingClientRect = () => ({
      bottom: 500,
      height: 468,
      left: 64,
      right: 800,
      toJSON: () => {},
      top: 32,
      width: 736,
      x: 64,
      y: 32,
    })

    fireEvent.pointerDown(titleBar, {
      button: 0,
      clientX: 100,
      clientY: 50,
      pointerId: 1,
    })
    fireEvent.pointerMove(titleBar, {
      clientX: 150,
      clientY: 80,
      pointerId: 1,
    })

    expect(windowElement.style.transform).toBe('translate(50px, 30px)')

    fireEvent.doubleClick(titleBar)

    expect(windowElement.style.transform).toBe('translate(0px, 0px)')
  })

  it('should call refresh from the File menu', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { container, getByText } = render(
      <QtWindow
        compactView={false}
        isLoading={false}
        locationLabel="Kansas, USA"
        onCompactViewChange={vi.fn()}
        onLocationSubmit={vi.fn()}
        onRefresh={onRefresh}
        statusLeft="Location: Kansas, USA"
        statusRight="Data: NWS/NOAA"
        title="Farmer's Almanac Weather"
      >
        <div>Window content</div>
      </QtWindow>
    )

    fireEvent.click(getByText('File'))
    const menu = container.querySelector('.qt-menu') as HTMLElement
    fireEvent.click(within(menu).getByText('Refresh'))

    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1))
  })

  it('should submit location changes from the Location menu dialog', async () => {
    const onLocationSubmit = vi.fn().mockResolvedValue(undefined)
    const { getByPlaceholderText, getByText } = render(
      <QtWindow
        compactView={false}
        isLoading={false}
        locationLabel="Kansas, USA"
        onCompactViewChange={vi.fn()}
        onLocationSubmit={onLocationSubmit}
        onRefresh={vi.fn()}
        statusLeft="Location: Kansas, USA"
        statusRight="Data: NWS/NOAA"
        title="Farmer's Almanac Weather"
      >
        <div>Window content</div>
      </QtWindow>
    )

    fireEvent.click(getByText('Location'))
    fireEvent.click(getByText('Change Location...'))
    fireEvent.change(getByPlaceholderText('90210 or 1600 Pennsylvania Ave NW'), {
      target: { value: '90210' },
    })
    fireEvent.click(getByText('Apply'))

    await waitFor(() => expect(onLocationSubmit).toHaveBeenCalledWith('90210'))
  })
})
