import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTableRows } from './useTableRows'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { TableRowModal } from './TableRowModal'

interface Props {
  ruleSystemCode: string
  tableCode: string
}

/**
 * El panel de una ranura.
 *
 * Lo que la lista de al lado devuelve no son tablas: son `payroll_object` de tipo
 * TABLE, y el motor usa su codigo como *rol de vinculacion* para buscar, por
 * convenio, que tabla de verdad le toca (`PayrollConceptGraphCalculatorService`
 * -> `payroll.payroll_object_binding`). Las filas —1.850 / 1.425 / 1.200 €— viven
 * en esa otra tabla (`SB_…`, `PC_…`, `P02_…`), no aqui.
 *
 * Hasta el `b4rrhh/designer#10` esto tenia un «+ Nueva fila» encima del hueco:
 * la fila se guardaba con `table_code` = el codigo de la ranura, la pantalla la
 * pintaba y el motor no la leia jamas. El boton no esta.
 *
 * Listar las tablas de verdad necesita un endpoint que no existe: `b4rrhh/backend#95`.
 */
export function TableRowPanel({ ruleSystemCode, tableCode }: Props) {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useTableRows(ruleSystemCode, tableCode)
  const [modalRow, setModalRow] = useState<TableRowDto | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<TableRowDto | null>(null)

  const deleteMutation = useMutation({
    mutationFn: (rowId: number) => tableRowsApi.deleteRow(ruleSystemCode, tableCode, rowId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['table-rows', ruleSystemCode, tableCode] })
      setDeleteTarget(null)
    },
  })

  function formatNum(n: number) {
    return new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(n)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border-default flex-shrink-0">
        <div className="text-sm font-semibold text-text-accent font-mono">{tableCode}</div>
        <div className="text-[9px] text-text-tertiary mt-0.5 uppercase tracking-wide">
          {ruleSystemCode} · Ranura de vinculación
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Por que no hay filas que tocar aqui */}
        <div className="m-4 p-3 rounded-md bg-info-bg border border-info-border">
          <p className="text-xs text-text-primary font-medium mb-1.5">
            Esto es una ranura, no una tabla.
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            El motor usa <span className="font-mono text-text-accent">{tableCode}</span> como llave
            para buscar, por convenio, qué tabla de verdad le toca. Los importes viven en esa otra
            tabla —<span className="font-mono">SB_…</span>, <span className="font-mono">PC_…</span>,{' '}
            <span className="font-mono">P02_…</span>—, no aquí.
          </p>
          <p className="text-[11px] text-text-secondary leading-relaxed mt-2">
            Por eso no se pueden añadir filas desde esta pantalla: una fila guardada con el código
            de la ranura se vería aquí y <strong>el motor no la leería jamás</strong>.
          </p>
          <p className="text-[10px] text-text-tertiary leading-relaxed mt-2">
            Ver y tocar las tablas de verdad necesita un endpoint que todavía no existe
            (<span className="font-mono">b4rrhh/backend#95</span>). La ranura, como nodo, sigue en
            el Canvas, que es su sitio.
          </p>
        </div>

        {/* Filas escritas contra el codigo de la ranura: huerfanas por construccion */}
        {isLoading ? (
          <div className="px-4 pb-4 text-text-tertiary text-xs">Cargando...</div>
        ) : rows.length === 0 ? null : (
          <>
            <div className="mx-4 mb-2 p-2.5 rounded-md bg-warning-bg border border-warning-border">
              <p className="text-[11px] text-warning-text leading-relaxed">
                Hay {rows.length} fila{rows.length === 1 ? '' : 's'} guardada
                {rows.length === 1 ? '' : 's'} con el código de la ranura. El motor no las lee.
                Se listan para poder borrarlas.
              </p>
            </div>
            <table className="w-full text-xs text-text-primary border-collapse">
              <thead>
                <tr className="text-text-tertiary text-left border-b border-border-strong text-[9px] uppercase tracking-wide">
                  <th className="px-4 py-2">Código búsqueda</th>
                  <th className="px-2 py-2">Desde</th>
                  <th className="px-2 py-2">Hasta</th>
                  <th className="px-2 py-2 text-right">Mensual</th>
                  <th className="px-2 py-2 text-right">Anual</th>
                  <th className="px-2 py-2 text-right">Diario</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.id} className="border-b border-border-default hover:bg-surface-hover">
                    <td className="px-4 py-2 font-mono text-text-primary">{row.searchCode}</td>
                    <td className="px-2 py-2 text-text-secondary">{row.startDate}</td>
                    <td className="px-2 py-2 text-text-tertiary italic">{row.endDate ?? '—'}</td>
                    <td className="px-2 py-2 text-right font-mono text-text-primary">{formatNum(row.monthlyValue)} €</td>
                    <td className="px-2 py-2 text-right font-mono text-text-secondary">{formatNum(row.annualValue)} €</td>
                    <td className="px-2 py-2 text-right font-mono text-text-secondary">{formatNum(row.dailyValue)} €</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setModalRow(row)}
                        className="text-text-tertiary hover:text-text-primary mr-3"
                        title="Editar"
                      >✎</button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="text-text-tertiary hover:text-error-text"
                        title="Eliminar"
                      >🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Row modal (solo edicion: crear aqui escribiria donde nadie lee) */}
      {modalRow !== undefined && (
        <TableRowModal
          ruleSystemCode={ruleSystemCode}
          tableCode={tableCode}
          row={modalRow}
          onClose={() => setModalRow(undefined)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-surface-overlay" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-surface-panel border border-border-default rounded-lg p-4 shadow-(--shadow-panel)">
            <p className="text-text-primary text-sm font-medium mb-1">¿Eliminar fila?</p>
            <p className="text-text-tertiary text-xs font-mono mb-4">{deleteTarget.searchCode} · {deleteTarget.startDate}</p>
            {deleteMutation.isError && (
              <p className="text-error-text text-[9px] mb-2">Error al eliminar la fila</p>
            )}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)}
                className="text-xs px-3 py-1.5 border border-border-default text-text-secondary rounded-md hover:bg-surface-hover">
                Cancelar
              </button>
              <button type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="text-xs px-3 py-1.5 bg-error-bg border border-error-border text-error-text rounded-md hover:border-error-text disabled:opacity-50">
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
