import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { categoryById, conceptById } from '../content'
import type { Category } from '../types/content'

export function ProgressBar({ value, big }: { value: number; big?: boolean }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100)
  return (
    <div className={'bar' + (big ? ' big' : '')} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <span style={{ width: pct + '%' }} />
    </div>
  )
}

export function AsciiBar({ value, width = 10 }: { value: number; width?: number }) {
  const filled = Math.round(Math.max(0, Math.min(1, value)) * width)
  return <code>{'█'.repeat(filled) + '░'.repeat(width - filled)}</code>
}

export function CategoryTag({ category }: { category: Category }) {
  const c = categoryById.get(category)
  return (
    <span className="tag" style={{ background: c?.color ?? '#64748b' }}>
      {c?.label ?? category}
    </span>
  )
}

export function ConceptChip({ id, mastery }: { id: string; mastery?: number }) {
  const c = conceptById.get(id)
  if (!c) return <span className="chip">{id}</span>
  const color = categoryById.get(c.category)?.color
  return (
    <Link to={`/concepts/${c.id}`} className="chip" title={c.shortDefinition}>
      <span className="dot" style={{ background: color }} />
      {c.name}
      {mastery != null && <span className="muted">{Math.round(mastery * 100)} %</span>}
    </Link>
  )
}

export function ConceptChips({ ids }: { ids: string[] }) {
  return (
    <div className="row">
      {ids.map((id) => (
        <ConceptChip key={id} id={id} />
      ))}
    </div>
  )
}

/** Very small markdown-lite: **bold**, `code`, line breaks, "- " bullet lists. */
export function Prose({ text }: { text: string }) {
  const blocks = text.split(/\n\s*\n/)
  return (
    <div className="prose">
      {blocks.map((b, i) => {
        const lines = b.split('\n')
        if (lines.every((l) => l.trim().startsWith('- '))) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.trim().slice(2))}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i}>
            {lines.map((l, j) => (
              <span key={j}>
                {inline(l)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        )
      })}
    </div>
  )
}

function inline(s: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    const t = m[0]
    if (t.startsWith('**')) out.push(<strong key={k++}>{t.slice(2, -2)}</strong>)
    else out.push(<code key={k++}>{t.slice(1, -1)}</code>)
    last = m.index + t.length
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

export function Diagram({ text, title }: { text: string; title?: string }) {
  return (
    <div style={{ margin: '12px 0' }}>
      {title && <div className="ascii-title">{title}</div>}
      <pre className="ascii">{text}</pre>
    </div>
  )
}

export function Callout({ kind, title, children }: { kind: 'idea' | 'warning' | 'analogy' | 'remember'; title?: string; children: ReactNode }) {
  const defaults = { idea: 'Idée clé', warning: 'Attention', analogy: 'Analogie logicielle', remember: 'À retenir' }
  return (
    <div className={'callout ' + kind}>
      <div className="callout-title">{title ?? defaults[kind]}</div>
      {typeof children === 'string' ? <Prose text={children} /> : children}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="card muted" style={{ textAlign: 'center', padding: 40 }}>
      {children}
    </div>
  )
}
