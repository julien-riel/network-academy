import { useEffect, useState } from 'react'
import type { FlowStep } from '../types/content'

/** Animated protocol exchange (sequence diagram) driven by data. */
export function Sequence({ actors, steps, title, autoplay = false }: { actors: string[]; steps: FlowStep[]; title?: string; autoplay?: boolean }) {
  const [i, setI] = useState(-1)
  const [playing, setPlaying] = useState(autoplay)
  useEffect(() => {
    if (!playing) return
    const t = setTimeout(() => {
      if (i >= steps.length - 1) setPlaying(false)
      else setI(i + 1)
    }, 1400)
    return () => clearTimeout(t)
  }, [playing, i, steps.length])

  const col = (name: string) => Math.max(0, actors.indexOf(name))
  const n = actors.length
  const cur = steps[i]
  return (
    <div className="seq">
      {title && <div className="ascii-title">{title}</div>}
      <div className="actors" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {actors.map((a) => (
          <div className="actor" key={a}>
            {a}
          </div>
        ))}
      </div>
      {steps.map((s, k) => {
        const a = col(s.from)
        const b = col(s.to)
        const left = Math.min(a, b)
        const right = Math.max(a, b)
        const unit = 100 / n
        const x = left * unit + unit / 2
        const w = Math.max(unit * (right - left), unit * 0.6)
        const ltr = b >= a
        const active = k <= i
        return (
          <div className="lane" key={k}>
            <div
              className={'arrow ' + (ltr ? 'ltr' : 'rtl') + (active ? ' active' : '')}
              style={{ left: `${a === b ? x - unit * 0.3 : x}%`, width: `${w}%` }}
            >
              <span className="lbl">{s.label}</span>
            </div>
          </div>
        )
      })}
      <div className="note">{cur?.note ?? (i < 0 ? 'Appuie sur Lire pour animer l’échange.' : '')}</div>
      <div className="ctrl">
        <button className="btn small" onClick={() => { setI(-1); setPlaying(true) }}>
          ▶ Lire
        </button>
        <button className="btn small" onClick={() => { setPlaying(false); setI(Math.min(steps.length - 1, i + 1)) }}>
          Étape suivante
        </button>
        <button className="btn small ghost" onClick={() => { setPlaying(false); setI(-1) }}>
          Réinitialiser
        </button>
      </div>
    </div>
  )
}
