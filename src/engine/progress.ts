import { useSyncExternalStore } from 'react'
import { conceptById, concepts, conceptsByDomain, DOMAINS, modules } from '../content'
import type { Domain } from '../types/content'
import { ancestors } from './graph'

/**
 * Learning state persisted in localStorage.
 * Every concept has a mastery score in [0, 1].
 */
export interface ConceptState {
  mastery: number
  attempts: number
  correct: number
  lastSeen: number
  /** Higher = review sooner. */
  reviewPriority: number
}

export interface QuizResult {
  id: string
  kind: 'diagnostic' | 'module' | 'practice' | 'exam' | 'interview'
  moduleId?: string
  date: number
  score: number
  total: number
  byDomain: Partial<Record<Domain, { score: number; total: number }>>
}

export interface ProgressState {
  version: 1
  concepts: Record<string, ConceptState>
  lessonsDone: Record<string, number>
  labsDone: Record<string, { date: number; score: number; total: number }>
  journeysViewed: Record<string, number>
  results: QuizResult[]
  diagnosticDone: boolean
}

const KEY = 'network-academy.progress.v1'

function emptyState(): ProgressState {
  return {
    version: 1,
    concepts: {},
    lessonsDone: {},
    labsDone: {},
    journeysViewed: {},
    results: [],
    diagnosticDone: false,
  }
}

function read(): ProgressState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as ProgressState
    if (parsed.version !== 1) return emptyState()
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

let state: ProgressState = read()
const listeners = new Set<() => void>()

function write(next: ProgressState) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l())
}

export function getProgress(): ProgressState {
  return state
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

export function resetProgress() {
  write(emptyState())
}

export function conceptState(id: string): ConceptState {
  return state.concepts[id] ?? { mastery: 0, attempts: 0, correct: 0, lastSeen: 0, reviewPriority: 0 }
}

/** Mastery update: a correct answer moves 30 % toward 1, an error removes 20 % and raises review priority. */
export function recordAnswer(conceptIds: string[], correct: boolean, weight = 1) {
  const next = { ...state, concepts: { ...state.concepts } }
  const now = Date.now()
  for (const id of conceptIds) {
    if (!conceptById.has(id)) continue
    const cur = next.concepts[id] ?? { mastery: 0, attempts: 0, correct: 0, lastSeen: 0, reviewPriority: 0 }
    const mastery = correct
      ? cur.mastery + (1 - cur.mastery) * 0.3 * weight
      : cur.mastery - cur.mastery * 0.2 * weight
    next.concepts[id] = {
      mastery: Math.max(0, Math.min(1, mastery)),
      attempts: cur.attempts + 1,
      correct: cur.correct + (correct ? 1 : 0),
      lastSeen: now,
      reviewPriority: correct ? Math.max(0, cur.reviewPriority - 1) : cur.reviewPriority + 2,
    }
    if (!correct) {
      // an error on a child raises the priority of its parents slightly
      for (const p of ancestors(id, 1)) {
        const ps = next.concepts[p] ?? { mastery: 0, attempts: 0, correct: 0, lastSeen: 0, reviewPriority: 0 }
        next.concepts[p] = { ...ps, reviewPriority: ps.reviewPriority + 1 }
      }
    }
  }
  write(next)
}

/** Reading a lesson gives a small exposure credit to its concepts (capped at 0.35). */
export function recordLessonDone(lessonId: string, conceptIds: string[]) {
  const next = { ...state, concepts: { ...state.concepts }, lessonsDone: { ...state.lessonsDone } }
  const now = Date.now()
  next.lessonsDone[lessonId] = now
  for (const id of conceptIds) {
    const cur = next.concepts[id] ?? { mastery: 0, attempts: 0, correct: 0, lastSeen: 0, reviewPriority: 0 }
    next.concepts[id] = { ...cur, mastery: Math.max(cur.mastery, Math.min(0.35, cur.mastery + 0.2)), lastSeen: now }
  }
  write(next)
}

export function recordLabDone(labId: string, score: number, total: number) {
  write({ ...state, labsDone: { ...state.labsDone, [labId]: { date: Date.now(), score, total } } })
}

export function recordJourneyViewed(journeyId: string) {
  write({ ...state, journeysViewed: { ...state.journeysViewed, [journeyId]: Date.now() } })
}

export function recordResult(result: QuizResult) {
  write({
    ...state,
    results: [...state.results, result],
    diagnosticDone: state.diagnosticDone || result.kind === 'diagnostic',
  })
}

/* ---------- Derived metrics ---------- */

export function domainScore(p: ProgressState, domain: Domain): number {
  const list = conceptsByDomain[domain]
  if (!list.length) return 0
  const sum = list.reduce((acc, c) => acc + (p.concepts[c.id]?.mastery ?? 0), 0)
  return sum / list.length
}

export function globalScore(p: ProgressState): number {
  return DOMAINS.reduce((acc, d) => acc + domainScore(p, d.id), 0) / DOMAINS.length
}

export function levelLabel(score: number): string {
  if (score < 0.2) return 'Débutant'
  if (score < 0.45) return 'En progression'
  if (score < 0.65) return 'Fonctionnel'
  if (score < 0.85) return 'Job ready'
  return 'Solide'
}

export function masteredConcepts(p: ProgressState) {
  return concepts.filter((c) => (p.concepts[c.id]?.mastery ?? 0) >= 0.75)
}

/** Concepts seen at least once that remain weak, sorted by review priority. */
export function fragileConcepts(p: ProgressState) {
  return concepts
    .filter((c) => {
      const s = p.concepts[c.id]
      return s && s.attempts > 0 && s.mastery < 0.5
    })
    .sort((a, b) => {
      const sa = p.concepts[a.id]
      const sb = p.concepts[b.id]
      return sb.reviewPriority - sa.reviewPriority || sa.mastery - sb.mastery
    })
}

export function moduleCompletion(p: ProgressState, moduleId: string): number {
  const m = modules.find((x) => x.id === moduleId)
  if (!m) return 0
  const lessons = m.lessons.length
  const done = m.lessons.filter((l) => p.lessonsDone[l.id]).length
  const quizDone = p.results.some((r) => r.kind === 'module' && r.moduleId === moduleId) ? 1 : 0
  return (done + quizDone) / (lessons + 1)
}
