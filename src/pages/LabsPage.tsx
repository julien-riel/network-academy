import { Link } from 'react-router-dom'
import { scenarios } from '../content'
import { ConceptChips } from '../components/common'
import { useProgress } from '../engine/progress'

export default function LabsPage() {
  const p = useProgress()
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Troubleshooting Labs</h1>
          <p>
            On te donne des symptômes. Ton travail : localiser le problème dans la chaîne (802.11 → authentification → VLAN/DHCP
            → gateway → DNS → Internet), pas réciter des définitions.
          </p>
        </div>
      </div>
      <div className="stack">
        {scenarios.map((s) => {
          const r = p.labsDone[s.id]
          return (
            <Link to={`/labs/${s.id}`} key={s.id} className="card clickable" style={{ color: 'inherit' }}>
              <div className="row between">
                <div>
                  <div className="muted small">
                    Lab {s.order} · difficulté {s.difficulty}/3
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{s.title}</div>
                  <div className="muted" style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', margin: '4px 0 8px' }}>
                    « {s.symptom} »
                  </div>
                  <ConceptChips ids={s.concepts} />
                </div>
                <div style={{ textAlign: 'right' }}>
                  {r ? (
                    <span className={r.score === r.total ? 'badge-ok' : ''}>
                      {r.score}/{r.total} ✓
                    </span>
                  ) : (
                    <span className="muted small">à faire</span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
