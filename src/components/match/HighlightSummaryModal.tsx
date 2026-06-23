'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { Match } from '@/lib/types'

interface HighlightSummaryModalProps {
  match: Match
}

type ModalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; videoUrl: string; title: string | null }
  | { status: 'unavailable' }
  | { status: 'error' }

function buildHighlightsUrl(match: Match): string {
  const params = new URLSearchParams()
  params.set('matchId', match.id)
  params.set('homeTeam', match.homeTeam.name)
  params.set('awayTeam', match.awayTeam.name)
  params.set('startTime', match.startTime)
  params.set('leagueName', match.league.name)
  params.set('leagueCountry', match.league.country)
  return `/api/highlights?${params.toString()}`
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), iframe, [contenteditable="true"]'
  return Array.from(container.querySelectorAll<HTMLElement>(selector))
}

export function HighlightSummaryModal({ match }: HighlightSummaryModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [state, setState] = useState<ModalState>({ status: 'idle' })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreFocusTargetRef = useRef<Element | null>(null)

  const openModal = useCallback(async () => {
    restoreFocusTargetRef.current = triggerRef.current
    setIsOpen(true)
    setState({ status: 'loading' })

    try {
      const response = await fetch(buildHighlightsUrl(match))
      const data = await response.json()

      if (!response.ok) {
        setState({ status: 'error' })
        return
      }

      if (data.videoUrl) {
        setState({ status: 'success', videoUrl: data.videoUrl, title: data.title ?? null })
      } else {
        setState({ status: 'unavailable' })
      }
    } catch {
      setState({ status: 'error' })
    }
  }, [match])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setState({ status: 'idle' })
  }, [])

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus()
      return
    }

    const target = restoreFocusTargetRef.current
    if (target instanceof HTMLElement) {
      target.focus()
    }
    restoreFocusTargetRef.current = null
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeModal()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeModal])

  const handleDialogKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !dialogRef.current) return

    const focusables = getFocusableElements(dialogRef.current)
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        className="flex w-full items-center justify-between rounded-lg border border-[#262626] bg-[#101010] px-4 py-3 text-left transition-colors hover:border-[#404040] hover:bg-[#1a1a1a]"
        aria-label="Ver resumen del partido"
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white">Ver resumen del partido</span>
          <span className="text-xs text-[#666]">Highlights en video</span>
        </div>
        <span className="text-[#a1a1a1]">▶</span>
      </button>

      {isOpen && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Resumen del partido"
          onClick={closeModal}
          onKeyDown={handleDialogKeyDown}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-xl border border-[#262626] bg-[#141414] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#262626] px-6 py-4">
              <h3 className="text-base font-semibold text-white">Resumen del partido</h3>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeModal}
                className="text-[#a1a1a1] transition-colors hover:text-white"
                aria-label="Cerrar resumen"
              >
                ✕
              </button>
            </div>

            <div className="flex aspect-video items-center justify-center bg-black p-6">
              {state.status === 'loading' && (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-[#22c55e]" />
                  <span className="text-sm text-[#a1a1a1]">Buscando resumen...</span>
                </div>
              )}

              {state.status === 'success' && (
                <iframe
                  src={state.videoUrl}
                  title="Resumen del partido"
                  className="h-full w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}

              {state.status === 'unavailable' && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-2xl">🎬</span>
                  <span className="text-sm font-medium text-white">Resumen no disponible</span>
                  <span className="text-xs text-[#666]">No encontramos un video para este partido.</span>
                </div>
              )}

              {state.status === 'error' && (
                <div className="flex flex-col items-center gap-2 text-center">
                  <span className="text-2xl">⚠</span>
                  <span className="text-sm font-medium text-white">No se pudo cargar el resumen</span>
                  <span className="text-xs text-[#666]">Inténtalo de nuevo más tarde.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
