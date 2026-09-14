import { useQuery } from '@tanstack/react-query'
import { payrollStepsApi } from './api/payrollStepsApi'
import type { PayrollAddress } from './payrollAddress'
import { ApiError } from '../../api/client'

const MAX_RETRIES = 2

/**
 * Qué merece un segundo intento y qué no.
 *
 * Un 404 no: esa dirección no va a empezar a existir, y reintentarlo deja la pantalla diciendo
 * «cargando» varios segundos antes de poder decir lo único que hace falta —que la presencia no es
 * ésa—. Un 500 o una red caída sí, que pueden ser un momento malo.
 */
export function shouldRetryStepsRequest(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
  return failureCount < MAX_RETRIES
}

/**
 * Los pasos de un recibo.
 *
 * La clave de caché lleva las seis partes de la dirección, la presencia incluida: dos recibos del
 * mismo empleado y periodo se distinguen por ella y sólo por ella.
 */
export function usePayrollStepsQuery(address: PayrollAddress | null) {
  return useQuery({
    queryKey: [
      'payroll-steps',
      address?.ruleSystemCode,
      address?.employeeTypeCode,
      address?.employeeNumber,
      address?.payrollPeriodCode,
      address?.payrollTypeCode,
      address?.presenceNumber,
    ],
    queryFn: () => payrollStepsApi.listSteps(address!),
    enabled: address !== null,
    retry: shouldRetryStepsRequest,
  })
}
