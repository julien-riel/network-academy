import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DOMAINS } from '../content'
import { grade as gradeAnswer, isAnswered, type Answer, type Grade } from '../engine/grading'
import { recordAnswer, recordResult, type QuizResult } from '../engine/progress'
import type { Domain, Question } from '../types/content'
import { ConceptChips } from './common'
import { QuestionView } from './QuestionView'
import { scoreBand } from './quizUtils'

export type QuizMode = 'inline' | 'session' | 'exam'

interface Props {
  questions: Question[]
  mode: QuizMode
  kind?: QuizResult['kind']
  moduleId?: string
  title?: string
  onFinish?: (result: QuizResult, grades: Record<string, Grade>) => void
}

/**
 * Quiz engine.
 * - inline: every question shown with its own "Vérifier" button (lessons).
 * - session: one question at a time, immediate feedback (practice / module quiz).
 * - exam: one at a time, feedback only at the end (diagnostic / final exam).
 */
export function QuizRunner({ questions, mode, kind = 'practice', moduleId, title, onFinish }: Props) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [grades, setGrades] = useState<Record<string, Grade>>({})
  const [index, setIndex] = useState(0)
  const [finished, setFinished] = useState(false)

  const setAnswer = (q: Question, a: Answer) => setAnswers((prev) => ({ ...prev, [q.id]: a }))

  const check = (q: Question): Grade => {
    if (grades[q.id]) return grades[q.id]
    const g = gradeAnswer(q, answers[q.id])
    setGrades((prev) => ({ ...prev, [q.id]: g }))
    recordAnswer(q.concepts, g.correct, g.correct ? 1 : g.score > 0.5 ? 0.5 : 1)
    return g
  }

  const finish = (allGrades: Record<string, Grade>) => {
    const byDomain: Partial<Record<Domain, { score: number; total: number }>> = {}
    let score = 0
    for (const q of questions) {
      const g = allGrades[q.id]
      const s = g?.score ?? 0
      score += s
      const d = byDomain[q.domain] ?? { score: 0, total: 0 }
      d.score += s
      d.total += 1
      byDomain[q.domain] = d
    }
    const result: QuizResult = {
      id: `${kind}-${Date.now()}`,
      kind,
      moduleId,
      date: Date.now(),
      score,
      total: questions.length,
      byDomain,
    }
    if (mode !== 'inline') recordResult(result)
    setFinished(true)
    onFinish?.(result, allGrades)
  }

  if (questions.length === 0) return <div className="muted">Aucune question disponible.</div>

  if (mode === 'inline') {
    return (
      <div className="stack">
        {questions.map((q) => (
          <div key={q.id} className="card">
            <QuestionView question={q} answer={answers[q.id]} onChange={(a) => setAnswer(q, a)} revealed={!!grades[q.id]} grade={grades[q.id]} />
            {!grades[q.id] && (
              <button className="btn primary" style={{ marginTop: 10 }} disabled={!isAnswered(answers[q.id])} onClick={() => check(q)}>
                Vérifier
              </button>
            )}
          </div>
        ))}
      </div>
    )
  }

  if (finished) return <Summary questions={questions} grades={grades} answers={answers} kind={kind} />

  const q = questions[index]
  const revealed = mode === 'session' && !!grades[q.id]
  const last = index === questions.length - 1

  const next = () => {
    let all = grades
    if (mode === 'exam') {
      const g = gradeAnswer(q, answers[q.id])
      all = { ...grades, [q.id]: g }
      setGrades(all)
      recordAnswer(q.concepts, g.correct, g.correct ? 0.7 : g.score > 0.5 ? 0.4 : 0.7)
    }
    if (last) finish(all)
    else setIndex(index + 1)
  }

  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          {title && <strong>{title}</strong>}
          <span className="muted small" style={{ marginLeft: 8 }}>
            Question {index + 1} / {questions.length}
          </span>
        </div>
        <div className="progress-dots">
          {questions.map((qq, i) => {
            const g = grades[qq.id]
            let cls = ''
            if (i === index) cls = 'current'
            else if (g && mode === 'session') cls = g.correct ? 'ok' : 'bad'
            else if (i < index) cls = 'done'
            return <span key={qq.id} className={cls} />
          })}
        </div>
      </div>
      <QuestionView question={q} answer={answers[q.id]} onChange={(a) => setAnswer(q, a)} revealed={revealed} grade={grades[q.id]} />
      <div className="row" style={{ marginTop: 14 }}>
        {mode === 'session' && !revealed && (
          <button className="btn primary" disabled={!isAnswered(answers[q.id])} onClick={() => check(q)}>
            Vérifier
          </button>
        )}
        {(mode === 'exam' || revealed) && (
          <button className="btn primary" disabled={mode === 'exam' && !isAnswered(answers[q.id])} onClick={next}>
            {last ? 'Terminer' : 'Suivant →'}
          </button>
        )}
        {mode === 'exam' && (
          <button className="btn ghost" onClick={next}>
            Passer
          </button>
        )}
      </div>
    </div>
  )
}

function Summary({ questions, grades, answers, kind }: { questions: Question[]; grades: Record<string, Grade>; answers: Record<string, Answer>; kind: QuizResult['kind'] }) {
  const total = questions.length
  const score = questions.reduce((acc, q) => acc + (grades[q.id]?.score ?? 0), 0)
  const pct = Math.round((score / total) * 100)
  const byDomain = DOMAINS.map((d) => {
    const qs = questions.filter((q) => q.domain === d.id)
    const s = qs.reduce((acc, q) => acc + (grades[q.id]?.score ?? 0), 0)
    return { ...d, score: s, total: qs.length }
  }).filter((d) => d.total > 0)
  const strong = new Set<string>()
  const weak = new Set<string>()
  for (const q of questions) {
    const g = grades[q.id]
    for (const c of q.concepts) (g?.correct ? strong : weak).add(c)
  }
  for (const w of weak) strong.delete(w)
  const [reviewOpen, setReviewOpen] = useState(false)

  return (
    <div className="stack">
      <div className="card">
        <div className="row between">
          <div>
            <div className="bigscore">{pct} %</div>
            <div className="muted">
              {score.toFixed(1)} / {total} · {scoreBand(pct)}
            </div>
          </div>
          {kind === 'exam' && (
            <div className="band">
              {[
                ['< 60 %', 'Needs review'],
                ['60–75 %', 'Functional'],
                ['75–85 %', 'Job ready'],
                ['85–95 %', 'Strong'],
                ['> 95 %', 'Excellent'],
              ].map(([r, l]) => (
                <div key={l} style={{ display: 'contents' }}>
                  <span className={scoreBand(pct) === l ? 'on' : 'muted'}>{r}</span>
                  <span className={scoreBand(pct) === l ? 'on' : ''}>{l}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <h3 style={{ marginTop: 16 }}>Détail par domaine</h3>
        {byDomain.map((d) => (
          <div className="score-row" key={d.id}>
            <span>{d.label}</span>
            <div className="bar">
              <span style={{ width: `${(d.score / d.total) * 100}%` }} />
            </div>
            <span className="val">{Math.round((d.score / d.total) * 100)} %</span>
          </div>
        ))}
      </div>
      <div className="grid grid-2">
        <div className="card">
          <h3>Tu sembles maîtriser</h3>
          {strong.size ? <ConceptChips ids={[...strong]} /> : <span className="muted">—</span>}
        </div>
        <div className="card">
          <h3>À renforcer</h3>
          {weak.size ? <ConceptChips ids={[...weak]} /> : <span className="muted">Rien de particulier. Bravo.</span>}
        </div>
      </div>
      <div className="row">
        <Link to="/" className="btn primary">
          Retour au dashboard
        </Link>
        <Link to="/tests" className="btn">
          Autres tests
        </Link>
        <button className="btn ghost" onClick={() => setReviewOpen(!reviewOpen)}>
          {reviewOpen ? 'Masquer la correction' : 'Voir la correction'}
        </button>
      </div>
      {reviewOpen && (
        <div className="stack">
          {questions.map((q) => (
            <div className="card" key={q.id}>
              <QuestionView question={q} answer={answers[q.id]} onChange={() => {}} revealed grade={grades[q.id] ?? { correct: false, score: 0 }} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
