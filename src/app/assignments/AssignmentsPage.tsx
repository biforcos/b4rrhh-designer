import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assignmentsApi, type AssignmentDto } from './api/assignmentsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { CreateAssignmentDrawer } from './CreateAssignmentDrawer'
import { EditAssignmentDrawer } from './EditAssignmentDrawer'

export function AssignmentsPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const qc = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<AssignmentDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AssignmentDto | null>(null)

  const { data = [], isLoading, isError, error } = useQuery({
    queryKey: ['assignments', ruleSystemCode],
    queryFn: () => assignmentsApi.list(ruleSystemCode),
  })

  const deleteMutation = useMutation({
    mutationFn: (assignmentCode: string) => assignmentsApi.delete(ruleSystemCode, assignmentCode),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] })
      setDeleteTarget(null)
    },
  })

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg text-text-primary font-semibold">Reglas de asignación</h1>
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="text-xs px-3 py-1.5 bg-surface-panel border border-border-default text-text-secondary rounded-md hover:bg-surface-hover hover:text-text-primary"
        >
          + Asignación
        </button>
      </div>

      {isLoading ? (
        <div className="text-text-tertiary text-sm">Cargando...</div>
      ) : isError ? (
        <div className="text-error-text text-sm font-mono">
          Error al cargar asignaciones: {error instanceof Error ? error.message : 'Error desconocido'}
        </div>
      ) : (
        <table className="w-full text-xs text-text-primary border-collapse">
          <thead>
            <tr className="text-text-tertiary text-left border-b border-border-strong">
              <th className="pb-2 pr-3">Concepto</th>
              <th className="pb-2 pr-3">Empresa</th>
              <th className="pb-2 pr-3">Convenio</th>
              <th className="pb-2 pr-3">Tipo emp.</th>
              <th className="pb-2 pr-3">Desde</th>
              <th className="pb-2 pr-3">Hasta</th>
              <th className="pb-2 pr-3">Prioridad</th>
              <th className="pb-2" aria-label="Acciones"></th>
            </tr>
          </thead>
          <tbody>
            {data.map(a => (
              <tr key={a.assignmentCode} className="border-b border-border-default hover:bg-surface-hover">
                <td className="py-1.5 pr-3 font-mono text-text-accent">{a.conceptCode}</td>
                <td className="py-1.5 pr-3 text-text-tertiary">{a.companyCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-text-tertiary">{a.agreementCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-text-tertiary">{a.employeeTypeCode ?? '*'}</td>
                <td className="py-1.5 pr-3 text-text-secondary">{a.validFrom}</td>
                <td className="py-1.5 pr-3 text-text-secondary">{a.validTo ?? '—'}</td>
                <td className="py-1.5 pr-3 text-text-secondary">{a.priority}</td>
                <td className="py-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTarget(a)}
                    className="text-text-tertiary hover:text-text-primary text-[10px]"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(a)}
                    className="text-text-tertiary hover:text-error-text text-[10px]"
                  >
                    ⊗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CreateAssignmentDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ruleSystemCode={ruleSystemCode}
      />
      <EditAssignmentDrawer
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        ruleSystemCode={ruleSystemCode}
        assignment={editTarget}
      />

      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-surface-overlay" onClick={() => setDeleteTarget(null)} />
          <div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-surface-panel border border-border-default rounded-lg p-5 shadow-(--shadow-panel)">
            <p className="text-text-primary text-sm font-medium mb-1">¿Eliminar asignación?</p>
            <p className="text-text-tertiary text-xs mb-4 font-mono">{deleteTarget.conceptCode}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-xs px-3 py-1.5 border border-border-default text-text-secondary rounded-md hover:bg-surface-hover"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deleteTarget.assignmentCode)}
                disabled={deleteMutation.isPending}
                className="text-xs px-3 py-1.5 bg-error-bg border border-error-border text-error-text rounded-md hover:border-error-text disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
