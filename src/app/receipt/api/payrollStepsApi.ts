import { apiFetch } from '../../../api/client'
import { payrollStepsPath, type PayrollAddress } from '../payrollAddress'
import type { PayrollStep } from '../payrollStep'

export const payrollStepsApi = {
  /** Los pasos del cálculo de un recibo, en orden de ejecución (`backend#97`). */
  listSteps: (address: PayrollAddress) => apiFetch<PayrollStep[]>(payrollStepsPath(address)),
}
