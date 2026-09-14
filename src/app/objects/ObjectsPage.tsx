import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { objectsApi, type PayrollObjectDto } from './api/objectsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { TableRowPanel } from './TableRowPanel'
import { CreateTableModal } from './CreateTableModal'

type Tab = 'CONSTANT' | 'TABLE'

/**
 * La pestana TABLE lista `payroll_object` de tipo TABLE, y eso no son tablas:
 * son *ranuras*. El motor usa su codigo como rol de vinculacion para resolver,
 * por convenio, que tabla de verdad le toca (`payroll.payroll_object_binding`).
 * Se llaman ranuras desde el `b4rrhh/designer#10`, porque llamarlas «Tablas»
 * hacia creer que los importes del recibo estaban ahi dentro y que se podian
 * tocar. El tipo del contrato sigue siendo TABLE y no se toca.
 */

export function ObjectsPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const [tab, setTab] = useState<Tab>('CONSTANT')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [createTableOpen, setCreateTableOpen] = useState(false)

  const { data = [], isLoading } = useQuery({
    queryKey: ['objects', ruleSystemCode, tab],
    queryFn: () => objectsApi.list(ruleSystemCode, tab),
  })

  function handleTabChange(t: Tab) {
    setTab(t)
    setSelectedSlot(null)
  }

  function handleRowClick(obj: PayrollObjectDto) {
    if (tab === 'TABLE') {
      setSelectedSlot(prev => prev === obj.objectCode ? null : obj.objectCode)
    }
  }

  return (
    <div className="flex h-full">
      {/* Left: object list */}
      <div className="w-72 flex-shrink-0 flex flex-col border-r border-border-default">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
          <div className="flex gap-1">
            {(['CONSTANT', 'TABLE'] as Tab[]).map(t => (
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
                {t === 'CONSTANT' ? 'Constantes' : 'Ranuras'}
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
          ) : (
            <table className="w-full text-xs text-text-primary border-collapse">
              <thead>
                <tr className="text-text-tertiary text-left border-b border-border-strong">
                  <th className="px-4 py-2">Código</th>
                  <th className="px-2 py-2">Activo</th>
                </tr>
              </thead>
              <tbody>
                {data.map(obj => (
                  <tr
                    key={obj.objectCode}
                    onClick={() => handleRowClick(obj)}
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

      {/* Right: row panel (only for TABLE tab) */}
      {tab === 'TABLE' && selectedSlot ? (
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
