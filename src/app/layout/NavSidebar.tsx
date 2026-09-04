import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Network, List, ClipboardList, LogIn } from 'lucide-react'
import { ruleSystemsApi } from '../../api/ruleSystemsApi'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { BACKOFFICE_HOME } from '../../routes'

const NAV_ITEMS = [
  { to: '/canvas', icon: Network, label: 'Canvas' },
  { to: '/objects', icon: List, label: 'Objetos' },
  { to: '/assignments', icon: ClipboardList, label: 'Asignaciones' },
]

export function NavSidebar() {
  const { ruleSystemCode, setRuleSystemCode } = useRuleSystemStore()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  const { data: ruleSystems = [] } = useQuery({
    queryKey: ['rule-systems'],
    queryFn: ruleSystemsApi.list,
  })

  useEffect(() => {
    if (ruleSystems.length === 0) return
    const found = ruleSystems.find(rs => rs.code === ruleSystemCode && rs.active)
    if (!found) {
      const first = ruleSystems.find(rs => rs.active)
      if (first) setRuleSystemCode(first.code)
    }
  }, [ruleSystems, ruleSystemCode, setRuleSystemCode])

  useEffect(() => {
    if (!popoverOpen) return
    function onPointerDown(e: PointerEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [popoverOpen])

  return (
    <nav className="w-11 bg-surface-panel border-r border-border-default flex flex-col items-center py-3 gap-1 flex-shrink-0">
      <div className="text-accent-primary text-lg font-bold mb-1">⬡</div>

      {/* Rule system badge */}
      <div ref={popoverRef} className="relative mb-2">
        <button
          type="button"
          title={`Rule system: ${ruleSystemCode}`}
          onClick={() => setPopoverOpen(o => !o)}
          className="w-8 h-6 rounded-sm text-[9px] font-mono font-semibold bg-surface-accent border border-accent-border text-accent-primary hover:bg-accent-muted truncate px-1"
        >
          {ruleSystemCode}
        </button>
        {popoverOpen && (
          <div className="absolute left-full top-0 ml-2 bg-surface-panel border border-border-default rounded-md shadow-(--shadow-panel) z-50 min-w-[160px]">
            <div className="text-[9px] uppercase tracking-widest text-text-tertiary px-3 pt-2 pb-1">
              Rule system
            </div>
            {ruleSystems.filter(rs => rs.active).map(rs => (
              <button
                key={rs.code}
                type="button"
                onClick={() => { setRuleSystemCode(rs.code); setPopoverOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-surface-hover flex items-center gap-2 ${
                  rs.code === ruleSystemCode ? 'text-accent-primary' : 'text-text-primary'
                }`}
              >
                <span className="font-mono text-[10px] text-text-tertiary w-8 shrink-0">{rs.code}</span>
                <span className="truncate">{rs.name}</span>
                {rs.code === ruleSystemCode && <span className="ml-auto text-accent-primary text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          title={label}
          className={({ isActive }) =>
            `w-8 h-8 rounded-md flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors ${isActive ? 'bg-surface-accent text-accent-primary' : ''}`
          }
        >
          <Icon size={16} />
        </NavLink>
      ))}
      <div className="flex-1" />
      {/* Vuelve al backoffice, no cierra sesion: la sesion es compartida y
          cerrarla desde aqui tumbaria la pestaña de al lado. Ver routes.ts. */}
      <button
        type="button"
        onClick={() => window.location.assign(BACKOFFICE_HOME)}
        title="Volver al backoffice"
        className="w-8 h-8 rounded-md flex items-center justify-center text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-colors"
      >
        <LogIn size={16} className="-scale-x-100" />
      </button>
    </nav>
  )
}
