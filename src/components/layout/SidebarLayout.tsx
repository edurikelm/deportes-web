'use client'

import { useState, Suspense } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { Drawer } from './Drawer'

type SidebarLayoutProps = {
  children: React.ReactNode
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <>
      <Header
        leftSlot={
          <Drawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onToggle={() => setIsDrawerOpen((prev) => !prev)}
          />
        }
      />
      <Suspense fallback={null}>
        <main className="min-h-screen bg-[#0a0a0a] px-4 pb-20 pt-16 md:pb-6">
          <div className="mx-auto flex w-full max-w-[1320px] gap-4">
            <Sidebar />
            <div className="min-w-0 flex-1">{children}</div>
          </div>
        </main>
      </Suspense>
    </>
  )
}
