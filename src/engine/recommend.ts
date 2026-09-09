import { conceptById, modules, questions, scenarios } from '../content'
import type { Module, Question, Scenario } from '../types/content'
import { ancestors } from './graph'
import { fragileConcepts, moduleCompletion, type ProgressState } from './progress'

export interface Recommendation {
  kind: 'diagnostic' | 'module' | 'review' | 'lab' | 'exam'
  title: string
  reason: string
  to: string
}

/** Next recommended session (15–20 min). */
export function recommendNext(p: ProgressState): Recommendation[] {
  const out: Recommendation[] = []
  if (!p.diagnosticDone) {
    out.push({
      kind: 'diagnostic',
      title: 'Diagnostic initial (30 questions)',
      reason: 'Aucun enseignement préalable : on mesure d’abord ce que tu sais déjà pour adapter le parcours.',
      to: '/tests/diagnostic',
    })
  }

  const fragile = fragileConcepts(p)
  if (fragile.length >= 3) {
    const names = fragile.slice(0, 3).map((c) => c.name).join(', ')
    out.push({
      kind: 'review',
      title: 'Session de révision ciblée',
      reason: `Concepts fragiles : ${names}. Une erreur augmente la priorité de révision du concept et de ses parents.`,
      to: '/tests/practice?mode=weak',
    })
  }

  const nextModule = pickNextModule(p)
  if (nextModule) {
    out.push({
      kind: 'module',
      title: `Module ${nextModule.order} — ${nextModule.title}`,
      reason: nextModule.subtitle,
      to: `/learn/${nextModule.id}`,
    })
  }

  const nextLab = scenarios.find((s) => !p.labsDone[s.id])
  if (nextLab && Object.keys(p.lessonsDone).length >= 3) {
    out.push({
      kind: 'lab',
      title: `Lab — ${nextLab.title}`,
      reason: 'Mesurer ta capacité à localiser un problème dans la chaîne, pas à réciter des définitions.',
      to: `/labs/${nextLab.id}`,
    })
  }

  if (!nextModule && !p.results.some((r) => r.kind === 'exam')) {
    out.push({
      kind: 'exam',
      title: 'Examen final (50 questions)',
      reason: 'Tous les modules sont terminés.',
      to: '/tests/exam',
    })
  }
  return out
}

export function pickNextModule(p: ProgressState): Module | undefined {
  // first module that is not complete and whose prerequisites are mostly done
  for (const m of modules) {
    if (moduleCompletion(p, m.id) >= 1) continue
    const prereqOk = m.prerequisites.every((pr) => moduleCompletion(p, pr) >= 0.5)
    if (prereqOk) return m
  }
  return modules.find((m) => moduleCompletion(p, m.id) < 1)
}

/** Concepts to review: fragile concepts plus their parents. */
export function reviewTargets(p: ProgressState): string[] {
  const set = new Set<string>()
  for (const c of fragileConcepts(p)) {
    set.add(c.id)
    for (const a of ancestors(c.id, 1)) if (conceptById.has(a)) set.add(a)
  }
  return [...set]
}

export function shuffle<T>(arr: T[], seed?: number): T[] {
  const a = [...arr]
  let s = seed ?? Math.floor(Math.random() * 1e9)
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Picks up to `n` questions, favouring the given concepts and low mastery. */
export function pickQuestions(p: ProgressState, conceptIds: string[] | null, n: number, exclude: string[] = []): Question[] {
  const excluded = new Set(exclude)
  let pool = questions.filter((q) => !excluded.has(q.id))
  if (conceptIds && conceptIds.length) {
    const set = new Set(conceptIds)
    const focused = pool.filter((q) => q.concepts.some((c) => set.has(c)))
    if (focused.length >= Math.min(n, 4)) pool = focused
  }
  const scored = pool.map((q) => {
    const mastery = q.concepts.reduce((acc, c) => acc + (p.concepts[c]?.mastery ?? 0), 0) / Math.max(1, q.concepts.length)
    const priority = q.concepts.reduce((acc, c) => acc + (p.concepts[c]?.reviewPriority ?? 0), 0)
    return { q, weight: 1 - mastery + priority * 0.2 + Math.random() * 0.6 }
  })
  scored.sort((a, b) => b.weight - a.weight)
  return scored.slice(0, n).map((s) => s.q)
}

export function nextScenario(p: ProgressState): Scenario | undefined {
  return scenarios.find((s) => !p.labsDone[s.id])
}
