import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { NavSidebar } from './NavSidebar'
import { ruleSystemsApi } from '../../api/ruleSystemsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'

vi.mock('../../api/ruleSystemsApi', () => ({
  ruleSystemsApi: { list: vi.fn() },
}))

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  useRuleSystemStore.setState({ ruleSystemCode: 'ESP' })
  vi.mocked(ruleSystemsApi.list).mockResolvedValue([
    { code: 'ESP', name: 'España', active: true },
    { code: 'PRT', name: 'Portugal', active: true },
  ])
})

afterEach(() => {
  useRuleSystemStore.setState({ ruleSystemCode: 'ESP' })
})

describe('boton de abajo del rail', () => {
  const assign = vi.fn()
  const realLocation = window.location

  beforeEach(() => {
    // jsdom no implementa la navegacion real; se sustituye solo `assign`.
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...realLocation, assign },
    })
    localStorage.setItem('b4rrhh.auth.session', JSON.stringify({
      token: 't', subject: 'bifor', expiresAt: '2099-01-01T00:00:00Z',
    }))
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation })
    localStorage.clear()
    assign.mockReset()
  })

  it('vuelve al backoffice sin tocar la sesion compartida', async () => {
    wrap(<NavSidebar />)
    await waitFor(() => screen.getByTitle('Rule system: ESP'))

    fireEvent.click(screen.getByTitle('Volver al backoffice'))

    expect(assign).toHaveBeenCalledWith('/')
    expect(localStorage.getItem('b4rrhh.auth.session')).not.toBeNull()
  })

  it('ya no ofrece cerrar sesion', async () => {
    wrap(<NavSidebar />)
    await waitFor(() => screen.getByTitle('Rule system: ESP'))

    expect(screen.queryByTitle(/Cerrar sesión/)).not.toBeInTheDocument()
  })
})

it('shows current rule system code as badge', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => expect(screen.getByTitle('Rule system: ESP')).toBeInTheDocument())
})

it('opens popover with rule system list on badge click', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByTitle('Rule system: ESP'))
  expect(screen.getByText('España')).toBeInTheDocument()
  expect(screen.getByText('Portugal')).toBeInTheDocument()
})

it('updates store and closes popover when a rule system is selected', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByText('Portugal'))
  expect(useRuleSystemStore.getState().ruleSystemCode).toBe('PRT')
  expect(screen.queryByText('España')).not.toBeInTheDocument()
})

it('auto-selects first active system when stored code is not in list', async () => {
  useRuleSystemStore.setState({ ruleSystemCode: 'UNKNOWN' })
  wrap(<NavSidebar />)
  await waitFor(() =>
    expect(useRuleSystemStore.getState().ruleSystemCode).toBe('ESP')
  )
})

it('closes popover on outside pointer down', async () => {
  wrap(<NavSidebar />)
  await waitFor(() => screen.getByTitle('Rule system: ESP'))
  fireEvent.click(screen.getByTitle('Rule system: ESP'))
  expect(screen.getByText('España')).toBeInTheDocument()
  fireEvent.pointerDown(document.body)
  expect(screen.queryByText('España')).not.toBeInTheDocument()
})
