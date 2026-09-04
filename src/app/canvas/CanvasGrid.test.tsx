import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ReactFlowProvider, useStoreApi } from '@xyflow/react'
import { CanvasGrid, FINE_GRID_MIN_ZOOM } from './CanvasGrid'

// Fija el zoom del store sin necesitar un <ReactFlow> montado (que en jsdom
// no tiene medidas): el transform es [x, y, zoom].
function ZoomAt({ zoom }: { zoom: number }) {
  const store = useStoreApi()
  useEffect(() => { store.setState({ transform: [0, 0, zoom] }) }, [store, zoom])
  return null
}

function renderAt(zoom: number) {
  return render(
    <ReactFlowProvider>
      <ZoomAt zoom={zoom} />
      <CanvasGrid />
    </ReactFlowProvider>,
  )
}

describe('CanvasGrid', () => {
  it('a zoom 1 pinta las dos retículas, la fina y la mayor', () => {
    renderAt(1)
    expect(screen.getAllByTestId('rf__background')).toHaveLength(2)
  })

  it('al alejar por debajo del umbral se queda solo la mayor, sin muaré', () => {
    renderAt(0.5)
    expect(screen.getAllByTestId('rf__background')).toHaveLength(1)
  })

  it('el umbral es el que dice el issue', () => {
    expect(FINE_GRID_MIN_ZOOM).toBe(0.7)
  })
})
