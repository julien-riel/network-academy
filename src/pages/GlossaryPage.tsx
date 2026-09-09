import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES, concepts } from '../content'
import { CategoryTag, ConceptChip } from '../components/common'
import { normalize } from '../engine/grading'
import { useProgress } from '../engine/progress'
import type { Category } from '../types/content'

export default function GlossaryPage() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<Category | 'all'>('all')
  const p = useProgress()
  const list = useMemo(() => {
    const n = normalize(q)
    return concepts
      .filter((c) => cat === 'all' || c.category === cat)
      .filter((c) => !n || normalize(c.name).includes(n) || c.aliases.some((a) => normalize(a).includes(n)) || normalize(c.shortDefinition).includes(n))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [q, cat])
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Glossary</h1>
          <p>{concepts.length} termes. Recherche instantanée sur le nom, les alias et la définition.</p>
        </div>
      </div>
      <input className="gloss-search" placeholder="Rechercher : SSID, RADIUS, uCentral, trunk…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <div className="row" style={{ marginBottom: 12 }}>
        <button className={'btn small' + (cat === 'all' ? ' primary' : '')} onClick={() => setCat('all')}>
          Tout
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={'btn small' + (cat === c.id ? ' primary' : '')} onClick={() => setCat(c.id)}>
            {c.label}
          </button>
        ))}
      </div>
      <div className="card">
        {list.map((c) => (
          <div className="gloss-item" key={c.id}>
            <div>
              <Link to={`/concepts/${c.id}`} className="name">
                {c.name}
              </Link>
              <div className="cat">
                <CategoryTag category={c.category} />
              </div>
              <div className="level">Niveau : {['', 'fondamental', 'intermédiaire', 'avancé'][c.difficulty]}</div>
              {p.concepts[c.id] && <div className="level">Maîtrise : {Math.round(p.concepts[c.id].mastery * 100)} %</div>}
            </div>
            <div>
              <div>{c.shortDefinition}</div>
              <div className="rel">
                <span className="muted small">Relié à :</span>
                {c.relatedConcepts.slice(0, 6).map((r) => (
                  <ConceptChip key={r.conceptId} id={r.conceptId} />
                ))}
              </div>
            </div>
          </div>
        ))}
        {list.length === 0 && <div className="muted">Aucun terme ne correspond.</div>}
      </div>
    </div>
  )
}
