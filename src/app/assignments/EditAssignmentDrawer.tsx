import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { assignmentsApi, type AssignmentDto } from './api/assignmentsApi'

interface Props {
  open: boolean
  onClose: () => void
  ruleSystemCode: string
  assignment: AssignmentDto | null
}

export function EditAssignmentDrawer({ open, onClose, ruleSystemCode, assignment }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    companyCode: '',
    agreementCode: '',
    employeeTypeCode: '',
    validFrom: '',
    validTo: '',
    priority: '',
  })

  useEffect(() => {
    if (assignment) {
      setForm({
        companyCode: assignment.companyCode ?? '',
        agreementCode: assignment.agreementCode ?? '',
        employeeTypeCode: assignment.employeeTypeCode ?? '',
        validFrom: assignment.validFrom,
        validTo: assignment.validTo ?? '',
        priority: String(assignment.priority),
      })
    }
  }, [assignment])

  const mutation = useMutation({
    mutationFn: () =>
      assignmentsApi.update(ruleSystemCode, assignment!.assignmentCode, {
        companyCode: form.companyCode || null,
        agreementCode: form.agreementCode || null,
        employeeTypeCode: form.employeeTypeCode || null,
        validFrom: form.validFrom,
        validTo: form.validTo || null,
        priority: parseInt(form.priority, 10),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assignments', ruleSystemCode] })
      onClose()
    },
  })

  if (!open || !assignment) return null

  const isValid = form.validFrom !== '' && form.priority !== ''

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-surface-panel border-l border-border-default shadow-(--shadow-panel)" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border-default">
          <h2 className="text-base font-medium text-text-primary">Editar asignación</h2>
          <p className="text-xs text-text-tertiary mt-0.5 font-mono">{assignment.conceptCode}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          <div>
            <Label htmlFor="edit-companyCode" className="text-text-secondary">Empresa</Label>
            <Input
              id="edit-companyCode"
              className="mt-1"
              placeholder="* cualquier empresa"
              value={form.companyCode}
              onChange={e => setForm(f => ({ ...f, companyCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-agreementCode" className="text-text-secondary">Convenio</Label>
            <Input
              id="edit-agreementCode"
              className="mt-1"
              placeholder="* cualquier convenio"
              value={form.agreementCode}
              onChange={e => setForm(f => ({ ...f, agreementCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-employeeTypeCode" className="text-text-secondary">Tipo de empleado</Label>
            <Input
              id="edit-employeeTypeCode"
              className="mt-1"
              placeholder="* cualquier tipo"
              value={form.employeeTypeCode}
              onChange={e => setForm(f => ({ ...f, employeeTypeCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-validFrom" className="text-text-secondary">Desde</Label>
            <Input
              id="edit-validFrom"
              type="date"
              className="mt-1"
              value={form.validFrom}
              onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-validTo" className="text-text-secondary">Hasta (opcional)</Label>
            <Input
              id="edit-validTo"
              type="date"
              className="mt-1"
              value={form.validTo}
              onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit-priority" className="text-text-secondary">Prioridad</Label>
            <Input
              id="edit-priority"
              type="number"
              min={1}
              className="mt-1"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <div className="text-error-text text-xs">Error al guardar la asignación</div>
          )}
        </div>

        <div className="p-4 border-t border-border-default flex flex-col gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="w-full"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </div>
    </>
  )
}
