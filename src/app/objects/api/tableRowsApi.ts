import { apiFetch } from '../../../api/client'

/**
 * Una fila de tabla.
 *
 * Los cuatro importes son **nulables**, y no por descuido del contrato: una fila de precio dia
 * lleva el diario y nada mas, y una de salario base el mensual y el anual. Aqui estaban declarados
 * como `number` a secas y esa mentira solo se notaba al abrirlas, porque las unicas filas que esta
 * pantalla habia visto eran las huerfanas de una ranura, fabricadas con los cuatro (`designer#13`).
 */
export interface TableRowDto {
  id: number
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number | null
  annualValue: number | null
  dailyValue: number | null
  hourlyValue: number | null
  active: boolean
}

export interface CreateTableRowBody {
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number
  annualValue: number
  dailyValue: number
  hourlyValue: number
}

/** Actualizacion parcial: lo que va nulo se queda como estaba, no se borra. */
export interface UpdateTableRowBody {
  searchCode?: string
  startDate?: string
  endDate?: string | null
  monthlyValue?: number | null
  annualValue?: number | null
  dailyValue?: number | null
  hourlyValue?: number | null
  active?: boolean
}

export const tableRowsApi = {
  // Crea una RANURA -un rol de vinculacion-, no una tabla. Se llamaba createTable y colgaba de
  // /tables, que es la lista de tablas de verdad: parecian el par obvio sin serlo, porque lo que
  // esto crea no sale en aquella lista hasta que una vinculacion por convenio le ata una tabla con
  // filas. El contrato lo dice ya con ese nombre desde el `b4rrhh/backend#98`.
  createBindingRole: (ruleSystemCode: string, bindingRoleCode: string) =>
    apiFetch<{ ruleSystemCode: string; bindingRoleCode: string }>(
      `/payroll-engine/${ruleSystemCode}/binding-roles`,
      { method: 'POST', body: JSON.stringify({ bindingRoleCode }) }
    ),

  listRows: (ruleSystemCode: string, tableCode: string) =>
    apiFetch<TableRowDto[]>(`/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows`),

  // Sin llamantes desde el `b4rrhh/designer#10`: la unica pantalla que daba filas de alta era la
  // de una ranura, y ahi el motor no las leeria nunca. El endpoint existe y es correcto; lo que
  // falta es una pantalla de tablas de verdad que lo use (`b4rrhh/backend#95`).
  createRow: (ruleSystemCode: string, tableCode: string, body: CreateTableRowBody) =>
    apiFetch<TableRowDto>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows`,
      { method: 'POST', body: JSON.stringify(body) }
    ),

  updateRow: (ruleSystemCode: string, tableCode: string, rowId: number, body: UpdateTableRowBody) =>
    apiFetch<TableRowDto>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows/${rowId}`,
      { method: 'PUT', body: JSON.stringify(body) }
    ),

  deleteRow: (ruleSystemCode: string, tableCode: string, rowId: number) =>
    apiFetch<void>(
      `/payroll-engine/${ruleSystemCode}/tables/${tableCode}/rows/${rowId}`,
      { method: 'DELETE' }
    ),
}
