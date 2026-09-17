import { apiFetch } from '../../../api/client'

/** Quien lee una tabla, y bajo qué rol. Vacío significa que no la lee nadie. */
export interface TableBindingDto {
  ownerTypeCode: string
  ownerCode: string
  bindingRoleCode: string
  active: boolean
}

/**
 * Una tabla de verdad: la que tiene las filas con los importes.
 *
 * No confundir con una ranura. Una ranura —`P02_DAILY_AMOUNT_TABLE`— es un rol de vinculación, y
 * el motor la resuelve por convenio hasta la tabla que sí guarda los valores
 * (`P02_99002405011982`). De los tres roles vinculados en ESP hoy sólo uno existe además como
 * objeto, así que preguntarle al catálogo de objetos por «las tablas» contesta una de tres, y la
 * que contesta es una ranura (ADR-063, `b4rrhh/backend#95`).
 *
 * `rowCount` y `activeRowCount` vienen juntos porque una tabla con todas sus filas desactivadas
 * tiene filas y no alimenta nada, y eso no es lo mismo que una tabla vacía.
 */
export interface PayrollTableDto {
  ruleSystemCode: string
  tableCode: string
  rowCount: number
  activeRowCount: number
  bindings: TableBindingDto[]
}

export const tablesApi = {
  list: (ruleSystemCode: string) =>
    apiFetch<PayrollTableDto[]>(`/payroll-engine/${ruleSystemCode}/tables`),
}
