'use client'

import { useEffect, Suspense } from 'react'
import { Menu, X } from 'lucide-react'
import { SidebarContent } from './SidebarContent'

type DrawerProps = {
  isOpen: boolean
  onClose: () => void
  onToggle?: () => void
}

export function Drawer({ isOpen, onClose, onToggle }: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      <button
        data-testid="hamburger-button"
        onClick={onToggle ?? onClose}
        className="flex items-center justify-center lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5 text-[#a1a1a1]" />
      </button>

      {isOpen && (
        <div
          data-testid="drawer-overlay"
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onClose}
        />
      )}

      <div
        data-testid="drawer-panel"
        aria-hidden={!isOpen}
        className={`fixed left-0 top-0 z-50 h-full w-[280px] bg-[#111111] transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
      >
        <button
          data-testid="drawer-close-button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-md text-[#a1a1a1] hover:bg-[#1a1a1a] hover:text-white"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <Suspense fallback={null}><SidebarContent onNavigate={onClose} /></Suspense>
      </div>
    </>
  )
}
