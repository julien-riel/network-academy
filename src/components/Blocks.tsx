import { conceptById, questionById } from '../content'
import type { Block } from '../types/content'
import { Callout, ConceptChips, Diagram, Prose } from './common'
import { ConceptFiche } from './ConceptFiche'
import { Sequence } from './Sequence'
import { QuizRunner } from './QuizRunner'

/** Renders a lesson made of data-driven blocks. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case 'heading':
      return <h2 style={{ marginTop: 22 }}>{block.text}</h2>
    case 'paragraph':
      return <Prose text={block.text} />
    case 'callout':
      return (
        <Callout kind={block.kind} title={block.title}>
          {block.text}
        </Callout>
      )
    case 'diagram':
      return <Diagram text={block.text} title={block.title} />
    case 'list':
      return (
        <ul className="prose" style={{ paddingLeft: 20 }}>
          {block.items.map((it, i) => (
            <li key={i}>
              <Prose text={it} />
            </li>
          ))}
        </ul>
      )
    case 'table':
      return (
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'concepts':
      return (
        <div className="stack" style={{ margin: '14px 0' }}>
          {block.ids.map((id) => {
            const c = conceptById.get(id)
            if (!c) return null
            return (
              <div className="card" key={id}>
                <h3>{c.name}</h3>
                <ConceptFiche concept={c} compact />
              </div>
            )
          })}
        </div>
      )
    case 'sequence':
      return <Sequence actors={block.actors} steps={block.steps} title={block.title} />
    case 'exercise': {
      const qs = block.questionIds.map((id) => questionById.get(id)).filter((q) => q != null)
      return (
        <div className="card" style={{ margin: '16px 0', background: '#f8fafc' }}>
          <h3>{block.title ?? 'Exercice'}</h3>
          <QuizRunner questions={qs} mode="inline" />
        </div>
      )
    }
    case 'takeaways':
      return (
        <Callout kind="remember" title="À retenir">
          <ul className="prose" style={{ paddingLeft: 20, margin: 0 }}>
            {block.items.map((it, i) => (
              <li key={i}>
                <Prose text={it} />
              </li>
            ))}
          </ul>
        </Callout>
      )
  }
}

export function RelatedConcepts({ ids }: { ids: string[] }) {
  return <ConceptChips ids={ids} />
}
