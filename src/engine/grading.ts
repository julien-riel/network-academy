import type { FreeResponseQuestion, Question } from '../types/content'

export type Answer =
  | { type: 'multiple-choice' | 'troubleshooting'; choice: number | null }
  | { type: 'ordering'; order: string[] }
  | { type: 'matching'; mapping: Record<string, string> }
  | { type: 'layer'; placement: Record<string, number | null> }
  | { type: 'free-response'; text: string }

export interface Grade {
  correct: boolean
  /** 0..1 partial credit. */
  score: number
  details?: string[]
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9./-]+/g, ' ')
    .trim()
}

export function gradeFreeResponse(q: FreeResponseQuestion, text: string): Grade {
  const norm = ' ' + normalize(text) + ' '
  const details: string[] = []
  let found = 0
  for (const e of q.expected) {
    const hit = e.keywords.some((k) => norm.includes(normalize(k)))
    if (hit) found++
    details.push(`${hit ? '✓' : '△'} ${e.label}`)
  }
  const score = q.expected.length ? found / q.expected.length : 0
  return { correct: score >= 0.6, score, details }
}

export function grade(q: Question, a: Answer | undefined): Grade {
  if (!a) return { correct: false, score: 0 }
  switch (q.type) {
    case 'multiple-choice':
    case 'troubleshooting': {
      if (a.type !== 'multiple-choice' && a.type !== 'troubleshooting') return { correct: false, score: 0 }
      const ok = a.choice === q.answer
      return { correct: ok, score: ok ? 1 : 0 }
    }
    case 'ordering': {
      if (a.type !== 'ordering') return { correct: false, score: 0 }
      let good = 0
      q.items.forEach((item, i) => {
        if (a.order[i] === item) good++
      })
      const score = good / q.items.length
      return { correct: score === 1, score }
    }
    case 'matching': {
      if (a.type !== 'matching') return { correct: false, score: 0 }
      let good = 0
      for (const p of q.pairs) if (a.mapping[p.left] === p.right) good++
      const score = good / q.pairs.length
      return { correct: score === 1, score }
    }
    case 'layer': {
      if (a.type !== 'layer') return { correct: false, score: 0 }
      let good = 0
      for (const it of q.items) {
        const placed = a.placement[it.label]
        if (placed != null && it.layers.includes(placed)) good++
      }
      const score = good / q.items.length
      return { correct: score === 1, score }
    }
    case 'free-response': {
      if (a.type !== 'free-response') return { correct: false, score: 0 }
      return gradeFreeResponse(q, a.text)
    }
  }
}

export function isAnswered(a: Answer | undefined): boolean {
  if (!a) return false
  switch (a.type) {
    case 'multiple-choice':
    case 'troubleshooting':
      return a.choice != null
    case 'ordering':
      return a.order.length > 0
    case 'matching':
      return Object.keys(a.mapping).length > 0
    case 'layer':
      return Object.values(a.placement).some((v) => v != null)
    case 'free-response':
      return a.text.trim().length > 0
  }
}
