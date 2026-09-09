import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge as RFEdge,
  type Node as RFNode,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CATEGORIES, categoryById, conceptById, concepts, RELATION_LABELS } from '../content'
import { ConceptFiche } from '../components/ConceptFiche'
import { ConceptChip } from '../components/common'
import { edges as graphEdges, findPath, neighbours } from '../engine/graph'
import { useProgress } from '../engine/progress'
import type { Category, Concept } from '../types/content'

type CNodeData = { concept: Concept; mastery: number; dim: boolean; hl: boolean }
type CNode = RFNode<CNodeData, 'concept'>

function ConceptNode({ data }: NodeProps<CNode>) {
  const color = categoryById.get(data.concept.category)?.color ?? '#64748b'
  return (
    <div className={'cnode' + (data.dim ? ' dim' : '') + (data.hl ? ' hl' : '')} style={{ background: color }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      {data.concept.name}
      <span className="m">
        <span style={{ width: `${Math.round(data.mastery * 100)}%` }} />
      </span>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  )
}
const nodeTypes = { concept: ConceptNode }

type Pos = { x: number; y: number }

/** Overview: one column per category, nodes ordered by difficulty then name. */
function layoutClusters(ids: Set<string>): Map<string, Pos> {
  const out = new Map<string, Pos>()
  const visibleCats = CATEGORIES.filter((c) => concepts.some((k) => k.category === c.id && ids.has(k.id)))
  visibleCats.forEach((cat, col) => {
    const list = concepts
      .filter((c) => c.category === cat.id && ids.has(c.id))
      .sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name))
    list.forEach((c, row) => out.set(c.id, { x: col * 250, y: row * 48 }))
  })
  return out
}

/** Focus: the selected concept at the centre, its neighbours on one or two rings. */
function layoutEgo(center: string, around: string[]): Map<string, Pos> {
  const out = new Map<string, Pos>([[center, { x: 0, y: 0 }]])
  const n = around.length
  const rings = n > 10 ? 2 : 1
  around.forEach((id, i) => {
    const ring = rings === 2 && i % 2 === 1 ? 2 : 1
    const r = ring === 1 ? Math.max(200, n * 22) : Math.max(200, n * 22) + 150
    const a = (i / n) * Math.PI * 2 - Math.PI / 2
    out.set(id, { x: Math.cos(a) * r, y: Math.sin(a) * r })
  })
  return out
}

/** Path A → B laid out on a line. */
function layoutPath(ids: string[]): Map<string, Pos> {
  const out = new Map<string, Pos>()
  ids.forEach((id, i) => out.set(id, { x: i * 240, y: (i % 2) * 70 }))
  return out
}

export default function ConceptMapPage() {
  return (
    <ReactFlowProvider>
      <ConceptMapInner />
    </ReactFlowProvider>
  )
}

function ConceptMapInner() {
  const { fitView } = useReactFlow()
  const [params, setParams] = useSearchParams()
  const p = useProgress()
  const [search, setSearch] = useState('')
  const [cats, setCats] = useState<Set<Category>>(new Set(CATEGORIES.map((c) => c.id)))
  const [pathMode, setPathMode] = useState(false)
  const [pathFrom, setPathFrom] = useState<string | null>(null)
  const [pathTo, setPathTo] = useState<string | null>(null)
  const selectedId = params.get('focus')
  const selected = selectedId ? conceptById.get(selectedId) : undefined

  useEffect(() => {
    if (selectedId && !cats.has(conceptById.get(selectedId)?.category as Category)) {
      setCats(new Set(CATEGORIES.map((c) => c.id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  const visibleIds = useMemo(() => new Set(concepts.filter((c) => cats.has(c.category)).map((c) => c.id)), [cats])
  const path = useMemo(() => (pathFrom && pathTo ? findPath(pathFrom, pathTo) : null), [pathFrom, pathTo])
  const pathIds = useMemo(() => path?.map((x) => x.concept.id) ?? [], [path])
  const neighbourIds = useMemo(() => (selected ? neighbours(selected.id).map((n) => n.concept.id) : []), [selected])
  const searchNorm = search.trim().toLowerCase()

  /** Which nodes are shown, and where. */
  const positions = useMemo(() => {
    if (path) return layoutPath(pathIds)
    if (selected) return layoutEgo(selected.id, neighbourIds)
    return layoutClusters(visibleIds)
  }, [path, pathIds, selected, neighbourIds, visibleIds])

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: path || selected ? 0.25 : 0.05, duration: 400, maxZoom: 1.2 }), 60)
    return () => clearTimeout(t)
  }, [positions, fitView, path, selected])

  const nodes: CNode[] = useMemo(
    () =>
      concepts
        .filter((c) => positions.has(c.id))
        .map((c) => {
          const matchesSearch = !searchNorm || c.name.toLowerCase().includes(searchNorm) || c.aliases.some((a) => a.toLowerCase().includes(searchNorm))
          const hl = (selected && c.id === selected.id) || (!!path && pathIds.includes(c.id)) || (!!searchNorm && matchesSearch && !selected && !path)
          return {
            id: c.id,
            type: 'concept',
            position: positions.get(c.id)!,
            data: { concept: c, mastery: p.concepts[c.id]?.mastery ?? 0, dim: !matchesSearch && !selected && !path, hl },
          }
        }),
    [positions, searchNorm, selected, path, pathIds, p],
  )

  const rfEdges: RFEdge[] = useMemo(() => {
    const mk = (id: string, source: string, target: string, label: string | undefined, active: boolean, animated = false): RFEdge => ({
      id,
      source,
      target,
      type: selected || path ? 'straight' : 'default',
      label,
      labelStyle: { fontSize: 10, fill: '#475569' },
      labelBgStyle: { fill: '#fff' },
      style: { stroke: active ? '#0f172a' : '#cbd5e1', strokeWidth: active ? 1.6 : 1, opacity: active ? 1 : 0.6 },
      animated,
    })
    if (path) {
      return path.slice(1).map((hop, i) => mk(`p-${i}`, path[i].concept.id, hop.concept.id, hop.via?.label, true, true))
    }
    if (selected) {
      // one edge per neighbour, always drawn from the centre
      return neighbours(selected.id).map(({ concept: n, edge }) => mk(`e-${n.id}`, selected.id, n.id, edge.label, true))
    }
    return graphEdges
      .filter((e) => positions.has(e.from) && positions.has(e.to))
      .map((e) => mk(`${e.from}-${e.to}-${e.type}`, e.from, e.to, undefined, false))
  }, [positions, selected, path])

  const onNodeClick = (id: string) => {
    if (pathMode) {
      if (!pathFrom || (pathFrom && pathTo)) {
        setPathFrom(id)
        setPathTo(null)
      } else setPathTo(id)
      return
    }
    setParams(id === selectedId ? {} : { focus: id })
  }

  const toggleCat = (id: Category) =>
    setCats((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div>
          <h1>Concept Map</h1>
          <p>
            Vue d’ensemble par catégorie. Clique un nœud pour le placer au centre avec ses voisins et ouvrir sa fiche. Les relations ont un sens : uses, runs-over,
            authenticates-with, assigns, controls, depends-on… La barre blanche sous chaque nom est ta maîtrise.
          </p>
        </div>
      </div>
      <div className="map-toolbar">
        <input className="map-search" placeholder="Rechercher un concept…" value={search} onChange={(e) => setSearch(e.target.value)} />
        {CATEGORIES.map((c) => (
          <label key={c.id}>
            <input type="checkbox" checked={cats.has(c.id)} onChange={() => toggleCat(c.id)} />
            <span className="dot" style={{ width: 10, height: 10, borderRadius: 5, background: c.color, display: 'inline-block' }} />
            {c.label}
          </label>
        ))}
        <button
          className={'btn small' + (pathMode ? ' primary' : '')}
          onClick={() => {
            setPathMode(!pathMode)
            setPathFrom(null)
            setPathTo(null)
            setParams({})
          }}
        >
          Comment A est relié à B ?
        </button>
      </div>
      <div className="map-wrap">
        <div className="map-canvas">
          <ReactFlow
            nodes={nodes}
            edges={rfEdges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.15}
            nodesDraggable={false}
            nodesConnectable={false}
            onNodeClick={(_, n) => onNodeClick(n.id)}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={24} color="#e2e8f0" />
            <Controls showInteractive={false} />
            {!selected && !path && <MiniMap pannable zoomable nodeColor={(n) => categoryById.get((n as CNode).data.concept.category)?.color ?? '#999'} />}
          </ReactFlow>
        </div>
        <div className="map-side stack">
          {pathMode && (
            <div className="card">
              <h3>Comment A est relié à B ?</h3>
              <div className="small muted" style={{ marginBottom: 8 }}>
                {!pathFrom ? 'Clique un premier concept (A).' : !pathTo ? `A = ${conceptById.get(pathFrom)?.name}. Clique un second concept (B).` : ''}
              </div>
              <div className="row" style={{ marginBottom: 8 }}>
                <select value={pathFrom ?? ''} onChange={(e) => setPathFrom(e.target.value || null)} style={{ font: 'inherit', padding: 6 }}>
                  <option value="">A…</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span>→</span>
                <select value={pathTo ?? ''} onChange={(e) => setPathTo(e.target.value || null)} style={{ font: 'inherit', padding: 6 }}>
                  <option value="">B…</option>
                  {concepts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              {pathFrom && pathTo && !path && <div className="muted">Aucun chemin trouvé entre ces deux concepts.</div>}
              {path && (
                <div className="chain">
                  {path.map((hop, i) => (
                    <div key={hop.concept.id} style={{ display: 'contents' }}>
                      {i > 0 && hop.via && <span className="via">↓ {hop.via.label}</span>}
                      <Link to={`/concepts/${hop.concept.id}`} className="hop">
                        {hop.concept.name}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {selected && !pathMode ? (
            <div className="card">
              <div className="row between">
                <h2 style={{ margin: 0 }}>{selected.name}</h2>
                <button className="btn ghost small" onClick={() => setParams({})}>
                  ✕
                </button>
              </div>
              <ConceptFiche concept={selected} compact />
              <h4 className="muted small" style={{ marginTop: 10, textTransform: 'uppercase' }}>
                Voisins
              </h4>
              <div className="stack" style={{ gap: 4 }}>
                {neighbours(selected.id).map(({ concept: n, edge }) => (
                  <div key={n.id} className="row small">
                    <span className="muted" style={{ minWidth: 120 }}>
                      {edge.label}
                    </span>
                    <button className="btn ghost small" onClick={() => setParams({ focus: n.id })}>
                      {n.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !pathMode && (
              <div className="card">
                <h3>Légende des relations</h3>
                <div className="stack small" style={{ gap: 2 }}>
                  {Object.entries(RELATION_LABELS).map(([k, v]) => (
                    <div key={k} className="row between">
                      <code>{k}</code>
                      <span className="muted">{v}</span>
                    </div>
                  ))}
                </div>
                <h3 style={{ marginTop: 14 }}>Exemples</h3>
                <div className="row">
                  {['radius', 'dhcp', 'vlan', 'ucentral', 'control-plane'].filter((id) => conceptById.has(id)).map((id) => (
                    <ConceptChip key={id} id={id} />
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
