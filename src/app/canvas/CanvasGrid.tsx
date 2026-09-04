import { Background, BackgroundVariant, useStore } from '@xyflow/react'

// La reticula fina se oculta por debajo de este zoom: <Background> escala con
// el zoom, y a 0,5 la fina cae a 11px y hace muare.
export const FINE_GRID_MIN_ZOOM = 0.7

/**
 * Retícula de plano de dibujo sobre la tinta (designer#2): dos <Background>
 * apilados, en blanco sobre tinta como manda la regla de la portada. Sin la
 * mayor, la fina sola vibra y no da sitio; con la mayor más marcada, las
 * líneas compiten con el borde de los nodos.
 */
export function CanvasGrid() {
  const zoom = useStore(s => s.transform[2])

  return (
    <>
      {zoom > FINE_GRID_MIN_ZOOM && (
        <Background id="fina" variant={BackgroundVariant.Lines} gap={22} lineWidth={1} color="var(--ink-grid)" />
      )}
      <Background id="mayor" variant={BackgroundVariant.Lines} gap={110} lineWidth={1} color="var(--ink-grid-major)" />
    </>
  )
}
