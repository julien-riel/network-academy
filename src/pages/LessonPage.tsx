import { Link, useNavigate, useParams } from 'react-router-dom'
import { moduleById } from '../content'
import { Blocks } from '../components/Blocks'
import { Empty } from '../components/common'
import { recordLessonDone, useProgress } from '../engine/progress'
import { useEffect } from 'react'

export default function LessonPage() {
  const { moduleId, lessonId } = useParams()
  const m = moduleId ? moduleById.get(moduleId) : undefined
  const p = useProgress()
  const nav = useNavigate()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [lessonId])
  if (!m) return <Empty>Module introuvable.</Empty>
  const idx = m.lessons.findIndex((l) => l.id === lessonId)
  const lesson = m.lessons[idx]
  if (!lesson) return <Empty>Leçon introuvable.</Empty>
  const next = m.lessons[idx + 1]
  const prev = m.lessons[idx - 1]
  const conceptsInLesson = lesson.blocks.flatMap((b) => (b.type === 'concepts' ? b.ids : []))

  const done = () => {
    recordLessonDone(lesson.id, conceptsInLesson.length ? conceptsInLesson : m.concepts)
    if (next) nav(`/learn/${m.id}/${next.id}`)
    else nav(`/learn/${m.id}`)
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="muted small" style={{ marginBottom: 6 }}>
        <Link to="/learn">Learn</Link> / <Link to={`/learn/${m.id}`}>Module {m.order} — {m.title}</Link>
      </div>
      <div className="lesson-nav" style={{ marginBottom: 16 }}>
        {m.lessons.map((l, i) => (
          <Link key={l.id} to={`/learn/${m.id}/${l.id}`} className={(l.id === lesson.id ? 'active' : '') + (p.lessonsDone[l.id] ? ' done' : '')}>
            {i + 1}. {l.title}
          </Link>
        ))}
      </div>
      <h1>{lesson.title}</h1>
      <div className="muted small" style={{ marginBottom: 16 }}>
        ~{lesson.minutes} min
      </div>
      <Blocks blocks={lesson.blocks} />
      <div className="row between" style={{ marginTop: 28 }}>
        {prev ? (
          <Link to={`/learn/${m.id}/${prev.id}`} className="btn">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        <button className="btn primary" onClick={done}>
          {p.lessonsDone[lesson.id] ? 'Relu ✓' : 'Leçon terminée'} {next ? `→ ${next.title}` : '→ Quiz du module'}
        </button>
      </div>
    </div>
  )
}
