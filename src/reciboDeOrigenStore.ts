import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { PayrollAddress } from './app/receipt/payrollAddress'

interface ReciboDeOrigenState {
  recibo: PayrollAddress | null
  recordar: (recibo: PayrollAddress) => void
  olvidar: () => void
}

/**
 * El recibo del que se vino, mientras dure la pestaña (`designer#13`).
 *
 * Existe para que la miga de vuelta **no dependa de la pantalla en la que estés**. La dirección
 * llega una vez, en la consulta con la que se aterriza en la fila; a partir de ahí el visitante
 * puede irse al Canvas, a Asignaciones o a otra tabla, y el camino de vuelta sigue ahí. Es una
 * miga, no un modo: no encierra a nadie, sólo recuerda de dónde venía.
 *
 * **En `sessionStorage` y no en `localStorage`**, que es donde vive el sistema de reglas. El salto
 * abre una pestaña nueva, así que el recibo de origen es de esa pestaña: guardarlo en
 * `localStorage` pondría la miga en todas las demás, y seguiría ahí mañana.
 */
export const useReciboDeOrigen = create<ReciboDeOrigenState>()(
  persist(
    (set) => ({
      recibo: null,
      recordar: (recibo) => set({ recibo }),
      olvidar: () => set({ recibo: null }),
    }),
    {
      name: 'b4rrhh-recibo-de-origen',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
)
