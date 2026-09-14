import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { ObjectsPage } from './ObjectsPage'
import { TableRowPanel } from './TableRowPanel'
import { tableRowsApi, type TableRowDto } from './api/tableRowsApi'
import { objectsApi } from './api/objectsApi'

vi.mock('./api/objectsApi', () => ({
  objectsApi: { list: vi.fn() },
}))

vi.mock('./api/tableRowsApi', () => ({
  tableRowsApi: { listRows: vi.fn(), deleteRow: vi.fn(), createRow: vi.fn() },
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
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

  it('la pestana se llama Ranuras, no Tablas', async () => {
    vi.mocked(objectsApi.list).mockResolvedValue([])

    wrap(<ObjectsPage />)

    expect(await screen.findByRole('button', { name: 'Ranuras' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tablas' })).not.toBeInTheDocument()
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
