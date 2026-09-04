import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTableRows } from './useTableRows'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { TableRowModal } from './TableRowModal'

interface Props {
  ruleSystemCode: string
  tableCode: string
}

export function TableRowPanel({ ruleSystemCode, tableCode }: Props) {
  const qc = useQueryClient()
  const { data: rows = [], isLoading } = useTableRows(ruleSystemCode, tableCode)
  const [modalRow, setModalRow] = useState<TableRowDto | null | 'new' | undefined>(undefined)
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
      <div className="px-4 py-2.5 border-b border-border-default flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-sm font-semibold text-text-accent font-mono">{tableCode}</div>
          <div className="text-[9px] text-text-tertiary mt-0.5 uppercase tracking-wide">{ruleSystemCode} · Tabla salarial</div>
        </div>
        <button
          type="button"
          onClick={() => setModalRow('new')}
          className="text-[10px] px-2.5 py-1 bg-surface-panel border border-border-default text-text-secondary rounded-sm hover:bg-surface-hover hover:text-text-primary"
        >
          + Nueva fila
        </button>
      </div>

      {/* Rows table */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-text-tertiary text-xs">Cargando...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-text-tertiary text-xs">Sin filas — pulsa "+ Nueva fila" para añadir la primera.</div>
        ) : (
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
        )}
      </div>

      {/* Row modal (create / edit) */}
      {modalRow !== undefined && (
        <TableRowModal
          ruleSystemCode={ruleSystemCode}
          tableCode={tableCode}
          row={modalRow === 'new' ? null : modalRow}
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
