import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { AppShell } from '../layout/AppShell'
import { ObjectsPage } from './ObjectsPage'
import { objectsApi } from './api/objectsApi'
import { tablesApi, type PayrollTableDto } from './api/tablesApi'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { ruleSystemsApi } from '../../api/ruleSystemsApi'
import { useReciboDeOrigen } from '../../reciboDeOrigenStore'
import { useRuleSystemStore } from '../../ruleSystemStore'

vi.mock('./api/objectsApi', () => ({ objectsApi: { list: vi.fn() } }))
vi.mock('./api/tablesApi', () => ({ tablesApi: { list: vi.fn() } }))
vi.mock('./api/tableRowsApi', () => ({
  tableRowsApi: { listRows: vi.fn(), updateRow: vi.fn(), deleteRow: vi.fn(), createRow: vi.fn() },
}))
vi.mock('../../api/ruleSystemsApi', () => ({ ruleSystemsApi: { list: vi.fn() } }))

const TABLA = 'P02_99002405011982'

/** La dirección con la que el recibo del backoffice salta a la fila que puso su precio día. */
const DESDE_EL_RECIBO =
  `/objects?tabla=${TABLA}&fila=7&recibo=ESP/INTERNAL/EMP001000/202609/NORMAL/2`

function tabla(overrides: Partial<PayrollTableDto> = {}): PayrollTableDto {
  return {
    ruleSystemCode: 'ESP',
    tableCode: TABLA,
    rowCount: 3,
    activeRowCount: 3,
    bindings: [
      { ownerTypeCode: 'AGREEMENT', ownerCode: '99002405011982', bindingRoleCode: 'P02_DAILY_AMOUNT_TABLE', active: true },
    ],
    ...overrides,
  }
}

function fila(overrides: Partial<TableRowDto> = {}): TableRowDto {
  return {
    id: 7,
    searchCode: '99002405-G3',
    startDate: '2025-01-01',
    endDate: null,
    monthlyValue: 1200,
    annualValue: 16800,
    dailyValue: 40,
    hourlyValue: 5,
    active: true,
    ...overrides,
  }
}

/** El designer entero, como se ve: el armazón con su miga y la pantalla dentro. */
function abrirEn(url: string) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="objects" element={<ObjectsPage />} />
            <Route path="canvas" element={<div>lienzo</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  useReciboDeOrigen.setState({ recibo: null })
  useRuleSystemStore.setState({ ruleSystemCode: 'ESP' })
  vi.mocked(ruleSystemsApi.list).mockResolvedValue([{ code: 'ESP', name: 'España', active: true }])
  vi.mocked(objectsApi.list).mockResolvedValue([])
  vi.mocked(tablesApi.list).mockResolvedValue([tabla()])
  vi.mocked(tableRowsApi.listRows).mockResolvedValue([
    fila({ id: 5, searchCode: '99002405-G1', dailyValue: 61.67 }),
    fila({ id: 6, searchCode: '99002405-G2', dailyValue: 47.5 }),
    fila(),
  ])
})

afterEach(() => {
  useReciboDeOrigen.setState({ recibo: null })
})

/**
 * Aterrizar en la fila que produjo un número, y saber volver (`designer#13`).
 *
 * No es un editor nuevo: es la pantalla de tablas de siempre, abierta por la tabla que dice la
 * dirección, con la fila señalada y una miga de vuelta. Quien llegue por aquí puede editar
 * cualquier otra cosa, porque **es** la misma pantalla que si hubiera entrado por el menú.
 */
describe('aterrizar en la fila que puso el número', () => {
  it('abre la tabla de la direccion con la fila delante y senalada', async () => {
    abrirEn(DESDE_EL_RECIBO)

    await waitFor(() => expect(tableRowsApi.listRows).toHaveBeenCalledWith('ESP', TABLA))

    const senalada = await screen.findByText('99002405-G3')
    const filaSenalada = senalada.closest('tr')!
    expect(filaSenalada).toHaveAttribute('data-senalada', 'si')
    expect(within(filaSenalada).getByText(/la del recibo/i)).toBeInTheDocument()

    // Y sólo esa: las otras dos categorías están y no están señaladas.
    expect(screen.getByText('99002405-G1').closest('tr')).not.toHaveAttribute('data-senalada')
    expect(screen.getByText('99002405-G2').closest('tr')).not.toHaveAttribute('data-senalada')
  })

  it('la miga de vuelta nombra el recibo de origen y lleva a el', async () => {
    const assign = vi.fn()
    const real = window.location
    Object.defineProperty(window, 'location', { value: { ...real, assign }, writable: true })

    abrirEn(DESDE_EL_RECIBO)

    const volver = await screen.findByRole('button', { name: /volver a.*EMP001000.*202609/i })
    fireEvent.click(volver)

    expect(assign).toHaveBeenCalledWith('/nomina/recibos/ESP/INTERNAL/EMP001000/202609/NORMAL/2')

    Object.defineProperty(window, 'location', { value: real, writable: true })
  })

  // Quien entra a cambiar un precio puede querer tocar dos. Llevarle de vuelta al guardar decide
  // por él y le quita la segunda edición.
  it('guardar no navega, y la miga sigue ahi despues de guardar', async () => {
    const assign = vi.fn()
    const real = window.location
    Object.defineProperty(window, 'location', { value: { ...real, assign }, writable: true })
    vi.mocked(tableRowsApi.updateRow).mockResolvedValue(fila({ dailyValue: 45 }))

    abrirEn(DESDE_EL_RECIBO)

    fireEvent.click(await screen.findByRole('button', { name: 'Editar la fila 99002405-G3' }))

    const precioDia = screen.getByDisplayValue('40')
    fireEvent.change(precioDia, { target: { value: '45' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar fila/i }))

    await waitFor(() =>
      expect(tableRowsApi.updateRow).toHaveBeenCalledWith(
        'ESP', TABLA, 7, expect.objectContaining({ dailyValue: 45 }),
      ),
    )

    expect(assign).not.toHaveBeenCalled()
    expect(
      await screen.findByRole('button', { name: /volver a.*EMP001000.*202609/i }),
    ).toBeInTheDocument()

    Object.defineProperty(window, 'location', { value: real, writable: true })
  })

  // El criterio que más se olvida, y el mismo del `designer#8`: la dirección apunta a lo que el
  // motor leyó, y eso puede haber desaparecido desde entonces.
  it('una fila borrada entre medias no deja la pantalla en blanco', async () => {
    vi.mocked(tableRowsApi.listRows).mockResolvedValue([
      fila({ id: 5, searchCode: '99002405-G1' }),
      fila({ id: 6, searchCode: '99002405-G2' }),
    ])

    abrirEn(DESDE_EL_RECIBO)

    expect(await screen.findByText(/la fila a la que venías ya no está/i)).toBeInTheDocument()

    // Y la tabla sigue en pie: no se ha perdido la pantalla por perder una fila.
    expect(screen.getByText('99002405-G1')).toBeInTheDocument()
    expect(screen.getByText('99002405-G2')).toBeInTheDocument()
  })

  it('sin recibo de origen no hay miga: entrar por el menu es entrar por el menu', async () => {
    abrirEn(`/objects?tabla=${TABLA}&fila=7`)

    await waitFor(() => expect(tableRowsApi.listRows).toHaveBeenCalled())

    // `/volver a/` a secas casaba con el «Volver al backoffice» del rail, que siempre esta: la
    // miga se distingue por nombrar el recibo, que es justo lo que este test comprueba que no hay.
    expect(screen.queryByRole('button', { name: /volver a EMP/i })).not.toBeInTheDocument()
  })
})
