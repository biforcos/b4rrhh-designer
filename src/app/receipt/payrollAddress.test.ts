import { describe, it, expect } from 'vitest'
import { payrollStepsPath, readPayrollAddress } from './payrollAddress'

const EMP000001 = {
  ruleSystemCode: 'ESP',
  employeeTypeCode: 'INTERNAL',
  employeeNumber: 'EMP000001',
  payrollPeriodCode: '202609',
  payrollTypeCode: 'NORMAL',
  presenceNumber: 2,
}

describe('payrollStepsPath', () => {
  it('monta la ruta de los pasos con las seis partes en su orden', () => {
    expect(payrollStepsPath(EMP000001)).toBe(
      '/payrolls/ESP/INTERNAL/EMP000001/202609/NORMAL/2/steps',
    )
  })

  it('escapa lo que venga en la dirección, que llega de la URL', () => {
    expect(payrollStepsPath({ ...EMP000001, employeeNumber: 'EMP 1/2' })).toContain('EMP%201%2F2')
  })
})

describe('readPayrollAddress', () => {
  it('lee las seis partes de los parámetros de la ruta', () => {
    expect(
      readPayrollAddress({
        ruleSystemCode: 'ESP',
        employeeTypeCode: 'INTERNAL',
        employeeNumber: 'EMP000001',
        payrollPeriodCode: '202609',
        payrollTypeCode: 'NORMAL',
        presenceNumber: '2',
      }),
    ).toEqual(EMP000001)
  })

  it('no acepta una presencia que no sea un entero positivo', () => {
    const base = {
      ruleSystemCode: 'ESP',
      employeeTypeCode: 'INTERNAL',
      employeeNumber: 'EMP000001',
      payrollPeriodCode: '202609',
      payrollTypeCode: 'NORMAL',
    }
    expect(readPayrollAddress({ ...base, presenceNumber: '0' })).toBeNull()
    expect(readPayrollAddress({ ...base, presenceNumber: '-1' })).toBeNull()
    expect(readPayrollAddress({ ...base, presenceNumber: 'dos' })).toBeNull()
    expect(readPayrollAddress({ ...base, presenceNumber: undefined })).toBeNull()
  })

  it('no acepta un tipo de nómina que no exista', () => {
    expect(
      readPayrollAddress({ ...EMP000001, payrollTypeCode: 'FINIQUITO', presenceNumber: '2' }),
    ).toBeNull()
  })

  it('no acepta que falte cualquiera de las otras partes', () => {
    for (const missing of [
      'ruleSystemCode',
      'employeeTypeCode',
      'employeeNumber',
      'payrollPeriodCode',
    ]) {
      const params: Record<string, string | undefined> = { ...EMP000001, presenceNumber: '2' }
      params[missing] = undefined
      expect(readPayrollAddress(params), missing).toBeNull()
    }
  })
})
