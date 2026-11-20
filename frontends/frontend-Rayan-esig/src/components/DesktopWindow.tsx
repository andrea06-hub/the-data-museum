import {
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react'
import { Maximize2, Minimize2, Minus, Plus, X } from 'lucide-react'

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

export interface WindowRect {
  x: number
  y: number
  width: number
  height: number
}

interface DesktopWindowProps {
  title: string
  subtitle?: string
  rect: WindowRect
  zIndex: number
  isFocused: boolean
  isMaximized: boolean
  isMinimized: boolean
  minWidth?: number
  minHeight?: number
  onFocus: () => void
  onClose: () => void
  onMinimize: () => void
  onToggleMaximize: () => void
  onChangeRect: (rect: WindowRect) => void
  children: ReactNode
}

const TOP_BAR_OFFSET = 32
const BOTTOM_DOCK_OFFSET = 76

export function clampRectToViewport(
  rect: WindowRect,
  minWidth = 380,
  minHeight = 280,
): WindowRect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  const maxWidth = Math.max(minWidth, vw - 16)
  const maxHeight = Math.max(minHeight, vh - TOP_BAR_OFFSET - BOTTOM_DOCK_OFFSET)

  const width = Math.min(maxWidth, Math.max(minWidth, rect.width))
  const height = Math.min(maxHeight, Math.max(minHeight, rect.height))

  const x = Math.min(Math.max(8, rect.x), Math.max(8, vw - width - 8))
  const y = Math.min(
    Math.max(8, rect.y),
    Math.max(8, vh - TOP_BAR_OFFSET - BOTTOM_DOCK_OFFSET - 44),
  )

  return { x, y, width, height }
}

export function DesktopWindow({
  title,
  subtitle,
  rect,
  zIndex,
  isFocused,
  isMaximized,
  isMinimized,
  minWidth = 380,
  minHeight = 280,
  onFocus,
  onClose,
  onMinimize,
  onToggleMaximize,
  onChangeRect,
  children,
}: DesktopWindowProps) {
  const gestureRef = useRef<{
    mode: 'drag' | 'resize'
    dir?: ResizeDir
    startX: number
    startY: number
    startRect: WindowRect
  } | null>(null)

  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleTitlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || isMaximized) return
    if ((e.target as HTMLElement).closest('button')) return

    e.preventDefault()
    onFocus()
    e.currentTarget.setPointerCapture(e.pointerId)

    gestureRef.current = {
      mode: 'drag',
      startX: e.clientX,
      startY: e.clientY,
      startRect: rect,
    }
  }

  const handleResizePointerDown = (
    e: ReactPointerEvent<HTMLDivElement>,
    dir: ResizeDir,
  ) => {
    if (e.button !== 0 || isMaximized) return

    e.preventDefault()
    e.stopPropagation()
    onFocus()
    e.currentTarget.setPointerCapture(e.pointerId)

    gestureRef.current = {
      mode: 'resize',
      dir,
      startX: e.clientX,
      startY: e.clientY,
      startRect: rect,
    }
  }

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gestureRef.current
    if (!g) return

    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    const { startRect } = g

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      if (g.mode === 'drag') {
        onChangeRect(
          clampRectToViewport(
            {
              ...startRect,
              x: startRect.x + dx,
              y: startRect.y + dy,
            },
            minWidth,
            minHeight,
          ),
        )
        return
      }

      if (g.mode === 'resize' && g.dir) {
        let { x, y, width, height } = startRect
        const dir = g.dir
        const vw = window.innerWidth
        const maxBottom = window.innerHeight - TOP_BAR_OFFSET - 12

        if (dir.includes('e')) {
          width = Math.min(vw - x - 8, Math.max(minWidth, startRect.width + dx))
        }
        if (dir.includes('s')) {
          height = Math.min(maxBottom - y, Math.max(minHeight, startRect.height + dy))
        }
        if (dir.includes('w')) {
          const maxShift = startRect.width - minWidth
          const clampedDx = Math.min(maxShift, Math.max(8 - startRect.x, dx))
          x = startRect.x + clampedDx
          width = startRect.width - clampedDx
        }
        if (dir.includes('n')) {
          const maxShift = startRect.height - minHeight
          const clampedDy = Math.min(maxShift, Math.max(8 - startRect.y, dy))
          y = startRect.y + clampedDy
          height = startRect.height - clampedDy
        }

        onChangeRect({ x, y, width, height })
      }
    })
  }

  const handlePointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    gestureRef.current = null
  }

  if (isMinimized) return null

  return (
    <section
      onPointerDown={onFocus}
      style={
        isMaximized
          ? { zIndex }
          : {
              zIndex,
              left: `${rect.x}px`,
              top: `${rect.y}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            }
      }
      className={`animate-window-open flex flex-col overflow-hidden border border-black/[0.09] bg-white/95 backdrop-blur-2xl ${
        isFocused
          ? 'shadow-[0_26px_65px_rgba(0,0,0,0.22)] ring-1 ring-black/[0.08]'
          : 'shadow-[0_14px_34px_rgba(0,0,0,0.12)] opacity-[0.97]'
      } ${
        isMaximized
          ? 'fixed inset-x-3 top-10 bottom-20 rounded-2xl transition-all duration-200'
          : 'absolute rounded-3xl'
      }`}
    >
      {/* 8 poignées de redimensionnement */}
      {!isMaximized && (
        <>
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'n')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute inset-x-4 top-0 z-20 h-2 cursor-ns-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute inset-x-4 bottom-0 z-20 h-2 cursor-ns-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'w')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute inset-y-4 left-0 z-20 w-2 cursor-ew-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute inset-y-4 right-0 z-20 w-2 cursor-ew-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute left-0 top-0 z-30 h-4 w-4 cursor-nwse-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute right-0 top-0 z-30 h-4 w-4 cursor-nesw-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="absolute bottom-0 left-0 z-30 h-4 w-4 cursor-nesw-resize touch-none"
          />
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            className="group absolute bottom-0 right-0 z-30 flex h-5 w-5 cursor-nwse-resize touch-none items-end justify-end p-1.5"
          >
            <span className="h-2.5 w-2.5 rounded-br-xs border-b-2 border-r-2 border-black/25 transition group-hover:border-[#0071e3]" />
          </div>
        </>
      )}

      {/* Barre de titre macOS déplaçable */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onDoubleClick={onToggleMaximize}
        className={`flex h-11 shrink-0 select-none items-center justify-between border-b border-black/[0.06] bg-[#f5f5f7]/90 px-4 touch-none ${
          isMaximized ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="group/lights flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            aria-label="Fermer"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] text-black/70 ring-1 ring-black/10 transition hover:brightness-95"
          >
            <X className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/lights:opacity-100" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onMinimize()
            }}
            aria-label="Réduire"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#febc2e] text-black/70 ring-1 ring-black/10 transition hover:brightness-95"
          >
            <Minus className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/lights:opacity-100" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggleMaximize()
            }}
            aria-label="Agrandir"
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#28c840] text-black/70 ring-1 ring-black/10 transition hover:brightness-95"
          >
            <Plus className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover/lights:opacity-100" />
          </button>
        </div>

        <div className="pointer-events-none flex items-center gap-2 text-xs font-semibold text-[#1d1d1f]">
          <span>{title}</span>
          {subtitle && (
            <span className="hidden font-normal text-[#86868b] sm:inline">— {subtitle}</span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleMaximize}
          aria-label="Plein écran"
          className="rounded-md p-1 text-[#86868b] transition hover:bg-black/5 hover:text-[#1d1d1f]"
        >
          {isMaximized ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Contenu scrollable de la fenêtre */}
      <div className="flex-1 overflow-y-auto bg-[#f5f5f7]/60 p-6 sm:p-8">{children}</div>
    </section>
  )
}
