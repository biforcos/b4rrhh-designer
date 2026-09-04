import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authStore } from './authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const [subject, setSubject] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dev/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), expiresInMinutes: 480 }),
      })
      if (!res.ok) throw new Error(`${res.status}`)
      const data = await res.json()
      authStore.save({ token: data.token, subject: data.subject, expiresAt: data.expiresAt })
      navigate('/canvas', { replace: true })
    } catch {
      setError('No se pudo obtener el token. ¿Está el backend arrancado?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-app flex items-center justify-center">
      <div className="w-80">
        <div className="text-center mb-8">
          <div className="text-accent-primary text-3xl mb-2">⬡</div>
          <h1 className="text-text-primary text-xl font-semibold">Payroll Designer</h1>
          <p className="text-text-tertiary text-xs mt-1">Entorno local — introduce tu usuario</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-surface-panel border border-border-default rounded-lg shadow-(--shadow-card) p-6 space-y-4">
          <div>
            <label className="text-text-secondary text-xs block mb-1.5">Usuario</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="bifor"
              autoFocus
              className="w-full bg-surface-panel border border-border-default rounded-md px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-border focus:shadow-(--focus-ring)"
            />
          </div>
          {error && <p className="text-error-text text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading || !subject.trim()}
            className="w-full bg-accent-primary hover:bg-accent-primary-hover disabled:opacity-50 text-text-inverse text-sm font-semibold py-2 rounded-md transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
