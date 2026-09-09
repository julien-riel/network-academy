import { Link } from 'react-router-dom'
import { conceptById, OSI_LAYERS } from '../content'
import { neighbours } from '../engine/graph'
import type { Concept } from '../types/content'
import { CategoryTag, ConceptChip, Diagram, Prose } from './common'
import { Sequence } from './Sequence'

/**
 * Every concept uses exactly the same structure (the six questions of the PRD):
 * what, why, who talks to whom, when, related, what a failure looks like.
 */
export function ConceptFiche({ concept, compact = false }: { concept: Concept; compact?: boolean }) {
  const c = concept
  const related = neighbours(c.id)
  const actors = c.packetFlow ? [...new Set(c.packetFlow.flatMap((s) => [s.from, s.to]))] : []
  return (
    <div>
      <div className="row between" style={{ marginBottom: 8 }}>
        <div className="row">
          <CategoryTag category={c.category} />
          <span className="level">Niveau {['', 'fondamental', 'intermédiaire', 'avancé'][c.difficulty]}</span>
          {c.osiLayers && (
            <span className="level">
              OSI {c.osiLayers.map((l) => `${l} (${OSI_LAYERS.find((x) => x.n === l)?.name})`).join(', ')}
            </span>
          )}
        </div>
        {compact && (
          <Link to={`/concepts/${c.id}`} className="small">
            Ouvrir la fiche →
          </Link>
        )}
      </div>
      {c.aliases.length > 0 && <div className="muted small" style={{ marginBottom: 8 }}>Aussi : {c.aliases.join(', ')}</div>}
      <div className="fiche-section">
        <h4>En une phrase</h4>
        <p className="fiche-lead">{c.shortDefinition}</p>
      </div>
      <div className="six">
        {c.whyItExists && (
          <div className="fiche-section">
            <h4>Pourquoi ça existe</h4>
            <Prose text={c.whyItExists} />
          </div>
        )}
        {c.whoTalksToWhom && (
          <div className="fiche-section">
            <h4>Qui parle à qui</h4>
            <Prose text={c.whoTalksToWhom} />
          </div>
        )}
        {c.when && (
          <div className="fiche-section">
            <h4>Quand</h4>
            <Prose text={c.when} />
          </div>
        )}
        {c.ports && c.ports.length > 0 && (
          <div className="fiche-section">
            <h4>Ports</h4>
            <p>
              {c.ports.map((p) => `${p.protocol} ${p.port}${p.role ? ' (' + p.role + ')' : ''}`).join(' · ')}
            </p>
          </div>
        )}
        {c.actors && c.actors.length > 0 && (
          <div className="fiche-section">
            <h4>Acteurs</h4>
            <p>{c.actors.join(' · ')}</p>
          </div>
        )}
      </div>
      {!compact && (
        <div className="fiche-section">
          <h4>Explication</h4>
          <Prose text={c.explanation} />
        </div>
      )}
      {c.softwareAnalogy && (
        <div className="callout analogy">
          <div className="callout-title">Pour quelqu’un qui vient du logiciel</div>
          <Prose text={c.softwareAnalogy} />
        </div>
      )}
      {!compact && c.packetFlow && c.packetFlow.length > 0 && (
        <div className="fiche-section">
          <h4>Séquence importante</h4>
          <Sequence actors={actors} steps={c.packetFlow} />
        </div>
      )}
      {c.failureSymptoms && c.failureSymptoms.length > 0 && (
        <div className="fiche-section">
          <h4>Si ça brise</h4>
          <ul className="prose" style={{ paddingLeft: 20, margin: 0 }}>
            {c.failureSymptoms.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="fiche-section">
        <h4>Concepts reliés</h4>
        <div className="row">
          {related.map(({ concept: r, edge }) => (
            <span key={r.id} className="row" style={{ gap: 4 }}>
              <span className="muted small">{edge.label}</span>
              <ConceptChip id={r.id} />
            </span>
          ))}
          {related.length === 0 && <span className="muted">—</span>}
        </div>
      </div>
      {c.prerequisites.length > 0 && (
        <div className="fiche-section">
          <h4>Prérequis</h4>
          <div className="row">
            {c.prerequisites.filter((p) => conceptById.has(p)).map((p) => (
              <ConceptChip key={p} id={p} />
            ))}
          </div>
        </div>
      )}
      {!compact && c.goDeeper && (
        <details className="dp">
          <summary>Approfondir (Go deeper)</summary>
          <div style={{ marginTop: 8 }}>
            {c.goDeeper.startsWith('```') ? <Diagram text={c.goDeeper.replace(/```/g, '').trim()} /> : <Prose text={c.goDeeper} />}
          </div>
        </details>
      )}
      {!compact && c.sources.length > 0 && (
        <div className="fiche-section" style={{ marginTop: 12 }}>
          <h4>Sources</h4>
          <ul className="prose small" style={{ paddingLeft: 20, margin: 0 }}>
            {c.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noreferrer">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
