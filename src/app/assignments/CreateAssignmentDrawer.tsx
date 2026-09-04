import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { conceptsApi } from '../canvas/api/conceptsApi'
import { assignmentsApi } from './api/assignmentsApi'

interface Props {
  open: boolean
  onClose: () => void
  ruleSystemCode: string
}

const initialForm = {
  conceptCode: '',
  companyCode: '',
  agreementCode: '',
  employeeTypeCode: '',
  validFrom: '',
  validTo: '',
  priority: '',
}

export function CreateAssignmentDrawer({ open, onClose, ruleSystemCode }: Props) {
  const qc = useQueryClient()
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) setForm(initialForm)
  }, [open])

  const { data: concepts = [] } = useQuery({
    queryKey: ['concepts', ruleSystemCode],
    queryFn: () => conceptsApi.listConcepts(ruleSystemCode),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: () =>
      assignmentsApi.create(ruleSystemCode, {
        conceptCode: form.conceptCode,
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

  if (!open) return null

  const isValid = form.conceptCode !== '' && form.validFrom !== '' && form.priority !== ''

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col bg-surface-panel border-l border-border-default shadow-(--shadow-panel)" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border-default">
          <h2 className="text-base font-medium text-text-primary">Nueva asignación</h2>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
          <div>
            <Label htmlFor="conceptCode" className="text-text-secondary">Concepto</Label>
            <Select value={form.conceptCode} onValueChange={v => setForm(f => ({ ...f, conceptCode: v ?? '' }))}>
              <SelectTrigger
                id="conceptCode"
                aria-label="Concepto"
                className="w-full mt-1"
              >
                <SelectValue placeholder="— selecciona un concepto —" />
              </SelectTrigger>
              <SelectContent>
                {concepts.map(c => (
                  <SelectItem key={c.conceptCode} value={c.conceptCode}>
                    {c.conceptCode} — {c.conceptMnemonic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="companyCode" className="text-text-secondary">Empresa</Label>
            <Input
              id="companyCode"
              className="mt-1"
              placeholder="* cualquier empresa"
              value={form.companyCode}
              onChange={e => setForm(f => ({ ...f, companyCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="agreementCode" className="text-text-secondary">Convenio</Label>
            <Input
              id="agreementCode"
              className="mt-1"
              placeholder="* cualquier convenio"
              value={form.agreementCode}
              onChange={e => setForm(f => ({ ...f, agreementCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="employeeTypeCode" className="text-text-secondary">Tipo de empleado</Label>
            <Input
              id="employeeTypeCode"
              className="mt-1"
              placeholder="* cualquier tipo"
              value={form.employeeTypeCode}
              onChange={e => setForm(f => ({ ...f, employeeTypeCode: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="validFrom" className="text-text-secondary">Desde</Label>
            <Input
              id="validFrom"
              type="date"
              className="mt-1"
              value={form.validFrom}
              onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="validTo" className="text-text-secondary">Hasta (opcional)</Label>
            <Input
              id="validTo"
              type="date"
              className="mt-1"
              value={form.validTo}
              onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="priority" className="text-text-secondary">Prioridad</Label>
            <Input
              id="priority"
              type="number"
              min={1}
              className="mt-1"
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
            />
          </div>

          {mutation.isError && (
            <div className="text-error-text text-xs">Error al crear la asignación</div>
          )}
        </div>

        <div className="p-4 border-t border-border-default flex flex-col gap-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !isValid}
            className="w-full"
          >
            {mutation.isPending ? 'Creando...' : 'Crear asignación'}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancelar
          </Button>
        </div>
      </div>
    </>
  )
}
