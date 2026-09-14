import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiFetch, ApiError } from './client'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(status: number, body: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }),
  )
}

describe('apiFetch', () => {
  it('un error de la API llega con su estado, no sólo con un texto', async () => {
    // Sin el estado, «no hay recibo en esta dirección» y «la carga ha fallado» son el mismo error,
    // y son justo los dos que el modo recibo tiene que distinguir: la presencia equivocada da 404
    // en dos empleados de mil (`designer#8`).
    stubFetch(404)

    await expect(apiFetch('/payrolls/x/steps')).rejects.toSatisfy(
      (error: unknown) => error instanceof ApiError && error.status === 404,
    )
  })

  it('el mensaje del error sigue diciendo el estado y la ruta', async () => {
    stubFetch(500)

    await expect(apiFetch('/payrolls/x/steps')).rejects.toThrow('API error 500: /payrolls/x/steps')
  })

  it('una respuesta buena devuelve el cuerpo', async () => {
    stubFetch(200, [{ executionOrder: 1 }])

    await expect(apiFetch('/payrolls/x/steps')).resolves.toEqual([{ executionOrder: 1 }])
  })
})
