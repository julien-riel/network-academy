import { Link } from 'react-router-dom'
import { modules } from '../content'
import { ConceptChips, ProgressBar } from '../components/common'
import { moduleCompletion, useProgress } from '../engine/progress'

export default function Learn() {
  const p = useProgress()
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Learn</h1>
          <p>
            Huit modules, tous construits autour de la même histoire : mon téléphone se connecte au Wi-Fi, que se passe-t-il ?
            Chaque nouveau protocole répond aux six questions : c’est quoi, pourquoi, qui parle à qui, quand, avec quoi est-ce
            relié, à quoi ressemble une panne.
          </p>
        </div>
      </div>
      <div className="stack">
        {modules.map((m) => {
          const done = moduleCompletion(p, m.id)
          const minutes = m.lessons.reduce((a, l) => a + l.minutes, 0)
          return (
            <Link to={`/learn/${m.id}`} key={m.id} className="card clickable module-card" style={{ color: 'inherit' }}>
              <div className="num">{String(m.order).padStart(2, '0')}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{m.title}</div>
                <div className="muted small" style={{ marginBottom: 6 }}>
                  {m.subtitle} · {m.lessons.length} leçons · ~{minutes} min
                </div>
                <ConceptChips ids={m.concepts.slice(0, 8)} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="small muted">{Math.round(done * 100)} %</div>
                <ProgressBar value={done} />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
