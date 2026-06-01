'use client'

import { SidebarContent } from './SidebarContent'

export function Sidebar() {
  return (
    <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-[240px] shrink-0 border border-[#1a1a1a] bg-[#111111] lg:flex lg:flex-col">
      <SidebarContent />
    </aside>
  )
}
