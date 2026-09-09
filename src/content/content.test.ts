import { describe, expect, it } from 'vitest'
import { conceptById, concepts, journeys, modules, questionById, questions, references, scenarios } from './index'

/** Content integrity: every reference between content entities must resolve. */
describe('content integrity', () => {
  it('has unique concept ids', () => {
    expect(new Set(concepts.map((c) => c.id)).size).toBe(concepts.length)
  })

  it('has unique question ids', () => {
    expect(new Set(questions.map((q) => q.id)).size).toBe(questions.length)
  })

  it('concept relations and prerequisites point to known concepts', () => {
    for (const c of concepts) {
      for (const r of c.relatedConcepts) expect(conceptById.has(r.conceptId), `${c.id} → ${r.conceptId}`).toBe(true)
      for (const p of c.prerequisites) expect(conceptById.has(p), `${c.id} prereq ${p}`).toBe(true)
    }
  })

  it('every concept answers the six questions at least minimally', () => {
    for (const c of concepts) {
      expect(c.shortDefinition.length, c.id).toBeGreaterThan(10)
      expect(c.explanation.length, c.id).toBeGreaterThan(20)
      expect(c.relatedConcepts.length, `${c.id} has no relations`).toBeGreaterThan(0)
    }
  })

  it('questions reference known concepts and are well-formed', () => {
    for (const q of questions) {
      expect(q.concepts.length, q.id).toBeGreaterThan(0)
      for (const c of q.concepts) expect(conceptById.has(c), `${q.id} → ${c}`).toBe(true)
      if (q.type === 'multiple-choice' || q.type === 'troubleshooting') {
        expect(q.answer, q.id).toBeGreaterThanOrEqual(0)
        expect(q.answer, q.id).toBeLessThan(q.choices.length)
      }
      if (q.type === 'ordering') expect(q.items.length, q.id).toBeGreaterThan(2)
      if (q.type === 'matching') expect(new Set(q.pairs.map((p) => p.right)).size, q.id).toBe(q.pairs.length)
      if (q.type === 'free-response') expect(q.expected.length, q.id).toBeGreaterThan(0)
    }
  })

  it('modules reference known lessons, questions and concepts', () => {
    for (const m of modules) {
      for (const id of m.quiz) expect(questionById.has(id), `${m.id} quiz ${id}`).toBe(true)
      for (const c of m.concepts) expect(conceptById.has(c), `${m.id} concept ${c}`).toBe(true)
      for (const p of m.prerequisites) expect(modules.some((x) => x.id === p), `${m.id} prereq ${p}`).toBe(true)
      for (const l of m.lessons) {
        for (const b of l.blocks) {
          if (b.type === 'exercise') for (const id of b.questionIds) expect(questionById.has(id), `${l.id} exercise ${id}`).toBe(true)
          if (b.type === 'concepts') for (const c of b.ids) expect(conceptById.has(c), `${l.id} concept ${c}`).toBe(true)
        }
      }
    }
  })

  it('scenarios have exactly one correct choice per step', () => {
    for (const s of scenarios) {
      for (const c of s.concepts) expect(conceptById.has(c), `${s.id} → ${c}`).toBe(true)
      for (const st of s.steps) expect(st.choices.filter((c) => c.correct).length, `${s.id}: ${st.prompt}`).toBe(1)
    }
  })

  it('journeys and references point to known concepts', () => {
    for (const j of journeys) for (const st of j.steps) for (const c of st.concepts) expect(conceptById.has(c), `${j.id}#${st.n} → ${c}`).toBe(true)
    for (const r of references) for (const c of r.concepts) expect(conceptById.has(c), `${r.id} → ${c}`).toBe(true)
  })

  it('does not give away the answer by position or length', () => {
    const mc = questions.filter((q) => q.type === 'multiple-choice' || q.type === 'troubleshooting')
    const atZero = mc.filter((q) => (q as { answer: number }).answer === 0).length
    expect(atZero / mc.length, 'too many answers at index 0').toBeLessThan(0.5)
    const ratio = (good: number, others: number[]) => good / (others.reduce((a, b) => a + b, 0) / others.length)
    for (const q of mc) {
      const a = (q as { answer: number }).answer
      const c = (q as { choices: string[] }).choices
      const r = ratio(c[a].length, c.filter((_, i) => i !== a).map((x) => x.length))
      expect(r, `${q.id}: correct answer is ${r.toFixed(1)}x the length of distractors`).toBeLessThan(1.5)
      expect(r, `${q.id}: correct answer is much shorter than distractors`).toBeGreaterThan(0.5)
    }
    for (const s of scenarios) {
      for (const st of s.steps) {
        const ci = st.choices.findIndex((x) => x.correct)
        const r = ratio(st.choices[ci].label.length, st.choices.filter((_, i) => i !== ci).map((x) => x.label.length))
        expect(r, `${s.id} "${st.prompt}": ${r.toFixed(1)}x`).toBeLessThan(1.5)
        expect(r, `${s.id} "${st.prompt}": too short`).toBeGreaterThan(0.5)
      }
    }
  })

  it('meets the MVP volume targets', () => {
    expect(concepts.length).toBeGreaterThanOrEqual(50)
    expect(modules.length).toBe(8)
    expect(questions.length).toBeGreaterThanOrEqual(100)
    expect(scenarios.length).toBeGreaterThanOrEqual(10)
  })
})
