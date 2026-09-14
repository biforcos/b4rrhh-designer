import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './app/layout/AppShell'
import { CanvasPage } from './app/canvas/CanvasPage'
import { ObjectsPage } from './app/objects/ObjectsPage'
import { AssignmentsPage } from './app/assignments/AssignmentsPage'
import { ReceiptCanvasPage } from './app/receipt/ReceiptCanvasPage'
import { startFocusConceptChannel } from './app/receipt/focusConceptChannel'
import { LoginPage } from './auth/LoginPage'
import { RequireAuth } from './auth/RequireAuth'
import { DESIGNER_BASENAME, RECEIPT_ROUTE_PATH } from './routes'
import './index.css'

const queryClient = new QueryClient()

// Antes de renderizar, y a proposito: quien nos embebe puede mandar su «centrate en este concepto»
// en el `load` del marco, y para entonces el efecto de React que lo oiria todavia no ha corrido.
// Los modulos se ejecutan antes de que el `load` se dispare; el efecto, despues.
startFocusConceptChannel()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={DESIGNER_BASENAME}>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            {/*
              El modo recibo cuelga fuera del AppShell: se ve dentro de un marco del backoffice
              (`frontend#66`) y una barra de navegacion dentro de un marco es ruido que lleva a
              sitios que el marco no sabe ensenar.
            */}
            <Route path={RECEIPT_ROUTE_PATH} element={<ReceiptCanvasPage />} />
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/canvas" replace />} />
              <Route path="canvas" element={<CanvasPage />} />
              <Route path="objects" element={<ObjectsPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
