import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tableRowsApi } from './api/tableRowsApi'

interface Props {
  ruleSystemCode: string
  onClose: () => void
}

export function CreateTableModal({ ruleSystemCode, onClose }: Props) {
  const qc = useQueryClient()
  const [objectCode, setObjectCode] = useState('')

  const mutation = useMutation({
    mutationFn: () => tableRowsApi.createTable(ruleSystemCode, objectCode.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['objects', ruleSystemCode, 'TABLE'] })
      onClose()
    },
  })

  return (
    <>
      <div className="fixed inset-0 z-50 bg-surface-overlay" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-surface-panel border border-border-default rounded-lg shadow-(--shadow-panel) p-4">
        <p className="text-sm font-medium text-text-primary mb-4">Nueva tabla salarial</p>

        <div className="mb-1">
          <label className="text-[9px] text-text-tertiary uppercase tracking-wide">
            Código de tabla *
          </label>
          <input
            autoFocus
            type="text"
            value={objectCode}
            onChange={e => setObjectCode(e.target.value)}
            placeholder="Ej: SB_99002405012025"
            className="mt-1 w-full bg-surface-panel border border-border-default rounded-md text-xs text-text-primary placeholder:text-text-tertiary font-mono px-2 py-1.5 focus:outline-none focus:border-accent-border focus:shadow-(--focus-ring)"
          />
          <p className="text-[8px] text-text-tertiary mt-1">
            Identificador único. Se usará como clave de búsqueda en el motor de cálculo.
          </p>
        </div>

        {mutation.isError && (
          <p className="text-error-text text-[9px] mt-2">Error al crear la tabla</p>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 bg-surface-panel border border-border-default text-text-secondary rounded-md hover:bg-surface-hover hover:text-text-primary"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !objectCode.trim()}
            onClick={() => mutation.mutate()}
            className="text-xs px-3 py-1.5 bg-accent-primary border border-accent-primary text-text-inverse rounded-md hover:bg-accent-primary-hover disabled:opacity-50"
          >
            {mutation.isPending ? 'Creando...' : 'Crear tabla'}
          </button>
        </div>
      </div>
    </>
  )
}
