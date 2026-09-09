import { useMemo, useState } from 'react'
import { OSI_LAYERS } from '../content'
import type { Answer, Grade } from '../engine/grading'
import { shuffle } from '../engine/recommend'
import type { LayerQuestion, MatchingQuestion, OrderingQuestion, Question } from '../types/content'
import { ConceptChips, Prose } from './common'
import { typeLabel } from './quizUtils'

interface Props {
  question: Question
  answer: Answer | undefined
  onChange: (a: Answer) => void
  revealed: boolean
  grade?: Grade
}

const LETTERS = 'ABCDEFGH'

export function QuestionView({ question: q, answer, onChange, revealed, grade }: Props) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 6 }}>
        <span className="tag" style={{ background: '#475569' }}>{typeLabel(q.type)}</span>
        <span className="level">difficulté {q.difficulty}/3</span>
      </div>
      <div style={{ fontSize: '1.05rem', fontWeight: 500, marginBottom: 12 }}>
        <Prose text={q.prompt} />
      </div>
      <Body question={q} answer={answer} onChange={onChange} revealed={revealed} grade={grade} />
      {revealed && grade && (
        <div className={'feedback ' + (grade.correct ? 'ok' : grade.score > 0 ? 'partial' : 'bad')}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            {grade.correct ? '✓ Correct' : grade.score > 0 ? `△ Partiellement (${Math.round(grade.score * 100)} %)` : '✗ Pas tout à fait'}
          </div>
          {grade.details && (
            <ul className="prose" style={{ paddingLeft: 20 }}>
              {grade.details.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
          )}
          <Prose text={q.explanation} />
          {q.type === 'free-response' && (
            <details>
              <summary className="small" style={{ cursor: 'pointer' }}>Réponse modèle</summary>
              <Prose text={q.sampleAnswer} />
            </details>
          )}
          <div className="row small" style={{ marginTop: 6 }}>
            <span className="muted">Concepts :</span>
            <ConceptChips ids={q.concepts} />
          </div>
        </div>
      )}
    </div>
  )
}

function Body({ question: q, answer, onChange, revealed, grade }: Props) {
  switch (q.type) {
    case 'multiple-choice':
    case 'troubleshooting': {
      const sel = answer && (answer.type === 'multiple-choice' || answer.type === 'troubleshooting') ? answer.choice : null
      return (
        <div>
          {q.choices.map((c, i) => {
            let cls = 'choice'
            if (revealed) {
              if (i === q.answer) cls += ' correct'
              else if (i === sel) cls += ' wrong'
            } else if (i === sel) cls += ' selected'
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => onChange({ type: q.type, choice: i })}>
                <span className="k">{LETTERS[i]}</span>
                <span>{c}</span>
              </button>
            )
          })}
        </div>
      )
    }
    case 'ordering':
      return <Ordering q={q} answer={answer} onChange={onChange} revealed={revealed} />
    case 'matching':
      return <Matching q={q} answer={answer} onChange={onChange} revealed={revealed} />
    case 'layer':
      return <Layer q={q} answer={answer} onChange={onChange} revealed={revealed} />
    case 'free-response': {
      const text = answer && answer.type === 'free-response' ? answer.text : ''
      return (
        <div>
          <textarea
            className="free"
            value={text}
            disabled={revealed}
            placeholder="Réponds librement, en deux ou trois phrases. Les concepts importants sont détectés dans ta réponse."
            onChange={(e) => onChange({ type: 'free-response', text: e.target.value })}
          />
          {!revealed && grade == null && (
            <div className="muted small">Attendu : {q.expected.length} idée(s) importante(s).</div>
          )}
        </div>
      )
    }
  }
}

function Ordering({ q, answer, onChange, revealed }: { q: OrderingQuestion; answer: Answer | undefined; onChange: (a: Answer) => void; revealed: boolean }) {
  const initial = useMemo(() => shuffle(q.items, q.id.length * 7919), [q])
  const order = answer && answer.type === 'ordering' && answer.order.length ? answer.order : initial
  const move = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= order.length) return
    const next = [...order]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange({ type: 'ordering', order: next })
  }
  return (
    <div>
      {order.map((item, i) => {
        let cls = 'order-item'
        if (revealed) cls += q.items[i] === item ? ' correct' : ' wrong'
        return (
          <div className={cls} key={item}>
            <span className="num">{i + 1}.</span>
            <span>{item}</span>
            {!revealed && (
              <span className="ctrls">
                <button className="btn small" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">↑</button>
                <button className="btn small" onClick={() => move(i, 1)} disabled={i === order.length - 1} aria-label="Descendre">↓</button>
              </span>
            )}
            {revealed && q.items[i] !== item && <span className="muted small" style={{ marginLeft: 'auto' }}>attendu : {q.items[i]}</span>}
          </div>
        )
      })}
      {!revealed && order === initial && (
        <button className="btn small" onClick={() => onChange({ type: 'ordering', order: [...initial] })}>
          Valider cet ordre tel quel
        </button>
      )}
    </div>
  )
}

function Matching({ q, answer, onChange, revealed }: { q: MatchingQuestion; answer: Answer | undefined; onChange: (a: Answer) => void; revealed: boolean }) {
  const rights = useMemo(() => shuffle(q.pairs.map((p) => p.right), q.id.length * 31), [q])
  const mapping = answer && answer.type === 'matching' ? answer.mapping : {}
  return (
    <div>
      {q.pairs.map((p) => {
        const val = mapping[p.left] ?? ''
        const ok = revealed && val === p.right
        return (
          <div className="match-row" key={p.left}>
            <div className="order-item" style={{ marginBottom: 0 }}>{p.left}</div>
            <span className="muted">→</span>
            <div>
              <select
                value={val}
                disabled={revealed}
                style={revealed ? { borderColor: ok ? 'var(--ok)' : 'var(--bad)' } : undefined}
                onChange={(e) => onChange({ type: 'matching', mapping: { ...mapping, [p.left]: e.target.value } })}
              >
                <option value="">— choisir —</option>
                {rights.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {revealed && !ok && <div className="small muted">attendu : {p.right}</div>}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Layer({ q, answer, onChange, revealed }: { q: LayerQuestion; answer: Answer | undefined; onChange: (a: Answer) => void; revealed: boolean }) {
  const placement = answer && answer.type === 'layer' ? answer.placement : {}
  const [dragging, setDragging] = useState<string | null>(null)
  const [over, setOver] = useState<number | null>(null)
  const bank = q.items.filter((it) => placement[it.label] == null)
  const place = (label: string, layer: number | null) => onChange({ type: 'layer', placement: { ...placement, [label]: layer } })
  const drop = (layer: number | null) => {
    if (dragging) place(dragging, layer)
    setDragging(null)
    setOver(null)
  }
  return (
    <div>
      <div className="muted small" style={{ marginBottom: 6 }}>
        Glisse chaque protocole vers sa couche (ou clique un jeton puis une couche).
      </div>
      <div
        className="token-bank"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => drop(null)}
      >
        {bank.length === 0 && <span className="muted small">Tous les éléments sont placés.</span>}
        {bank.map((it) => (
          <span
            key={it.label}
            className={'token' + (dragging === it.label ? ' hl' : '')}
            draggable={!revealed}
            onDragStart={() => setDragging(it.label)}
            onClick={() => setDragging(dragging === it.label ? null : it.label)}
            style={dragging === it.label ? { outline: '2px solid var(--accent)' } : undefined}
          >
            {it.label}
          </span>
        ))}
      </div>
      <div className="layer-grid">
        {OSI_LAYERS.map((l) => (
          <div className="layer-row" key={l.n}>
            <div className="layer-name">
              {l.n} · {l.name}
              <small>{l.hint}</small>
            </div>
            <div
              className={'layer-drop' + (over === l.n ? ' over' : '')}
              onDragOver={(e) => { e.preventDefault(); setOver(l.n) }}
              onDragLeave={() => setOver(null)}
              onDrop={() => drop(l.n)}
              onClick={() => { if (dragging && !revealed) drop(l.n) }}
            >
              {q.items
                .filter((it) => placement[it.label] === l.n)
                .map((it) => (
                  <span
                    key={it.label}
                    className={'token' + (revealed ? (it.layers.includes(l.n) ? ' correct' : ' wrong') : '')}
                    draggable={!revealed}
                    onDragStart={() => setDragging(it.label)}
                    onClick={(e) => { e.stopPropagation(); if (!revealed) place(it.label, null) }}
                    title={revealed && !it.layers.includes(l.n) ? 'attendu : couche ' + it.layers.join(' ou ') : 'retirer'}
                  >
                    {it.label}
                    {revealed && !it.layers.includes(l.n) && <span> → {it.layers.join('/')}</span>}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
