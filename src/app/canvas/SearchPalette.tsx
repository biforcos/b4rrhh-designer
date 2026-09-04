import { useEffect, useRef, useState } from 'react'
import type { ConceptFlowNode } from './types'
import { CALCULATION_TYPE_LABELS } from './conceptLabels'

interface Props {
  nodes: ConceptFlowNode[]
  onSelect: (nodeId: string) => void
  onClose: () => void
}

export function SearchPalette({ nodes, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = query.trim() === ''
    ? nodes
    : nodes.filter(n =>
        n.data.conceptCode.toLowerCase().includes(query.toLowerCase()) ||
        n.data.conceptMnemonic.toLowerCase().includes(query.toLowerCase())
      )
  const visible = filtered.slice(0, 8)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onClose(); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, visible.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && visible[activeIndex]) { onSelect(visible[activeIndex].id) }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-surface-overlay" onClick={onClose} />
      <div className="fixed z-50 left-1/2 top-[20%] -translate-x-1/2 w-[440px] bg-surface-panel border border-border-default rounded-lg shadow-(--shadow-panel) overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border-default">
          <span className="text-text-tertiary text-sm">⌕</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar concepto..."
            className="flex-1 bg-transparent outline-none text-sm text-text-primary placeholder:text-text-tertiary font-mono"
          />
          <kbd className="text-[9px] border border-border-default rounded-sm px-1 text-text-tertiary">Esc</kbd>
        </div>

        <div className="max-h-[280px] overflow-y-auto">
          {visible.length === 0 && (
            <div className="px-3 py-4 text-center text-xs text-text-tertiary">Sin resultados</div>
          )}
          {visible.map((node, i) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelect(node.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left border-l-2 transition-colors ${
                i === activeIndex
                  ? 'bg-surface-accent border-accent-primary'
                  : 'border-transparent hover:bg-surface-hover'
              }`}
            >
              <span className="font-mono font-semibold text-xs text-text-primary w-32 truncate">
                {node.data.conceptCode}
              </span>
              <span className="text-[10px] text-text-secondary flex-1 truncate">
                {node.data.conceptMnemonic}
              </span>
              <span className="text-[9px] text-text-tertiary">
                {CALCULATION_TYPE_LABELS[node.data.calculationType]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-4 px-3 py-1.5 border-t border-border-default">
          <span className="text-[9px] text-text-tertiary">
            <kbd className="border border-border-default rounded-sm px-0.5">↵</kbd> ir al nodo
          </span>
          <span className="text-[9px] text-text-tertiary">
            <kbd className="border border-border-default rounded-sm px-0.5">↑↓</kbd> navegar
          </span>
        </div>
      </div>
    </>
  )
}
