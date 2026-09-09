import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { journeyById, journeys } from '../content'
import { ConceptChips, Empty, Prose } from '../components/common'
import { recordJourneyViewed } from '../engine/progress'

const VIEWS = [
  { id: 'physical', label: 'Physical' },
  { id: 'protocol', label: 'Protocol' },
  { id: 'osi', label: 'OSI' },
  { id: 'packet', label: 'Packet' },
  { id: 'device', label: 'Device' },
] as const
type View = (typeof VIEWS)[number]['id']

/** "Follow the packet": every step of a connection is clickable, with switchable views. */
export default function JourneyPage() {
  const { journeyId } = useParams()
  const j = journeyById.get(journeyId ?? '') ?? journeys[0]
  const [step, setStep] = useState(0)
  const [views, setViews] = useState<Set<View>>(new Set(['protocol', 'osi']))
  const [seen, setSeen] = useState<Set<number>>(new Set([0]))
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    setStep(0)
    setSeen(new Set([0]))
    setPlaying(false)
  }, [j?.id])

  useEffect(() => {
    if (!playing || !j) return
    if (step >= j.steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => go(step + 1), 1800)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step, j?.id])

  if (!j) return <Empty>Aucun parcours.</Empty>

  const go = (i: number) => {
    setStep(i)
    setSeen((s) => new Set(s).add(i))
    if (i === j.steps.length - 1) recordJourneyViewed(j.id)
  }
  const toggle = (v: View) =>
    setViews((s) => {
      const n = new Set(s)
      if (n.has(v)) n.delete(v)
      else n.add(v)
      return n
    })
  const s = j.steps[step]

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Network Journey — Follow the packet</h1>
          <p>{j.description}</p>
        </div>
      </div>
      <div className="row" style={{ marginBottom: 14 }}>
        {journeys.map((x) => (
          <Link key={x.id} to={`/journey/${x.id}`} className={'btn small' + (x.id === j.id ? ' primary' : '')}>
            {x.title}
          </Link>
        ))}
      </div>
      <div className="journey">
        <div className="card" style={{ padding: 10 }}>
          <div className="row between" style={{ padding: '4px 8px 8px' }}>
            <strong>« {j.trigger} »</strong>
            <button className="btn small" onClick={() => { go(0); setPlaying(true) }}>
              ▶ Animer
            </button>
          </div>
          <div className="timeline">
            {j.steps.map((st, i) => (
              <button key={st.n} className={'tl-step' + (i === step ? ' active' : '') + (seen.has(i) ? ' seen' : '')} onClick={() => { setPlaying(false); go(i) }}>
                <span className="n">{st.n}</span>
                <span>
                  <div className="lbl">{st.label}</div>
                  <div className="sum">{st.summary}</div>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="views">
            {VIEWS.map((v) => (
              <button key={v.id} className={views.has(v.id) ? 'on' : ''} onClick={() => toggle(v.id)}>
                [{v.label}]
              </button>
            ))}
          </div>
          <h2>
            {s.n}. {s.label}
          </h2>
          <Prose text={s.purpose} />
          <dl className="kv">
            {s.source && (
              <>
                <dt>Source</dt>
                <dd>{s.source}</dd>
              </>
            )}
            {s.destination && (
              <>
                <dt>Destination</dt>
                <dd>{s.destination}</dd>
              </>
            )}
            {views.has('protocol') && s.protocol && (
              <>
                <dt>Protocol</dt>
                <dd>{s.protocol}</dd>
              </>
            )}
            {views.has('osi') && s.osi && (
              <>
                <dt>OSI</dt>
                <dd>{s.osi}</dd>
              </>
            )}
            {views.has('physical') && s.physical && (
              <>
                <dt>Physical</dt>
                <dd>{s.physical}</dd>
              </>
            )}
            {views.has('device') && s.device && (
              <>
                <dt>Device</dt>
                <dd>{s.device}</dd>
              </>
            )}
          </dl>
          {views.has('packet') && s.packet && <pre className="ascii" style={{ marginTop: 12 }}>{s.packet}</pre>}
          {s.ifItBreaks && (
            <div className="callout warning" style={{ marginTop: 14 }}>
              <div className="callout-title">Si ça brise ici</div>
              <Prose text={s.ifItBreaks} />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <div className="muted small" style={{ marginBottom: 4 }}>
              Concepts
            </div>
            <ConceptChips ids={s.concepts} />
          </div>
          <div className="row" style={{ marginTop: 16 }}>
            <button className="btn" disabled={step === 0} onClick={() => { setPlaying(false); go(step - 1) }}>
              ← Étape précédente
            </button>
            <button className="btn primary" disabled={step === j.steps.length - 1} onClick={() => { setPlaying(false); go(step + 1) }}>
              Étape suivante →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
