import { apiFetch } from '../../../api/client'
import type { components } from '../../../api/schema'

/**
 * El catálogo de objetos, con el tipo que sale del contrato y no escrito al lado.
 *
 * Éste es el primero, y es el que destapó el asunto (`designer#11`): la ruta estaba servida, no
 * estaba en el contrato, y aquí se llamaba igual — con la ruta a mano y el tipo a mano. Los dos
 * candados del repositorio eran ciertos y no protegían nada de esto, porque la cadena que vigilan
 * terminaba en un `schema.d.ts` que no importaba ningún fichero de `src`. Éste lo importa.
 *
 * Los demás `api/` se irán trayendo por el mismo camino según se toquen. Lo que impide que
 * aparezca una llamada nueva fuera del contrato mientras tanto es `lint:api-paths`.
 */
export type PayrollObjectDto = components['schemas']['PayrollObjectResponse']

/** Lo que el contrato admite en `?type=`. Un valor de más aquí ya no compila. */
export type PayrollObjectTypeCode = PayrollObjectDto['objectTypeCode']

export const objectsApi = {
  list: (ruleSystemCode: string, type: Exclude<PayrollObjectTypeCode, 'CONCEPT'>) =>
    apiFetch<PayrollObjectDto[]>(`/payroll-engine/${ruleSystemCode}/objects?type=${type}`),
}
