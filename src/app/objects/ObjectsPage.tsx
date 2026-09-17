import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { objectsApi, type PayrollObjectDto } from './api/objectsApi'
import { tablesApi } from './api/tablesApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { useReciboDeOrigen } from '../../reciboDeOrigenStore'
import { TableRowPanel } from './TableRowPanel'
import { TablePanel } from './TablePanel'
import { CreateTableModal } from './CreateTableModal'
import { leerAterrizaje, leerReciboDeOrigen } from './aterrizajeEnFila'

type Tab = 'CONSTANT' | 'TABLE' | 'REAL_TABLE'

const TAB_LABELS: Record<Tab, string> = {
  CONSTANT: 'Constantes',
  TABLE: 'Ranuras',
  REAL_TABLE: 'Tablas',
}

/**
 * Las pestañas son tres y las tres dicen lo que son.
 *
 * `Ranuras` lista `payroll_object` de tipo TABLE, y eso no son tablas: son *ranuras*. El motor usa
 * su código como rol de vinculación para resolver, por convenio, qué tabla de verdad le toca
 * (`payroll.payroll_object_binding`). Se llaman ranuras desde el `b4rrhh/designer#10`, porque
 * llamarlas «Tablas» hacía creer que los importes del recibo estaban ahí dentro.
 *
 * `Tablas` lista las tablas de verdad —las que tienen las filas con los importes— y es la pantalla
 * a la que se aterriza desde un recibo (`designer#13`). Antes no existía: hasta el
 * `b4rrhh/backend#95` no había endpoint que las listara, y por eso el panel de una ranura remitía a
 * aquel issue. Ya lo hay.
 */
export function ObjectsPage() {
  const { ruleSystemCode, setRuleSystemCode } = useRuleSystemStore()
  const { recordar } = useReciboDeOrigen()
  const [searchParams] = useSearchParams()

  // El aterrizaje se lee una vez, al montar: a partir de ahí manda lo que el visitante pinche.
  // Volver a aplicarlo en cada render le arrancaría la selección de las manos.
  const [aterrizaje] = useState(() => leerAterrizaje(searchParams))
  const [reciboDeOrigen] = useState(() => leerReciboDeOrigen(searchParams))

  useEffect(() => {
    if (!reciboDeOrigen) return
    recordar(reciboDeOrigen)
    // La tabla es del sistema de reglas del recibo del que se vino. Sin esto, aterrizar con otro
    // seleccionado abriría la pantalla correcta sobre el catálogo equivocado.
    setRuleSystemCode(reciboDeOrigen.ruleSystemCode)
    // Sólo al montar: si el visitante cambia de sistema de reglas después, manda él.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [tab, setTab] = useState<Tab>(aterrizaje ? 'REAL_TABLE' : 'CONSTANT')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [selectedTable, setSelectedTable] = useState<string | null>(aterrizaje?.tableCode ?? null)
  const [filaSenalada, setFilaSenalada] = useState<number | null>(aterrizaje?.rowId ?? null)
  const [createTableOpen, setCreateTableOpen] = useState(false)

  const { data: objects = [], isLoading: objectsLoading } = useQuery({
    queryKey: ['objects', ruleSystemCode, tab],
    queryFn: () => objectsApi.list(ruleSystemCode, tab as 'CONSTANT' | 'TABLE'),
    enabled: tab !== 'REAL_TABLE',
  })

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['tables', ruleSystemCode],
    queryFn: () => tablesApi.list(ruleSystemCode),
    enabled: tab === 'REAL_TABLE',
  })

  const isLoading = tab === 'REAL_TABLE' ? tablesLoading : objectsLoading
  const table = tables.find(t => t.tableCode === selectedTable) ?? null

  function handleTabChange(t: Tab) {
    setTab(t)
    setSelectedSlot(null)
  }

  function handleObjectClick(obj: PayrollObjectDto) {
    if (tab === 'TABLE') {
      setSelectedSlot(prev => (prev === obj.objectCode ? null : obj.objectCode))
    }
  }

  function handleTableClick(tableCode: string) {
    setSelectedTable(prev => (prev === tableCode ? null : tableCode))
    // La fila señalada es la del aterrizaje y sólo de ella: elegir otra tabla a mano deja de ser
    // «la del recibo».
    if (tableCode !== aterrizaje?.tableCode) setFilaSenalada(null)
    else setFilaSenalada(aterrizaje?.rowId ?? null)
  }

  return (
    <div className="flex h-full">
      {/* Left: object list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border-default">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
          <div className="flex gap-1">
            {(['CONSTANT', 'TABLE', 'REAL_TABLE'] as Tab[]).map(t => (
              <button
                type="button"
                key={t}
                onClick={() => handleTabChange(t)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  tab === t
                    ? 'bg-surface-accent border-accent-border text-accent-primary'
                    : 'bg-surface-panel border-border-default text-text-secondary hover:text-text-primary'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
          {tab === 'TABLE' && (
            <button
              type="button"
              onClick={() => setCreateTableOpen(true)}
              className="text-[10px] px-2 py-1 bg-surface-panel border border-border-default text-text-secondary rounded-sm hover:bg-surface-hover hover:text-text-primary"
            >
              + Nueva ranura
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-text-tertiary text-xs">Cargando...</div>
          ) : tab === 'REAL_TABLE' ? (
            <table className="w-full text-xs text-text-primary border-collapse">
              <thead>
                <tr className="text-text-tertiary text-left border-b border-border-strong">
                  <th className="px-4 py-2">Tabla</th>
                  <th className="px-2 py-2 text-right">Filas</th>
                </tr>
              </thead>
              <tbody>
                {tables.map(t => (
                  <tr
                    key={t.tableCode}
                    onClick={() => handleTableClick(t.tableCode)}
                    className={`border-b border-border-default cursor-pointer transition-colors ${
                      selectedTable === t.tableCode ? 'bg-surface-accent' : 'hover:bg-surface-hover'
                    }`}
                  >
                    <td className="px-4 py-2 font-mono">{t.tableCode}</td>
                    <td className="px-2 py-2 text-right text-text-secondary">{t.rowCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-xs text-text-primary border-collapse">
              <thead>
                <tr className="text-text-tertiary text-left border-b border-border-strong">
                  <th className="px-4 py-2">Código</th>
                  <th className="px-2 py-2">Activo</th>
                </tr>
              </thead>
              <tbody>
                {objects.map(obj => (
                  <tr
                    key={obj.objectCode}
                    onClick={() => handleObjectClick(obj)}
                    className={`border-b border-border-default transition-colors ${
                      tab === 'TABLE'
                        ? selectedSlot === obj.objectCode
                          ? 'bg-surface-accent cursor-pointer'
                          : 'hover:bg-surface-hover cursor-pointer'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-2 font-mono">{obj.objectCode}</td>
                    <td className="px-2 py-2">
                      <span className={obj.active ? 'text-success-text' : 'text-text-tertiary'}>
                        {obj.active ? '✓' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Right: panel */}
      {tab === 'REAL_TABLE' ? (
        table ? (
          <TablePanel ruleSystemCode={ruleSystemCode} table={table} filaSenalada={filaSenalada} />
        ) : selectedTable && !tablesLoading ? (
          <div className="flex-1 flex items-center justify-center px-8 text-center text-xs text-warning-text">
            La tabla <span className="font-mono mx-1">{selectedTable}</span> ya no está en {ruleSystemCode}.
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-text-tertiary text-xs">
            Selecciona una tabla para ver sus filas
          </div>
        )
      ) : tab === 'TABLE' && selectedSlot ? (
        <TableRowPanel ruleSystemCode={ruleSystemCode} tableCode={selectedSlot} />
      ) : tab === 'TABLE' ? (
        <div className="flex-1 flex items-center justify-center text-text-tertiary text-xs">
          Selecciona una ranura para ver a qué se ata
        </div>
      ) : null}

      {createTableOpen && (
        <CreateTableModal
          ruleSystemCode={ruleSystemCode}
          onClose={() => setCreateTableOpen(false)}
        />
      )}
    </div>
  )
}
