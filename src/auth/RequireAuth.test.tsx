import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi } from 'vitest'
import { RequireAuth } from './RequireAuth'

const replace = vi.fn()
const realLocation = window.location

beforeEach(() => {
  // jsdom no implementa la navegacion real; se sustituye solo `replace`.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...realLocation, replace },
  })
})

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: realLocation })
  localStorage.clear()
  replace.mockReset()
})

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="login" element={<div>login del designer</div>} />
        <Route element={<RequireAuth />}>
          <Route path="canvas" element={<div>canvas</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

it('deja pasar con sesion vigente', () => {
  localStorage.setItem('b4rrhh.auth.session', JSON.stringify({
    token: 't', subject: 'bifor', expiresAt: '2099-01-01T00:00:00Z',
  }))

  renderAt('/canvas')

  expect(screen.getByText('canvas')).toBeInTheDocument()
  expect(replace).not.toHaveBeenCalled()
})

it('sin sesion manda al login del backoffice, no al del designer', () => {
  renderAt('/canvas')

  expect(replace).toHaveBeenCalledWith('/login')
  expect(screen.queryByText('login del designer')).not.toBeInTheDocument()
  expect(screen.queryByText('canvas')).not.toBeInTheDocument()
})
