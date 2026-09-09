import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { scenarioById, scenarios } from '../content'
import { ConceptChips, Empty, Prose } from '../components/common'
import { recordAnswer, recordLabDone } from '../engine/progress'
import { seedOf, shuffle } from '../engine/recommend'

/** Troubleshooting engine: symptom → choose where to look → feedback → reasoning chain. */
export default function LabPage() {
  const { labId } = useParams()
  const s = labId ? scenarioById.get(labId) : undefined
  const [stepIdx, setStepIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const order = useMemo(
    () => (s ? shuffle(s.steps[stepIdx].choices.map((_, i) => i), seedOf(`${s.id}-${stepIdx}`)) : []),
    [s, stepIdx],
  )
  if (!s) return <Empty>Lab introuvable.</Empty>

  const step = s.steps[stepIdx]
  const choice = picked != null ? step.choices[picked] : null
  const next = scenarios.find((x) => x.order === s.order + 1)

  const pick = (i: number) => {
    if (picked != null) return
    setPicked(i)
    const ok = !!step.choices[i].correct
    recordAnswer(s.concepts, ok, 0.6)
    if (ok) setScore(score + 1)
  }
  const advance = () => {
    if (stepIdx < s.steps.length - 1) {
      setStepIdx(stepIdx + 1)
      setPicked(null)
    } else {
      recordLabDone(s.id, score, s.steps.length)
      setFinished(true)
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="muted small">
        <Link to="/labs">Labs</Link> / Lab {s.order}
      </div>
      <h1>{s.title}</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="muted small">Symptôme</div>
        <div style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: 10 }}>« {s.symptom} »</div>
        <div className="muted small">Ce que l’on sait</div>
        <ul className="lab-facts">
          {s.facts.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      </div>

      {!finished ? (
        <div className="card">
          <div className="muted small">
            Étape {stepIdx + 1} / {s.steps.length}
          </div>
          <h2>{step.prompt}</h2>
          {order.map((i, pos) => {
            const c = step.choices[i]
            let cls = 'choice'
            if (picked != null) {
              if (c.correct) cls += ' correct'
              else if (i === picked) cls += ' wrong'
            }
            return (
              <button key={i} className={cls} onClick={() => pick(i)} disabled={picked != null}>
                <span className="k">{'ABCDEF'[pos]}</span>
                <span>{c.label}</span>
              </button>
            )
          })}
          {choice && (
            <div className={'feedback ' + (choice.correct ? 'ok' : 'bad')}>
              <div style={{ fontWeight: 700 }}>{choice.correct ? '✓ Bon réflexe' : '✗ Pas là en premier'}</div>
              <Prose text={choice.feedback} />
              {!choice.correct && (
                <div className="small muted">
                  Réponse attendue : {step.choices.find((c) => c.correct)?.label}
                </div>
              )}
              <button className="btn primary" style={{ marginTop: 8 }} onClick={advance}>
                {stepIdx < s.steps.length - 1 ? 'Étape suivante →' : 'Voir le raisonnement'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="stack">
          <div className="card">
            <div className="row between">
              <h2>Raisonnement attendu</h2>
              <span className={score === s.steps.length ? 'badge-ok' : ''}>
                {score} / {s.steps.length}
              </span>
            </div>
            <div className="reason-chain">
              {s.reasoning.map((r, i) => (
                <div key={i}>{r}</div>
              ))}
            </div>
            <div className="callout remember" style={{ marginTop: 14 }}>
              <div className="callout-title">Ce qu’il faut retenir</div>
              <Prose text={s.takeaway} />
            </div>
            <div className="muted small" style={{ marginBottom: 4 }}>
              Concepts impliqués
            </div>
            <ConceptChips ids={s.concepts} />
          </div>
          <div className="row">
            <Link to="/labs" className="btn">
              Tous les labs
            </Link>
            {next && (
              <Link to={`/labs/${next.id}`} className="btn primary" onClick={() => { setStepIdx(0); setPicked(null); setScore(0); setFinished(false) }}>
                Lab suivant : {next.title} →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
