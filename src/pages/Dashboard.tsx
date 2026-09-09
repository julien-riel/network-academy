import { Link } from 'react-router-dom'
import { concepts, DOMAINS, modules, scenarios } from '../content'
import { AsciiBar, ConceptChip, ProgressBar } from '../components/common'
import {
  domainScore,
  fragileConcepts,
  globalScore,
  levelLabel,
  masteredConcepts,
  moduleCompletion,
  resetProgress,
  useProgress,
} from '../engine/progress'
import { recommendNext } from '../engine/recommend'

export default function Dashboard() {
  const p = useProgress()
  const global = globalScore(p)
  const mastered = masteredConcepts(p)
  const fragile = fragileConcepts(p)
  const recs = recommendNext(p)
  const labsDone = Object.keys(p.labsDone).length
  const modulesDone = modules.filter((m) => moduleCompletion(p, m.id) >= 1).length

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>
            Simulateur de compréhension du réseau, orienté vers ce qu’il faut savoir pour être crédible rapidement dans un
            environnement OpenWiFi / OpenLAN comme NetExperience.
          </p>
        </div>
        <div className="row">
          <Link to="/journey" className="btn">
            ⇝ Follow the packet
          </Link>
          <Link to="/map" className="btn">
            ⬡ Concept Map
          </Link>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="muted small">Niveau global</div>
          <div className="bigscore">{Math.round(global * 100)} %</div>
          <div style={{ fontWeight: 600 }}>{levelLabel(global)}</div>
          <div style={{ marginTop: 10 }}>
            <ProgressBar value={global} big />
          </div>
        </div>
        <div className="card">
          <div className="muted small">Progression</div>
          <div className="stack" style={{ gap: 6, marginTop: 6 }}>
            <div className="row between">
              <span>Modules</span>
              <strong>
                {modulesDone} / {modules.length}
              </strong>
            </div>
            <div className="row between">
              <span>Concepts maîtrisés (≥ 75 %)</span>
              <strong>
                {mastered.length} / {concepts.length}
              </strong>
            </div>
            <div className="row between">
              <span>Labs réussis</span>
              <strong>
                {labsDone} / {scenarios.length}
              </strong>
            </div>
            <div className="row between">
              <span>Diagnostic initial</span>
              <strong>{p.diagnosticDone ? 'fait' : 'à faire'}</strong>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="muted small">Score par domaine</div>
          <div style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
            {DOMAINS.map((d) => {
              const s = domainScore(p, d.id)
              return (
                <div className="row between" key={d.id} style={{ padding: '2px 0' }}>
                  <span style={{ fontFamily: 'var(--sans)' }}>{d.label}</span>
                  <span>
                    <AsciiBar value={s} /> {Math.round(s * 100)} %
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="stack">
          <h2>Prochaine session recommandée</h2>
          {recs.map((r) => (
            <Link to={r.to} key={r.to} className={'card clickable recommend ' + r.kind} style={{ display: 'block' }}>
              <div style={{ fontWeight: 700 }}>{r.title}</div>
              <div className="muted small">{r.reason}</div>
            </Link>
          ))}
          <div className="card">
            <div className="muted small" style={{ marginBottom: 6 }}>
              Format d’une session (15–20 min)
            </div>
            <div className="session-plan">
              <span>2 min rappel</span>
              <span>6 min nouveaux concepts</span>
              <span>5 min diagramme / animation</span>
              <span>5 min scénario</span>
              <span>2 min quiz</span>
            </div>
            <div className="muted small" style={{ marginTop: 8 }}>
              Jamais plus de 5 nouveaux concepts importants à la fois.
            </div>
          </div>
        </div>
        <div className="stack">
          <h2>Concepts fragiles</h2>
          <div className="card">
            {fragile.length === 0 ? (
              <span className="muted">Aucun concept fragile détecté pour l’instant. Fais le diagnostic ou un quiz.</span>
            ) : (
              <div className="row">
                {fragile.slice(0, 12).map((c) => (
                  <ConceptChip key={c.id} id={c.id} mastery={p.concepts[c.id]?.mastery} />
                ))}
              </div>
            )}
          </div>
          <h2>Concepts maîtrisés</h2>
          <div className="card">
            {mastered.length === 0 ? (
              <span className="muted">Pas encore. Chaque bonne réponse rapproche le score de maîtrise de 100 %.</span>
            ) : (
              <div className="row">
                {mastered.slice(0, 20).map((c) => (
                  <ConceptChip key={c.id} id={c.id} mastery={p.concepts[c.id]?.mastery} />
                ))}
                {mastered.length > 20 && <span className="muted small">+{mastered.length - 20}</span>}
              </div>
            )}
          </div>
          <h2>Modules</h2>
          <div className="card stack" style={{ gap: 6 }}>
            {modules.map((m) => (
              <Link to={`/learn/${m.id}`} key={m.id} className="row between" style={{ color: 'inherit' }}>
                <span>
                  <span className="muted" style={{ fontFamily: 'var(--mono)', marginRight: 8 }}>
                    {String(m.order).padStart(2, '0')}
                  </span>
                  {m.title}
                </span>
                <span style={{ width: 120 }}>
                  <ProgressBar value={moduleCompletion(p, m.id)} />
                </span>
              </Link>
            ))}
          </div>
          <div className="row" style={{ justifyContent: 'flex-end' }}>
            <button
              className="btn ghost small muted"
              onClick={() => {
                if (confirm('Réinitialiser toute la progression locale ?')) resetProgress()
              }}
            >
              Réinitialiser la progression
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
