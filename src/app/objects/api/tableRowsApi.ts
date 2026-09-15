import { apiFetch } from '../../../api/client'

export interface TableRowDto {
  id: number
  searchCode: string
  startDate: string
  endDate: string | null
  monthlyValue: number
  annualValue: number
  dailyValue: number
  hourlyValue: number
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

export interface UpdateTableRowBody {
  searchCode?: string
  startDate?: string
  endDate?: string | null
  monthlyValue?: number
  annualValue?: number
  dailyValue?: number
  hourlyValue?: number
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
