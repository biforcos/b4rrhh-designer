import { Outlet } from 'react-router-dom'
import { NavSidebar } from './NavSidebar'
import { MigaDeVuelta } from './MigaDeVuelta'

export function AppShell() {
  return (
    <div className="flex h-screen bg-surface-app text-text-primary overflow-hidden">
      <NavSidebar />
      {/*
        La miga va aqui y no dentro de la pantalla de tablas a proposito (`designer#13`): el
        recibo de origen no es de esa pantalla, es de la visita. Quien llego por el salto puede
        irse al Canvas y el camino de vuelta sigue estando.
      */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <MigaDeVuelta />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
