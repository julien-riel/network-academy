import { Link } from 'react-router-dom'
import { modules, questions } from '../content'
import { useProgress } from '../engine/progress'
import { scoreBand } from '../components/quizUtils'

export default function TestsPage() {
  const p = useProgress()
  const last = (kind: string) => [...p.results].reverse().find((r) => r.kind === kind)
  const cards = [
    {
      to: '/tests/diagnostic',
      title: 'Diagnostic initial',
      desc: '30 questions, aucun enseignement préalable. Mesure OSI, Ethernet, IP, Wi-Fi, switching, AAA, OpenWiFi, troubleshooting.',
      last: last('diagnostic'),
    },
    {
      to: '/tests/practice',
      title: 'Quiz de pratique',
      desc: '10 questions choisies selon tes concepts faibles et leur priorité de révision. Feedback immédiat.',
      last: last('practice'),
    },
    {
      to: '/tests/interview',
      title: 'Mode Interview',
      desc: 'Questions ouvertes uniquement. Tu réponds librement, l’application vérifie que les concepts importants sont présents.',
      last: last('interview'),
    },
    {
      to: '/tests/exam',
      title: 'Examen final',
      desc: '50 questions : 10 fundamentals, 10 Wi-Fi, 10 authentication/security, 10 OpenWiFi, 10 troubleshooting. Feedback à la fin seulement.',
      last: last('exam'),
    },
  ]
  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Tests</h1>
          <p>
            {questions.length} questions dans la banque : choix, ordre, qui parle à qui, placement OSI, troubleshooting et
            réponses libres. Une bonne réponse augmente le score de maîtrise ; une erreur le réduit un peu et augmente la
            priorité de révision.
          </p>
        </div>
      </div>
      <div className="grid grid-2">
        {cards.map((c) => (
          <Link key={c.to} to={c.to} className="card clickable" style={{ color: 'inherit' }}>
            <h2>{c.title}</h2>
            <p className="muted">{c.desc}</p>
            {c.last && (
              <div className="small">
                Dernier résultat : <strong>{Math.round((c.last.score / c.last.total) * 100)} %</strong> ·{' '}
                {scoreBand(Math.round((c.last.score / c.last.total) * 100))} · {new Date(c.last.date).toLocaleDateString('fr-CA')}
              </div>
            )}
          </Link>
        ))}
      </div>
      <h2 style={{ marginTop: 24 }}>Quiz par module</h2>
      <div className="row">
        {modules.map((m) => (
          <Link key={m.id} to={`/tests/practice?module=${m.id}`} className="chip">
            {m.order}. {m.title}
          </Link>
        ))}
      </div>
      {p.results.length > 0 && (
        <>
          <h2 style={{ marginTop: 24 }}>Historique</h2>
          <div className="card">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {[...p.results].reverse().slice(0, 15).map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleString('fr-CA')}</td>
                    <td>
                      {r.kind}
                      {r.moduleId ? ` · ${modules.find((m) => m.id === r.moduleId)?.title ?? r.moduleId}` : ''}
                    </td>
                    <td>
                      {Math.round((r.score / r.total) * 100)} % ({r.score.toFixed(1)}/{r.total})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
