import { references } from '../content'
import { ConceptChips } from '../components/common'

const KIND_LABEL: Record<string, string> = { rfc: 'RFC', ieee: 'IEEE', iso: 'ISO', project: 'Projet', vendor: 'Fournisseur', doc: 'Documentation' }

export default function ReferencePage() {
  const groups = ['project', 'vendor', 'rfc', 'ieee', 'iso', 'doc'].map((k) => ({ k, items: references.filter((r) => r.kind === k) })).filter((g) => g.items.length)
  return (
    <div style={{ maxWidth: 960 }}>
      <div className="page-head">
        <div>
          <h1>Reference</h1>
          <p>
            Chaque fiche distingue « Learn » (l’intuition) de « Go deeper » (les standards et projets officiels). Voici les sources
            prioritaires.
          </p>
        </div>
      </div>
      {groups.map((g) => (
        <div key={g.k} style={{ marginBottom: 20 }}>
          <h2>{KIND_LABEL[g.k] ?? g.k}</h2>
          <div className="stack">
            {g.items.map((r) => (
              <div className="card" key={r.id}>
                <div style={{ fontWeight: 700 }}>
                  <a href={r.url} target="_blank" rel="noreferrer">
                    {r.title}
                  </a>
                </div>
                <div className="muted small" style={{ marginBottom: 6 }}>
                  {r.description}
                </div>
                <ConceptChips ids={r.concepts} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
