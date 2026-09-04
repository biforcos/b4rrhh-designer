import { Outlet } from 'react-router-dom'
import { NavSidebar } from './NavSidebar'

export function AppShell() {
  return (
    <div className="flex h-screen bg-surface-app text-text-primary overflow-hidden">
      <NavSidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
