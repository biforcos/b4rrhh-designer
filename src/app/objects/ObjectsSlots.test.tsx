import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ObjectsPage } from './ObjectsPage'
import { TableRowPanel } from './TableRowPanel'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { objectsApi } from './api/objectsApi'
import { tablesApi } from './api/tablesApi'

vi.mock('./api/objectsApi', () => ({
  objectsApi: { list: vi.fn() },
}))

vi.mock('./api/tableRowsApi', () => ({
  tableRowsApi: { listRows: vi.fn(), deleteRow: vi.fn(), createRow: vi.fn(), updateRow: vi.fn() },
}))

vi.mock('./api/tablesApi', () => ({
  tablesApi: { list: vi.fn() },
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function makeRow(overrides: Partial<TableRowDto> = {}): TableRowDto {
  return {
    id: 1,
    searchCode: 'C1',
    startDate: '2026-01-01',
    endDate: null,
    monthlyValue: 1425,
    annualValue: 19950,
    dailyValue: 47.5,
    hourlyValue: 8.9,
    active: true,
    ...overrides,
  }
}

// `P02_DAILY_AMOUNT_TABLE` no es una tabla: es una ranura, y el motor usa su codigo como rol de
// vinculacion para resolver por convenio la tabla de verdad (`SB_…`, `PC_…`, `P02_…`). La pantalla
// llamaba «Tablas» a estas ranuras y encima ofrecia «+ Nueva fila», que habria escrito filas que
// el motor no lee jamas (`b4rrhh/designer#10`).
describe('Objetos: las ranuras se llaman ranuras y no se les escriben filas', () => {
  beforeEach(() => vi.clearAllMocks())

  // Este test decia «y no hay ninguna pestana Tablas», y afirmaba de mas. Lo que el
  // `b4rrhh/designer#10` decidio es que la pestana DE LAS RANURAS no se llame Tablas, porque
  // llamarla asi hacia creer que los importes del recibo estaban ahi dentro. Desde el
  // `b4rrhh/designer#13` hay una pestana Tablas, y lista tablas de verdad: eso no deshace aquella
  // decision, la completa. Lo que se sujeta aqui es que las dos existan y no sean la misma.
  it('las ranuras se llaman Ranuras, y Tablas es otra cosa que pregunta a otro sitio', async () => {
    vi.mocked(objectsApi.list).mockResolvedValue([])
    vi.mocked(tablesApi.list).mockResolvedValue([])

    wrap(<ObjectsPage />)

    expect(await screen.findByRole('button', { name: 'Ranuras' })).toBeInTheDocument()
    const tablas = screen.getByRole('button', { name: 'Tablas' })

    fireEvent.click(screen.getByRole('button', { name: 'Ranuras' }))
    await waitFor(() => expect(objectsApi.list).toHaveBeenCalledWith('ESP', 'TABLE'))

    fireEvent.click(tablas)
    await waitFor(() => expect(tablesApi.list).toHaveBeenCalledWith('ESP'))
  })

  it('el panel de una ranura no ofrece dar de alta filas, y dice por que', async () => {
    vi.mocked(tableRowsApi.listRows).mockResolvedValue([])

    wrap(<TableRowPanel ruleSystemCode="ESP" tableCode="P02_DAILY_AMOUNT_TABLE" />)

    await waitFor(() => expect(tableRowsApi.listRows).toHaveBeenCalled())

    expect(screen.queryByRole('button', { name: /nueva fila/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Esto es una ranura, no una tabla/i)).toBeInTheDocument()
    expect(screen.getByText(/el motor no la leería jamás/i)).toBeInTheDocument()
    expect(screen.getByText(/Ranura de vinculación/i)).toBeInTheDocument()
  })

  // Si alguien ya pulso el boton antes de quitarlo, esas filas siguen ahi. Ensenarlas es lo que
  // permite borrarlas; callarlas seria el mismo defecto al reves.
  it('si hay filas escritas contra el codigo de la ranura, avisa de que nadie las lee', async () => {
    vi.mocked(tableRowsApi.listRows).mockResolvedValue([makeRow()])

    wrap(<TableRowPanel ruleSystemCode="ESP" tableCode="P02_DAILY_AMOUNT_TABLE" />)

    expect(await screen.findByText(/El motor no las lee/i)).toBeInTheDocument()
    expect(screen.getByText('C1')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /nueva fila/i })).not.toBeInTheDocument()
  })
})
