import { useMemo } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { DOMAINS, moduleById, questions } from '../content'
import { Empty } from '../components/common'
import { QuizRunner, type QuizMode } from '../components/QuizRunner'
import { getProgress } from '../engine/progress'
import { pickQuestions, reviewTargets, shuffle } from '../engine/recommend'
import type { Domain, Question } from '../types/content'
import type { QuizResult } from '../engine/progress'

function perDomain(n: number, filter?: (q: Question) => boolean): Question[] {
  const out: Question[] = []
  const used = new Set<string>()
  for (const d of DOMAINS) {
    const pool = shuffle(questions.filter((q) => q.domain === d.id && (!filter || filter(q))))
    for (const q of pool.slice(0, n)) {
      out.push(q)
      used.add(q.id)
    }
  }
  // top-up if a domain lacks questions
  const want = n * DOMAINS.length
  if (out.length < want) {
    for (const q of shuffle(questions.filter((q) => !used.has(q.id) && (!filter || filter(q))))) {
      if (out.length >= want) break
      out.push(q)
    }
  }
  return shuffle(out)
}

export default function QuizPage() {
  const { kind } = useParams()
  const [params] = useSearchParams()
  const moduleParam = params.get('module')
  const mode = params.get('mode')

  const config = useMemo(() => {
    const p = getProgress()
    switch (kind) {
      case 'diagnostic':
        return {
          title: 'Diagnostic initial',
          mode: 'exam' as QuizMode,
          kind: 'diagnostic' as QuizResult['kind'],
          qs: perDomain(6, (q) => q.type !== 'free-response'),
        }
      case 'exam':
        return { title: 'Examen final', mode: 'exam' as QuizMode, kind: 'exam' as QuizResult['kind'], qs: perDomain(10) }
      case 'interview':
        return {
          title: 'Mode Interview',
          mode: 'session' as QuizMode,
          kind: 'interview' as QuizResult['kind'],
          qs: shuffle(questions.filter((q) => q.type === 'free-response')).slice(0, 8),
        }
      case 'practice': {
        if (moduleParam) {
          const m = moduleById.get(moduleParam)
          return {
            title: m ? `Pratique — ${m.title}` : 'Pratique',
            mode: 'session' as QuizMode,
            kind: 'module' as QuizResult['kind'],
            moduleId: moduleParam,
            qs: pickQuestions(p, m?.concepts ?? null, 10),
          }
        }
        const targets = mode === 'weak' ? reviewTargets(p) : null
        return { title: 'Quiz de pratique', mode: 'session' as QuizMode, kind: 'practice' as QuizResult['kind'], qs: pickQuestions(p, targets, 10) }
      }
      default:
        return null
    }
  }, [kind, moduleParam, mode])

  if (!config) return <Empty>Type de test inconnu.</Empty>
  const domainCounts = DOMAINS.map((d) => ({ d, n: config.qs.filter((q) => q.domain === (d.id as Domain)).length })).filter((x) => x.n > 0)

  return (
    <div style={{ maxWidth: 960 }}>
      <div className="muted small">
        <Link to="/tests">Tests</Link> / {config.title}
      </div>
      <h1>{config.title}</h1>
      <div className="row small muted" style={{ marginBottom: 14 }}>
        {domainCounts.map((x) => (
          <span key={x.d.id} className="chip">
            {x.d.label} · {x.n}
          </span>
        ))}
        {config.mode === 'exam' && <span>Feedback à la fin seulement.</span>}
      </div>
      <QuizRunner questions={config.qs} mode={config.mode} kind={config.kind} moduleId={config.moduleId} title={config.title} />
    </div>
  )
}
