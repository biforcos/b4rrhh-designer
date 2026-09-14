import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useEmbeddedFocus } from './useEmbeddedFocus'
import { FOCUS_CONCEPT_MESSAGE } from './embedBridge'
import {
  resetFocusConceptChannelForTests,
  startFocusConceptChannel,
} from './focusConceptChannel'

beforeEach(() => {
  resetFocusConceptChannelForTests()
})

function sendFocus(conceptCode: string, origin = window.location.origin) {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', { data: { type: FOCUS_CONCEPT_MESSAGE, conceptCode }, origin }),
    )
  })
}

describe('useEmbeddedFocus', () => {
  it('con el grafo cargado, un mensaje centra el concepto en cuanto llega', () => {
    const onFocus = vi.fn()
    renderHook(() => useEmbeddedFocus({ graphLoaded: true, onFocus }))

    sendFocus('B_CC')

    expect(onFocus).toHaveBeenCalledWith('B_CC')
  })

  it('un mensaje de otro origen no centra nada', () => {
    const onFocus = vi.fn()
    renderHook(() => useEmbeddedFocus({ graphLoaded: true, onFocus }))

    sendFocus('B_CC', 'https://otro.test')

    expect(onFocus).not.toHaveBeenCalled()
  })

  it('un mensaje que llega antes de que el grafo esté cargado no se pierde: se aplica al cargar', () => {
    // Es lo que hace innecesario un tercer mensaje «ya estoy listo» (`designer#8`, punto 6).
    const onFocus = vi.fn()
    const { rerender } = renderHook(
      ({ graphLoaded }) => useEmbeddedFocus({ graphLoaded, onFocus }),
      { initialProps: { graphLoaded: false } },
    )

    sendFocus('101')
    expect(onFocus).not.toHaveBeenCalled()

    rerender({ graphLoaded: true })

    expect(onFocus).toHaveBeenCalledWith('101')
  })

  it('de dos mensajes en espera se atiende el último, que es el que el usuario pidió', () => {
    const onFocus = vi.fn()
    const { rerender } = renderHook(
      ({ graphLoaded }) => useEmbeddedFocus({ graphLoaded, onFocus }),
      { initialProps: { graphLoaded: false } },
    )

    sendFocus('101')
    sendFocus('B_CC')
    rerender({ graphLoaded: true })

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onFocus).toHaveBeenCalledWith('B_CC')
  })

  it('el mensaje en espera se atiende una vez y se olvida: no revive al recargar el grafo', () => {
    // Si la cola no se vacía, un recibo que se recarga vuelve a saltar al concepto de hace un rato
    // sin que nadie lo haya pedido.
    const onFocus = vi.fn()
    const { rerender } = renderHook(
      ({ graphLoaded }) => useEmbeddedFocus({ graphLoaded, onFocus }),
      { initialProps: { graphLoaded: false } },
    )

    sendFocus('101')
    rerender({ graphLoaded: true })
    expect(onFocus).toHaveBeenCalledTimes(1)

    rerender({ graphLoaded: false })
    rerender({ graphLoaded: true })

    expect(onFocus).toHaveBeenCalledTimes(1)
  })

  it('un mensaje que llega antes de que el componente se monte tampoco se pierde', () => {
    // El arranque en frío del navegador: el marco dispara su `load`, quien embebe manda el mensaje
    // y el efecto de React todavía no ha corrido. Medido: mensaje a los 64 ms, lienzo a los 502.
    startFocusConceptChannel()
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { type: FOCUS_CONCEPT_MESSAGE, conceptCode: 'B_CC' },
          origin: window.location.origin,
        }),
      )
    })

    const onFocus = vi.fn()
    renderHook(() => useEmbeddedFocus({ graphLoaded: true, onFocus }))

    expect(onFocus).toHaveBeenCalledWith('B_CC')
  })

  it('deja de escuchar al desmontarse', () => {
    const onFocus = vi.fn()
    const { unmount } = renderHook(() => useEmbeddedFocus({ graphLoaded: true, onFocus }))

    unmount()
    sendFocus('101')

    expect(onFocus).not.toHaveBeenCalled()
  })
})
