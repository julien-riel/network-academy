import { Link, useParams } from 'react-router-dom'
import { moduleById, questionById } from '../content'
import { ConceptChips, Empty, ProgressBar } from '../components/common'
import { QuizRunner } from '../components/QuizRunner'
import { moduleCompletion, useProgress } from '../engine/progress'
import { useMemo, useState } from 'react'
import { shuffle } from '../engine/recommend'

export default function ModulePage() {
  const { moduleId } = useParams()
  const m = moduleId ? moduleById.get(moduleId) : undefined
  const p = useProgress()
  const [quizOpen, setQuizOpen] = useState(false)
  const quizPool = useMemo(() => (m?.quiz ?? []).map((id) => questionById.get(id)).filter((q) => q != null), [m])
  // A new random order each time the quiz is opened.
  const [quiz, setQuiz] = useState(() => shuffle(quizPool))
  if (!m) return <Empty>Module introuvable.</Empty>
  const quizDone = p.results.find((r) => r.kind === 'module' && r.moduleId === m.id)
  const allLessonsDone = m.lessons.every((l) => p.lessonsDone[l.id])
  return (
    <div>
      <div className="page-head">
        <div>
          <div className="muted small">
            <Link to="/learn">Learn</Link> / Module {m.order}
          </div>
          <h1>{m.title}</h1>
          <p>{m.subtitle}</p>
        </div>
        <div style={{ width: 200 }}>
          <div className="small muted">Progression {Math.round(moduleCompletion(p, m.id) * 100)} %</div>
          <ProgressBar value={moduleCompletion(p, m.id)} />
        </div>
      </div>
      <div className="grid grid-2">
        <div className="stack">
          <h2>Leçons</h2>
          {m.lessons.map((l, i) => (
            <Link to={`/learn/${m.id}/${l.id}`} key={l.id} className="card clickable row between" style={{ color: 'inherit' }}>
              <span>
                <span className="muted" style={{ fontFamily: 'var(--mono)', marginRight: 10 }}>
                  {m.order}.{i + 1}
                </span>
                {l.title}
              </span>
              <span className="small muted">
                {l.minutes} min {p.lessonsDone[l.id] ? <span className="badge-ok">✓</span> : ''}
              </span>
            </Link>
          ))}
          <div className="card">
            <h3>Quiz de fin de module</h3>
            <p className="muted small">
              {quiz.length} questions. {quizDone ? `Dernier résultat : ${Math.round((quizDone.score / quizDone.total) * 100)} %.` : ''}
              {!allLessonsDone && ' Tu peux le faire maintenant, mais il est conseillé de terminer les leçons d’abord.'}
            </p>
            {!quizOpen ? (
              <button className="btn primary" onClick={() => { setQuiz(shuffle(quizPool)); setQuizOpen(true) }}>
                {quizDone ? 'Refaire le quiz' : 'Commencer le quiz'}
              </button>
            ) : (
              <QuizRunner questions={quiz} mode="session" kind="module" moduleId={m.id} title={m.title} />
            )}
          </div>
        </div>
        <div className="stack">
          <h2>Concepts du module</h2>
          <div className="card">
            <ConceptChips ids={m.concepts} />
          </div>
          {m.prerequisites.length > 0 && (
            <div className="card">
              <h3>Prérequis</h3>
              <div className="row">
                {m.prerequisites.map((pr) => {
                  const pm = moduleById.get(pr)
                  return pm ? (
                    <Link key={pr} to={`/learn/${pr}`} className="chip">
                      Module {pm.order} · {pm.title}
                    </Link>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
