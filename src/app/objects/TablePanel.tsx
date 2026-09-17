import { useEffect, useRef, useState } from 'react'
import { useTableRows } from './useTableRows'
import { type TableRowDto } from './api/tableRowsApi'
import { type PayrollTableDto } from './api/tablesApi'
import { TableRowModal } from './TableRowModal'

interface Props {
  ruleSystemCode: string
  table: PayrollTableDto
  /** La fila con la que se aterrizó, o `null` si se llegó por el menú (`designer#13`). */
  filaSenalada: number | null
}

/**
 * Las filas de una tabla de verdad: las que el motor lee.
 *
 * Es la pantalla de tablas, y es una sola. Quien llega por el salto desde un recibo ve exactamente
 * esto —con su fila delante y señalada— y quien llega por el menú ve exactamente esto. No hay un
 * «modo edición para el recibo»: un modo nuevo sería una segunda forma de editar filas, y dos
 * formas divergen (`designer#13`).
 *
 * Aquí sí se escribe. A diferencia del modo recibo del `designer#8`, no hay nada inhabilitado:
 * editar una regla escribe en la reglamentación de verdad, para todos y al instante, que es lo que
 * hace un administrador de nóminas y es el comportamiento de producto (ADR-067).
 */
export function TablePanel({ ruleSystemCode, table, filaSenalada }: Props) {
  const { data: rows = [], isLoading, isError } = useTableRows(ruleSystemCode, table.tableCode)
  const [modalRow, setModalRow] = useState<TableRowDto | undefined>(undefined)
  const filaRef = useRef<HTMLTableRowElement>(null)

  const senalada = filaSenalada === null ? null : rows.find(row => row.id === filaSenalada) ?? null
  const senaladaNoEsta = filaSenalada !== null && !isLoading && !isError && senalada === null

  // Delante quiere decir a la vista: una tabla de convenio tiene decenas de categorías y señalar
  // una fila que hay que ir a buscar con la rueda es no señalar nada.
  useEffect(() => {
    // `?.()` y no `?.` a secas: jsdom no implementa `scrollIntoView`, y sin la llamada opcional
    // cada test que monte esta pantalla revienta por algo que no es de esta pantalla.
    filaRef.current?.scrollIntoView?.({ block: 'center' })
  }, [filaSenalada, rows.length])

  function formatNum(n: number | null | undefined) {
    if (n === null || n === undefined) return '—'
    return `${new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2 }).format(n)} €`
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-border-default flex-shrink-0">
        <div className="text-sm font-semibold text-text-accent font-mono">{table.tableCode}</div>
        <div className="text-[9px] text-text-tertiary mt-0.5 uppercase tracking-wide">
          {ruleSystemCode} · {table.rowCount} fila{table.rowCount === 1 ? '' : 's'}
          {table.activeRowCount !== table.rowCount && ` · ${table.activeRowCount} activa${table.activeRowCount === 1 ? '' : 's'}`}
        </div>
        {table.bindings.length === 0 ? (
          <div className="text-[10px] text-warning-text mt-1">
            No la lee nadie: existe y ninguna vinculación apunta a ella.
          </div>
        ) : (
          <div className="text-[10px] text-text-tertiary mt-1">
            La leen:{' '}
            {table.bindings.map(b => `${b.ownerCode} · ${b.bindingRoleCode}`).join(' / ')}
          </div>
        )}
      </div>

      {/*
        Una fila borrada entre medias no deja la pantalla en blanco, que es el criterio que más se
        olvida: la tabla sigue estando y se dice que la fila ya no.
      */}
      {senaladaNoEsta && (
        <div className="mx-4 mt-3 p-2.5 rounded-md bg-warning-bg border border-warning-border flex-shrink-0">
          <p className="text-[11px] text-warning-text leading-relaxed">
            La fila a la que venías ya no está en esta tabla. Alguien la ha borrado desde que se
            calculó el recibo. Las demás filas de <span className="font-mono">{table.tableCode}</span>{' '}
            siguen aquí.
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-text-tertiary text-xs">Cargando...</div>
        ) : isError ? (
          <div className="p-4 text-error-text text-xs">No se han podido leer las filas de esta tabla.</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-text-tertiary text-xs">Esta tabla no tiene filas.</div>
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
                <th className="px-2 py-2 text-right">Por hora</th>
                <th className="px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const esLaSenalada = row.id === filaSenalada
                return (
                  <tr
                    key={row.id}
                    ref={esLaSenalada ? filaRef : undefined}
                    data-senalada={esLaSenalada ? 'si' : undefined}
                    className={`border-b border-border-default ${
                      esLaSenalada
                        ? 'bg-surface-accent border-l-2 border-l-accent-primary'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <td className="px-4 py-2 font-mono text-text-primary">
                      {row.searchCode}
                      {esLaSenalada && (
                        <span className="ml-2 text-[9px] text-accent-primary uppercase tracking-wide">
                          la del recibo
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-text-secondary">{row.startDate}</td>
                    <td className="px-2 py-2 text-text-tertiary italic">{row.endDate ?? '—'}</td>
                    <td className="px-2 py-2 text-right font-mono text-text-primary">{formatNum(row.monthlyValue)}</td>
                    <td className="px-2 py-2 text-right font-mono text-text-secondary">{formatNum(row.annualValue)}</td>
                    <td className="px-2 py-2 text-right font-mono text-text-secondary">{formatNum(row.dailyValue)}</td>
                    <td className="px-2 py-2 text-right font-mono text-text-secondary">{formatNum(row.hourlyValue)}</td>
                    <td className="px-2 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setModalRow(row)}
                        className="text-text-tertiary hover:text-text-primary"
                        title={`Editar la fila ${row.searchCode}`}
                        aria-label={`Editar la fila ${row.searchCode}`}
                      >✎</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalRow !== undefined && (
        <TableRowModal
          ruleSystemCode={ruleSystemCode}
          tableCode={table.tableCode}
          row={modalRow}
          onClose={() => setModalRow(undefined)}
        />
      )}
    </div>
  )
}
