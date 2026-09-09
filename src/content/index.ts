import type {
  Category,
  Concept,
  Domain,
  Journey,
  Module,
  Question,
  ReferenceEntry,
  Scenario,
} from '../types/content'

/**
 * Loads every JSON file under /content at build time.
 * Each file exports either an array of entities or a single entity.
 */
function load<T>(modules: Record<string, unknown>): T[] {
  const out: T[] = []
  for (const path of Object.keys(modules).sort()) {
    const mod = modules[path] as { default?: unknown }
    const data = (mod && 'default' in mod ? mod.default : mod) as T | T[]
    if (Array.isArray(data)) out.push(...data)
    else out.push(data)
  }
  return out
}

export const concepts: Concept[] = load<Concept>(
  import.meta.glob('../../content/concepts/*.json', { eager: true }),
)
export const modules: Module[] = load<Module>(
  import.meta.glob('../../content/modules/*.json', { eager: true }),
).sort((a, b) => a.order - b.order)
export const questions: Question[] = load<Question>(
  import.meta.glob('../../content/questions/*.json', { eager: true }),
)
export const scenarios: Scenario[] = load<Scenario>(
  import.meta.glob('../../content/scenarios/*.json', { eager: true }),
).sort((a, b) => a.order - b.order)
export const journeys: Journey[] = load<Journey>(
  import.meta.glob('../../content/journeys/*.json', { eager: true }),
).sort((a, b) => a.order - b.order)
export const references: ReferenceEntry[] = load<ReferenceEntry>(
  import.meta.glob('../../content/references*.json', { eager: true }),
)

export const conceptById = new Map(concepts.map((c) => [c.id, c]))
export const questionById = new Map(questions.map((q) => [q.id, q]))
export const moduleById = new Map(modules.map((m) => [m.id, m]))
export const scenarioById = new Map(scenarios.map((s) => [s.id, s]))
export const journeyById = new Map(journeys.map((j) => [j.id, j]))

export const CATEGORIES: { id: Category; label: string; color: string }[] = [
  { id: 'networking', label: 'Networking', color: '#2563eb' },
  { id: 'switching', label: 'Switching', color: '#0891b2' },
  { id: 'wifi', label: 'Wi-Fi', color: '#7c3aed' },
  { id: 'security', label: 'Security', color: '#dc2626' },
  { id: 'openwifi', label: 'OpenWiFi', color: '#ea580c' },
  { id: 'operations', label: 'Operations', color: '#16a34a' },
]
export const categoryById = new Map(CATEGORIES.map((c) => [c.id, c]))

export const DOMAINS: { id: Domain; label: string }[] = [
  { id: 'fundamentals', label: 'Network fundamentals' },
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'security', label: 'Authentication & security' },
  { id: 'openwifi', label: 'OpenWiFi' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

/** Maps a concept category to the dashboard domain it counts toward. */
export function domainOfCategory(cat: Category): Domain {
  switch (cat) {
    case 'networking':
    case 'switching':
      return 'fundamentals'
    case 'wifi':
      return 'wifi'
    case 'security':
      return 'security'
    case 'openwifi':
      return 'openwifi'
    case 'operations':
      return 'troubleshooting'
  }
}

export const conceptsByDomain: Record<Domain, Concept[]> = {
  fundamentals: [],
  wifi: [],
  security: [],
  openwifi: [],
  troubleshooting: [],
}
for (const c of concepts) conceptsByDomain[domainOfCategory(c.category)].push(c)

export const OSI_LAYERS = [
  { n: 7, name: 'Application', hint: 'HTTP, DNS, DHCP, RADIUS' },
  { n: 6, name: 'Presentation', hint: 'représentation, chiffrement' },
  { n: 5, name: 'Session', hint: 'sessions et dialogues' },
  { n: 4, name: 'Transport', hint: 'TCP, UDP' },
  { n: 3, name: 'Network', hint: 'IP, routage, ICMP' },
  { n: 2, name: 'Data Link', hint: 'Ethernet, Wi-Fi, MAC, VLAN' },
  { n: 1, name: 'Physical', hint: 'câble, fibre, radio' },
]

export const RELATION_LABELS: Record<string, string> = {
  uses: 'utilise',
  'depends-on': 'dépend de',
  'runs-over': 'circule sur',
  'authenticates-with': "s'authentifie avec",
  assigns: 'attribue',
  encapsulates: 'encapsule',
  controls: 'contrôle',
  'routes-to': 'route vers',
  'belongs-to-layer': 'appartient à la couche',
  related: 'relié à',
}

/** Questions that involve at least one of the given concepts. */
export function questionsForConcepts(ids: string[]): Question[] {
  const set = new Set(ids)
  return questions.filter((q) => q.concepts.some((c) => set.has(c)))
}

/** Modules that teach a concept. */
export function modulesForConcept(id: string): Module[] {
  return modules.filter((m) => m.concepts.includes(id))
}
