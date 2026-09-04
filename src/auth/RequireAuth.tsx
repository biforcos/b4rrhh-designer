import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { authStore } from './authStore'
import { BACKOFFICE_LOGIN } from '../routes'

export function RequireAuth() {
  const authenticated = authStore.isAuthenticated()

  // Sin sesion se sale al login del backoffice, que es una ruta de fuera de este
  // router: un <Navigate to="/login"> acabaria en /designer/login por el basename.
  useEffect(() => {
    if (!authenticated) window.location.replace(BACKOFFICE_LOGIN)
  }, [authenticated])

  return authenticated ? <Outlet /> : null
}
