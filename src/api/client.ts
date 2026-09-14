import { authStore } from '../auth/authStore'

const BASE_URL = '/api'

/**
 * Un error de la API con su estado a mano.
 *
 * El estado hace falta porque hay dos fallos que se parecen y no son lo mismo: un 404 dice «no
 * hay nada en esta dirección» y cualquier otro dice «no se sabe qué hay». Distinguirlos es lo que
 * permite escribir el motivo en pantalla en vez de un «ha fallado» a secas, y el caso vivo es la
 * presencia de un recibo: `EMP000001` tiene el suyo en la presencia 2, así que suponer 1 acierta
 * en 998 empleados y da 404 en dos (`designer#8`).
 */
export class ApiError extends Error {
  readonly status: number
  readonly path: string

  constructor(status: number, path: string) {
    super(`API error ${status}: ${path}`)
    this.name = 'ApiError'
    this.status = status
    this.path = path
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = authStore.getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) throw new ApiError(res.status, path)
  if (res.status === 204) return undefined as T
  return res.json()
}
