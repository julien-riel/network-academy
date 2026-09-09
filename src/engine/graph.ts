import { conceptById, concepts, RELATION_LABELS } from '../content'
import type { Concept, RelationType } from '../types/content'

export interface Edge {
  from: string
  to: string
  type: RelationType
  label: string
}

/** All edges of the concept graph (explicit relations + prerequisites). */
export function buildEdges(): Edge[] {
  const edges: Edge[] = []
  const seen = new Set<string>()
  for (const c of concepts) {
    for (const r of c.relatedConcepts) {
      if (!conceptById.has(r.conceptId)) continue
      const key = `${c.id}>${r.conceptId}>${r.type}`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ from: c.id, to: r.conceptId, type: r.type, label: r.label ?? RELATION_LABELS[r.type] })
    }
    for (const p of c.prerequisites) {
      if (!conceptById.has(p)) continue
      const key = `${c.id}>${p}>depends-on`
      if (seen.has(key)) continue
      seen.add(key)
      edges.push({ from: c.id, to: p, type: 'depends-on', label: RELATION_LABELS['depends-on'] })
    }
  }
  return edges
}

export const edges = buildEdges()

const adjacency = new Map<string, Edge[]>()
for (const e of edges) {
  if (!adjacency.has(e.from)) adjacency.set(e.from, [])
  if (!adjacency.has(e.to)) adjacency.set(e.to, [])
  adjacency.get(e.from)!.push(e)
  // undirected traversal for "how is A related to B"
  adjacency.get(e.to)!.push({ from: e.to, to: e.from, type: e.type, label: `← ${e.label}` })
}

export function neighbours(id: string): { concept: Concept; edge: Edge }[] {
  const out: { concept: Concept; edge: Edge }[] = []
  const seen = new Set<string>()
  for (const e of adjacency.get(id) ?? []) {
    const other = conceptById.get(e.to)
    if (!other || seen.has(other.id)) continue
    seen.add(other.id)
    out.push({ concept: other, edge: e })
  }
  return out
}

/** Generic hub concepts: paths through them are less informative, so they cost more. */
const HUBS = new Set(['udp', 'tcp', 'ip', 'osi-model', 'frame', 'mac-address', 'ethernet', 'broadcast'])

function edgeCost(e: Edge): number {
  let cost = e.type === 'related' ? 2 : 1
  if (HUBS.has(e.to) || HUBS.has(e.from)) cost += 2
  return cost
}

/** Cheapest path between two concepts (Dijkstra), with the relation labels along the way. */
export function findPath(a: string, b: string): { concept: Concept; via?: Edge }[] | null {
  if (!conceptById.has(a) || !conceptById.has(b)) return null
  if (a === b) return [{ concept: conceptById.get(a)! }]
  const dist = new Map<string, number>([[a, 0]])
  const prev = new Map<string, Edge>()
  const done = new Set<string>()
  while (true) {
    let cur: string | null = null
    let best = Infinity
    for (const [id, d] of dist) {
      if (!done.has(id) && d < best) {
        best = d
        cur = id
      }
    }
    if (cur === null) return null
    if (cur === b) break
    done.add(cur)
    for (const e of adjacency.get(cur) ?? []) {
      const nd = best + edgeCost(e)
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd)
        prev.set(e.to, e)
      }
    }
  }
  const path: { concept: Concept; via?: Edge }[] = []
  let node = b
  while (node !== a) {
    const edge = prev.get(node)!
    path.unshift({ concept: conceptById.get(node)!, via: edge })
    node = edge.from
  }
  path.unshift({ concept: conceptById.get(a)! })
  return path
}

/** Parent concepts (prerequisites, transitively) — used to widen recommendations. */
export function ancestors(id: string, depth = 2): string[] {
  const out = new Set<string>()
  let frontier = [id]
  for (let i = 0; i < depth; i++) {
    const next: string[] = []
    for (const f of frontier) {
      for (const p of conceptById.get(f)?.prerequisites ?? []) {
        if (!out.has(p)) {
          out.add(p)
          next.push(p)
        }
      }
    }
    frontier = next
  }
  return [...out]
}
