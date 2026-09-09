import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import ModulePage from './pages/ModulePage'
import LessonPage from './pages/LessonPage'
import JourneyPage from './pages/JourneyPage'
import ConceptMapPage from './pages/ConceptMapPage'
import LabsPage from './pages/LabsPage'
import LabPage from './pages/LabPage'
import TestsPage from './pages/TestsPage'
import QuizPage from './pages/QuizPage'
import GlossaryPage from './pages/GlossaryPage'
import ConceptPage from './pages/ConceptPage'
import ReferencePage from './pages/ReferencePage'

const NAV = [
  { to: '/', label: 'Dashboard', icon: '◫' },
  { to: '/learn', label: 'Learn', icon: '▤' },
  { to: '/journey', label: 'Network Journey', icon: '⇝' },
  { to: '/map', label: 'Concept Map', icon: '⬡' },
  { to: '/labs', label: 'Labs', icon: '⚒' },
  { to: '/tests', label: 'Tests', icon: '✓' },
  { to: '/glossary', label: 'Glossary', icon: '≡' },
  { to: '/reference', label: 'Reference', icon: '§' },
]

export default function App() {
  return (
    <div className="app">
      <nav className="sidebar">
        <div className="brand">
          NetExperience<br />Network Academy
          <small>Mon téléphone se connecte au Wi-Fi. Que se passe-t-il?</small>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span aria-hidden>{n.icon}</span> {n.label}
          </NavLink>
        ))}
        <div className="spacer" />
        <div className="foot">Contenu data-driven · progression locale</div>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:moduleId" element={<ModulePage />} />
          <Route path="/learn/:moduleId/:lessonId" element={<LessonPage />} />
          <Route path="/journey" element={<JourneyPage />} />
          <Route path="/journey/:journeyId" element={<JourneyPage />} />
          <Route path="/map" element={<ConceptMapPage />} />
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/labs/:labId" element={<LabPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/tests/:kind" element={<QuizPage />} />
          <Route path="/glossary" element={<GlossaryPage />} />
          <Route path="/concepts/:conceptId" element={<ConceptPage />} />
          <Route path="/reference" element={<ReferencePage />} />
        </Routes>
      </main>
    </div>
  )
}
