import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ConceptGraphCanvas } from './ConceptGraphCanvas'
import type { ConceptFlowEdge, ConceptFlowNode } from './types'

/** Lo que ConceptGraphCanvas le pasa a React Flow, que es lo único que este test mira. */
const propsDelLienzo: Record<string, unknown>[] = []

vi.mock('@xyflow/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@xyflow/react')>()
  return {
    ...actual,
    // Se queda con las props y no pinta nada: React Flow en jsdom mide 0×0 y no encuadraría de
    // todas formas. Lo que hay que defender es la configuración, no el encuadre.
    ReactFlow: (props: Record<string, unknown>) => {
      propsDelLienzo.push(props)
      return null
    },
  }
})

/**
 * El suelo de zoom del lienzo (`b4rrhh/designer#14`).
 *
 * <h3>Qué pasaba</h3>
 *
 * `ConceptGraphCanvas` pedía `fitView` **sin `minZoom`**, así que se quedaba en el 0,5 por omisión
 * de React Flow. A ese zoom el marco del modo recibo enseña 1.518 × 1.796 unidades de dibujo, y el
 * grafo del catálogo ESP **de hoy**, con sus 38 conceptos, mide 2.300 × 1.715: se entraba viendo
 * el 69 % y el resto se buscaba arrastrando. El nombre `fitView` prometía justo lo que no hacía, y
 * no lo había notado nadie porque el 69 % es bastante y porque el trozo que se perdía son los
 * nodos técnicos de la derecha.
 *
 * <h3>Por qué esto se vigila con un número y no con una captura</h3>
 *
 * Porque el defecto era **silencioso**: no fallaba nada, simplemente no encuadraba. Un test que
 * mirase el dibujo no lo habría visto —el dibujo salía, sólo que cortado—, y en jsdom el lienzo
 * mide 0×0 y no encuadra nada. Lo que se puede defender aquí es la única causa: que el suelo esté
 * puesto y esté por debajo de lo que el grafo real necesita.
 */
describe('El lienzo del grafo puede alejarse lo suficiente para encuadrar', () => {
  /**
   * Lo medido en el `b4rrhh/workspace#10`: el zoom al que cada grafo se ve entero en el marco del
   * modo recibo. El suelo tiene que estar por debajo de todos.
   */
  const ZOOM_QUE_PIDE_CADA_GRAFO = [
    { catalogo: 'ESP de hoy, 38 conceptos, 2.300 × 1.715', zoom: 0.33 },
    { catalogo: '5 cadenas de 12, hondo, 4.460 × 3.891', zoom: 0.17 },
    { catalogo: '60 hojas, ancho, 2.300 × 9.378', zoom: 0.096 },
  ]

  it('pide encuadrar y dice hasta dónde puede alejarse', () => {
    const props = render1()

    expect(props.fitView).toBe(true)
    expect(typeof props.minZoom).toBe('number')
  })

  it.each(ZOOM_QUE_PIDE_CADA_GRAFO)(
    'el suelo deja encuadrar el catálogo $catalogo',
    ({ zoom }) => {
      // Estricto y no «menor o igual»: con el suelo justo en el zoom que pide el grafo, encuadrar
      // deja el dibujo pegado a los bordes y el `padding` de fitView ya no cabe.
      expect(render1().minZoom as number).toBeLessThan(zoom)
    },
  )

  /**
   * Y por el otro lado: el suelo no es el 0,5 de React Flow.
   *
   * Es la comprobación que pilla el arreglo deshecho. Si alguien quitara `minZoom` de la llamada,
   * las tres afirmaciones de arriba fallarían con `undefined`, que no es un mensaje que diga lo
   * que ha pasado; ésta lo dice.
   */
  it('no se queda en el 0,5 por omisión de React Flow, que es lo que no cabía', () => {
    expect(render1().minZoom).not.toBe(0.5)
    expect(render1().minZoom).not.toBeUndefined()
  })

  function render1(): Record<string, unknown> {
    propsDelLienzo.length = 0
    render(
      <ConceptGraphCanvas
        nodes={[] as ConceptFlowNode[]}
        edges={[] as ConceptFlowEdge[]}
        onNodeClick={() => {}}
        onPaneClick={() => {}}
        onInit={() => {}}
      />,
    )
    return propsDelLienzo[0]
  }
})
