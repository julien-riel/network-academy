import { Link, useParams } from 'react-router-dom'
import { conceptById, modulesForConcept, questionsForConcepts } from '../content'
import { ConceptFiche } from '../components/ConceptFiche'
import { Empty, ProgressBar } from '../components/common'
import { QuizRunner } from '../components/QuizRunner'
import { useProgress } from '../engine/progress'
import { shuffle } from '../engine/recommend'
import { useMemo, useState } from 'react'

export default function ConceptPage() {
  const { conceptId } = useParams()
  const c = conceptId ? conceptById.get(conceptId) : undefined
  const p = useProgress()
  const [quiz, setQuiz] = useState(false)
  const qs = useMemo(() => (c ? shuffle(questionsForConcepts([c.id])).slice(0, 5) : []), [c])
  if (!c) return <Empty>Concept introuvable.</Empty>
  const st = p.concepts[c.id]
  const mods = modulesForConcept(c.id)
  return (
    <div style={{ maxWidth: 960 }}>
      <div className="muted small">
        <Link to="/glossary">Glossary</Link> / {c.name}
      </div>
      <div className="page-head">
        <h1>{c.name}</h1>
        <div style={{ width: 220 }}>
          <div className="small muted">
            Maîtrise {Math.round((st?.mastery ?? 0) * 100)} % · {st?.attempts ?? 0} tentative(s)
          </div>
          <ProgressBar value={st?.mastery ?? 0} />
        </div>
      </div>
      <div className="card">
        <ConceptFiche concept={c} />
      </div>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="card">
          <h3>Où l’apprendre</h3>
          {mods.length ? (
            <ul className="prose" style={{ paddingLeft: 20 }}>
              {mods.map((m) => (
                <li key={m.id}>
                  <Link to={`/learn/${m.id}`}>
                    Module {m.order} — {m.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <span className="muted">Pas encore de module dédié (phase 2).</span>
          )}
          <Link to={`/map?focus=${c.id}`} className="btn small">
            Voir dans la Concept Map
          </Link>
        </div>
        <div className="card">
          <h3>Se tester sur ce concept</h3>
          {qs.length === 0 ? (
            <span className="muted">Aucune question ne cible encore ce concept.</span>
          ) : !quiz ? (
            <button className="btn primary" onClick={() => setQuiz(true)}>
              {qs.length} question(s)
            </button>
          ) : null}
        </div>
      </div>
      {quiz && (
        <div style={{ marginTop: 16 }}>
          <QuizRunner questions={qs} mode="session" kind="practice" title={c.name} />
        </div>
      )}
    </div>
  )
}
