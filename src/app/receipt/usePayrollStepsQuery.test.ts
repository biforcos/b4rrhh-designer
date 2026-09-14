import { describe, it, expect } from 'vitest'
import { shouldRetryStepsRequest } from './usePayrollStepsQuery'
import { ApiError } from '../../api/client'

describe('shouldRetryStepsRequest', () => {
  it('no reintenta un 404: esa dirección no va a empezar a existir', () => {
    // Reintentar deja la pantalla en «Cargando el recibo...» varios segundos antes de decir lo
    // único que hay que decir, y lo que hay que decir es que la presencia no es ésa.
    expect(shouldRetryStepsRequest(0, new ApiError(404, '/payrolls'))).toBe(false)
  })

  it('tampoco reintenta un 403: el permiso tampoco cambia solo', () => {
    expect(shouldRetryStepsRequest(0, new ApiError(403, '/payrolls'))).toBe(false)
  })

  it('reintenta un 500, que sí puede ser un momento malo', () => {
    expect(shouldRetryStepsRequest(0, new ApiError(500, '/payrolls'))).toBe(true)
  })

  it('deja de reintentar un 500 después de un par de intentos', () => {
    expect(shouldRetryStepsRequest(2, new ApiError(500, '/payrolls'))).toBe(false)
  })

  it('reintenta lo que no es un error de la API, como una red caída', () => {
    expect(shouldRetryStepsRequest(0, new TypeError('Failed to fetch'))).toBe(true)
  })
})
