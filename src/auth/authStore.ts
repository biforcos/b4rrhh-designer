/**
 * La sesion del designer es la MISMA que la del backoffice.
 *
 * Los dos se sirven del mismo origen —el backoffice en `/`, el designer en
 * `/designer/`—, asi que comparten `localStorage`. Guardando bajo la misma clave y
 * con la misma forma, entrar por el menu del backoffice te deja dentro sin un
 * segundo login, que es lo que mata la sensacion de estar en la misma aplicacion.
 *
 * La clave y la forma las manda el backoffice (`core/auth/auth.store.ts`): un JSON
 * con `token`, `subject` y `expiresAt`. Si algun dia cambia alli, cambia aqui.
 *
 * En otro dominio esto no funcionaria: `localStorage` es por origen. Es la razon
 * tecnica de que el designer cuelgue de una ruta y no de un subdominio.
 */
const SESSION_KEY = 'b4rrhh.auth.session'

export interface AuthSession {
  token: string
  subject: string
  expiresAt: string
}

function read(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (
      typeof parsed.token !== 'string' ||
      typeof parsed.subject !== 'string' ||
      typeof parsed.expiresAt !== 'string'
    ) {
      return null
    }
    return { token: parsed.token, subject: parsed.subject, expiresAt: parsed.expiresAt }
  } catch {
    // Un localStorage no disponible (navegacion privada, permisos) o un JSON roto
    // dejan la sesion en nada, no revientan la aplicacion.
    return null
  }
}

export const authStore = {
  save(session: AuthSession) {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    } catch {
      // Sin persistencia se sigue pudiendo trabajar hasta recargar.
    }
  },

  clear() {
    try {
      localStorage.removeItem(SESSION_KEY)
    } catch {
      // Nada que limpiar si no habia donde guardar.
    }
  },

  getToken(): string | null {
    return read()?.token ?? null
  },

  getSubject(): string | null {
    return read()?.subject ?? null
  },

  isAuthenticated(): boolean {
    const session = read()
    return session !== null && new Date(session.expiresAt) > new Date()
  },
}
