import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ReactFlow, MiniMap, Controls, Panel, addEdge, useNodesState, useEdgesState, type Connection } from '@xyflow/react'
import type { ReactFlowInstance } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ConceptNode } from './nodes/ConceptNode'
import { DeletableEdge } from './edges/DeletableEdge'
import { useConceptGraph } from './useConceptsQuery'
import type { ConceptFlowNode, ConceptFlowEdge, EdgeFocus, FunctionalNature } from './types'
import { CreateConceptDrawer } from './CreateConceptDrawer'
import { useSaveGraph } from './useSaveGraph'
import { CanvasLegend, NatureSwatch } from './CanvasLegend'
import { CanvasGrid } from './CanvasGrid'
import { savePositions, loadPositionsOrLayout } from './graphPositions'
import { ConceptDetailPanel } from './ConceptDetailPanel'
import { NATURE_LABELS } from './conceptLabels'
import { useRuleSystemStore } from '../../ruleSystemStore'
import { conceptsApi } from './api/conceptsApi'
import { validateGraph } from './validateGraph'
import type { GraphValidationResult } from './validateGraph'
import { useGraphFocus } from './useGraphFocus'
import { SearchPalette } from './SearchPalette'

const nodeTypes = { concept: ConceptNode }
const edgeTypes = { deletable: DeletableEdge }

const ALL_NATURES = Object.keys(NATURE_LABELS) as FunctionalNature[]

// La barra de herramientas es una tira de papel apoyada sobre la tinta, no
// botones sueltos: un solo borde y los botones separados por filetes.
const TOOL = 'text-xs px-3 py-1.5 text-text-secondary hover:bg-surface-hover hover:text-text-primary'
const TOOL_PRIMARY = 'text-xs px-3 py-1.5 font-semibold text-accent-primary hover:bg-surface-accent disabled:opacity-50'
const TOOL_ACTIVE = 'text-xs px-3 py-1.5 bg-surface-accent text-accent-primary'

const BUTTON = 'text-xs px-3 py-1.5 rounded-md border border-border-default bg-surface-panel text-text-secondary hover:bg-surface-hover hover:text-text-primary'
const BUTTON_PRIMARY = 'text-xs px-3 py-1.5 rounded-md border border-accent-primary bg-accent-primary text-text-inverse hover:bg-accent-primary-hover disabled:opacity-50'
const BUTTON_WARNING = 'text-xs px-3 py-1.5 rounded-md border border-warning-border bg-warning-bg text-warning-text hover:border-warning-strong'
const MODAL = 'fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-panel border border-border-default rounded-lg shadow-(--shadow-panel) p-4'

export function CanvasPage() {
  const { ruleSystemCode } = useRuleSystemStore()
  const queryClient = useQueryClient()
  const { data, isLoading } = useConceptGraph(ruleSystemCode)
  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ConceptFlowEdge>([])
  const [selectedNode, setSelectedNode] = useState<ConceptFlowNode | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterNatures, setFilterNatures] = useState<Set<FunctionalNature>>(new Set())
  const filterRef = useRef<HTMLDivElement>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<ConceptFlowNode, ConceptFlowEdge> | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const { focusedNodeIds, neighborNodeIds, ancestorNodeIds, focusedEdgeIds, ancestorEdgeIds } =
    useGraphFocus(selectedNode?.id ?? null, edges)
  const [summaryEditTarget, setSummaryEditTarget] = useState<string | null>(null)
  const [summaryDraft, setSummaryDraft] = useState('')
  const [pendingSave, setPendingSave] = useState<{ nodes: typeof nodes; edges: typeof edges; validation: GraphValidationResult } | null>(null)
  const saveGraph = useSaveGraph(ruleSystemCode)

  function handleSave() {
    const visible = nodes.filter(n => !n.hidden)
    const validation = validateGraph(visible, edges)
    if (validation.errors.length > 0 || validation.warnings.length > 0) {
      setPendingSave({ nodes: visible, edges, validation })
    } else {
      saveGraph.mutate({ nodes: visible, edges })
    }
  }

  const updateSummaryMutation = useMutation({
    mutationFn: ({ conceptCode, summary }: { conceptCode: string; summary: string | null }) =>
      conceptsApi.updateSummary(ruleSystemCode, conceptCode, summary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concepts', ruleSystemCode] })
      setSummaryEditTarget(null)
    },
  })

  const handleEditSummary = useCallback((conceptCode: string) => {
    const node = nodes.find(n => n.id === conceptCode)
    setSummaryDraft(node?.data.summary ?? '')
    setSummaryEditTarget(conceptCode)
  }, [nodes])

  useEffect(() => {
    if (data) {
      setNodes(loadPositionsOrLayout(ruleSystemCode, data.nodes, data.edges))
      setEdges(data.edges)
    }
  }, [data, setNodes, setEdges, ruleSystemCode])

  // Close filter dropdown when clicking outside
  useEffect(() => {
    if (!filterOpen) return
    function onPointerDown(e: PointerEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [filterOpen])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const onNodeDragStop = useCallback(() => {
    savePositions(ruleSystemCode, nodes)
  }, [ruleSystemCode, nodes])

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({
      ...params,
      id: `e-${params.source}-${params.target}-${params.targetHandle}`,
      type: 'deletable',
    }, eds)),
    [setEdges]
  )

  const handleDeleted = useCallback(() => {
    setNodes(ns => ns.filter(n => n.id !== selectedNode!.id))
    setSelectedNode(null)
  }, [selectedNode, setNodes])

  const handleSearchSelect = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId)
    if (!node || !rfInstance) return
    rfInstance.setCenter(node.position.x + 80, node.position.y + 40, { zoom: 1.5, duration: 500 })
    setSelectedNode(node as ConceptFlowNode)
    setSearchOpen(false)
  }, [nodes, rfInstance])

  function toggleNature(nature: FunctionalNature) {
    setFilterNatures(prev => {
      const next = new Set(prev)
      if (next.has(nature)) next.delete(nature)
      else next.add(nature)
      return next
    })
  }

  const displayNodes = useMemo(() => {
    const withState = nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        onEditSummary: handleEditSummary,
        dimmed: selectedNode != null && !focusedNodeIds.has(n.id),
        neighborHighlight: selectedNode != null && neighborNodeIds.has(n.id),
        ancestorHighlight: selectedNode != null && ancestorNodeIds.has(n.id) && !neighborNodeIds.has(n.id),
      },
    }))
    return filterNatures.size === 0
      ? withState
      : withState.map(n => ({ ...n, hidden: !filterNatures.has(n.data.functionalNature) }))
  }, [nodes, filterNatures, handleEditSummary, selectedNode, focusedNodeIds, neighborNodeIds, ancestorNodeIds])

  // Con un nodo seleccionado, cada arista esta en su camino o fuera de el; el
  // trazo lo decide DeletableEdge a partir de ese hecho, no de un color.
  const displayEdges = useMemo(() => {
    if (!selectedNode) return edges
    return edges.map(e => {
      const focus: EdgeFocus = focusedEdgeIds.has(e.id) || ancestorEdgeIds.has(e.id) ? 'path' : 'dimmed'
      return { ...e, data: { ...e.data, focus } }
    })
  }, [edges, selectedNode, focusedEdgeIds, ancestorEdgeIds])

  if (isLoading) return <div className="flex items-center justify-center h-full text-text-tertiary">Cargando grafo...</div>

  return (
    <div className="flex h-full">
      <div className="flex-1 relative">
        {/* Toolbar */}
        <div className="absolute top-2 right-2 z-10 flex items-stretch rounded-md border border-border-default bg-surface-panel shadow-(--shadow-card) divide-x divide-border-default">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className={`${TOOL} rounded-l-md`}
          >
            + Concepto
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveGraph.isPending}
            className={TOOL_PRIMARY}
          >
            {saveGraph.isPending ? 'Guardando...' : '↑ Guardar'}
          </button>
          <button
            type="button"
            onClick={() => rfInstance?.fitView({ duration: 400, padding: 0.1 })}
            className={TOOL}
          >
            ⊡ Fit
          </button>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className={TOOL}
          >
            ⌕ Buscar
          </button>

          {/* Nature filter */}
          <div ref={filterRef} className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(o => !o)}
              className={`${filterNatures.size > 0 ? TOOL_ACTIVE : TOOL} rounded-r-md transition-colors`}
            >
              Filtro {filterNatures.size > 0 ? `(${filterNatures.size})` : '▾'}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-surface-panel border border-border-default rounded-md p-2 w-48 z-20 shadow-(--shadow-panel)">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[9px] text-text-tertiary uppercase tracking-wide">Naturaleza</span>
                  {filterNatures.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterNatures(new Set())}
                      className="text-[9px] text-text-tertiary hover:text-text-primary"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
                <div className="space-y-0.5">
                  {ALL_NATURES.map(nature => (
                    <label key={nature} className="flex items-center gap-2 px-1 py-0.5 rounded-sm hover:bg-surface-hover cursor-pointer text-text-primary">
                      <input
                        type="checkbox"
                        checked={filterNatures.has(nature)}
                        onChange={() => toggleNature(nature)}
                        className="accent-accent-primary"
                      />
                      <NatureSwatch nature={nature} />
                      <span className="text-[10px]">{NATURE_LABELS[nature]}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <ReactFlow<ConceptFlowNode, ConceptFlowEdge>
          nodes={displayNodes}
          edges={displayEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => { if (node.type === 'concept') setSelectedNode(node as ConceptFlowNode) }}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={() => setSelectedNode(null)}
          onInit={setRfInstance}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <CanvasGrid />
          {/* Con el panel de detalle abierto se mira un nodo, no se navega:
              el minimapa sobra, y ademas el panel se le comia el borde. */}
          {!selectedNode && <MiniMap />}
          <Controls />
          <Panel position="bottom-right">
            <CanvasLegend />
          </Panel>
        </ReactFlow>

        <CreateConceptDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ruleSystemCode={ruleSystemCode}
        />
      </div>

      {selectedNode && (
        <ConceptDetailPanel
          node={selectedNode}
          edges={edges}
          ruleSystemCode={ruleSystemCode}
          onDeleted={handleDeleted}
        />
      )}

      {pendingSave && (
        <>
          <div className="fixed inset-0 z-50 bg-surface-overlay" onClick={() => setPendingSave(null)} />
          <div className={`${MODAL} w-[420px]`}>
            <p className="text-sm font-medium text-text-primary mb-3">Validación del grafo</p>

            {pendingSave.validation.errors.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide text-error-text font-semibold mb-1.5">
                  Errores — el grafo no se puede guardar
                </p>
                <ul className="space-y-1">
                  {pendingSave.validation.errors.map((e, i) => (
                    <li key={i} className="text-xs text-error-text bg-error-bg border border-error-border rounded-sm px-2 py-1">
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {pendingSave.validation.warnings.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide text-warning-text font-semibold mb-1.5">
                  Avisos
                </p>
                <ul className="space-y-1">
                  {pendingSave.validation.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-warning-text bg-warning-bg border border-warning-border rounded-sm px-2 py-1">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setPendingSave(null)}
                className={BUTTON}
              >
                Cancelar
              </button>
              {pendingSave.validation.errors.length === 0 && (
                <button
                  type="button"
                  onClick={() => {
                    saveGraph.mutate({ nodes: pendingSave.nodes, edges: pendingSave.edges })
                    setPendingSave(null)
                  }}
                  className={BUTTON_WARNING}
                >
                  Guardar igualmente
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {summaryEditTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-surface-overlay" onClick={() => setSummaryEditTarget(null)} />
          <div className={`${MODAL} w-96`}>
            <p className="text-xs text-text-secondary mb-1">
              Summary — <span className="font-mono text-text-primary">{summaryEditTarget}</span>
            </p>
            <textarea
              className="w-full bg-surface-panel border border-border-default rounded-md text-xs text-text-primary placeholder:text-text-tertiary p-2 resize-none focus:outline-none focus:border-accent-border focus:shadow-(--focus-ring)"
              rows={4}
              value={summaryDraft}
              onChange={e => setSummaryDraft(e.target.value)}
              placeholder="Descripción funcional del concepto..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={() => setSummaryEditTarget(null)}
                className={BUTTON}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={updateSummaryMutation.isPending}
                onClick={() => updateSummaryMutation.mutate({
                  conceptCode: summaryEditTarget,
                  summary: summaryDraft.trim() || null,
                })}
                className={BUTTON_PRIMARY}
              >
                {updateSummaryMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </>
      )}

      {searchOpen && (
        <SearchPalette
          nodes={nodes.filter(n => !n.hidden)}
          onSelect={handleSearchSelect}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </div>
  )
}
