/**
 * Data model for all learning content.
 * Everything the app teaches lives in /content as JSON that conforms to these types.
 * No network concept should be hard-coded inside a React component.
 */

export type Category =
  | 'networking'
  | 'switching'
  | 'wifi'
  | 'security'
  | 'openwifi'
  | 'operations'

/** Domains used for the dashboard, the diagnostic and the final exam. */
export type Domain =
  | 'fundamentals'
  | 'wifi'
  | 'security'
  | 'openwifi'
  | 'troubleshooting'

export type RelationType =
  | 'uses'
  | 'depends-on'
  | 'runs-over'
  | 'authenticates-with'
  | 'assigns'
  | 'encapsulates'
  | 'controls'
  | 'routes-to'
  | 'belongs-to-layer'
  | 'related'

export interface Relation {
  conceptId: string
  type: RelationType
  /** Optional short label shown on the edge, e.g. "délègue la décision à". */
  label?: string
}

export interface PortDefinition {
  protocol: 'UDP' | 'TCP'
  port: number
  role?: string
}

export interface FlowStep {
  from: string
  to: string
  label: string
  note?: string
}

export interface Source {
  title: string
  url: string
  kind?: 'rfc' | 'ieee' | 'iso' | 'project' | 'vendor' | 'doc'
}

export interface Concept {
  id: string
  name: string
  aliases: string[]
  shortDefinition: string
  /** "Pourquoi ça existe" */
  whyItExists?: string
  /** "Qui parle à qui" */
  whoTalksToWhom?: string
  /** "Quand ça arrive" */
  when?: string
  /** Longer explanation, markdown-lite (paragraphs separated by blank lines). */
  explanation: string
  /** Comparison with a software / cloud concept the persona already knows. */
  softwareAnalogy?: string
  category: Category
  difficulty: 1 | 2 | 3
  osiLayers?: number[]
  prerequisites: string[]
  relatedConcepts: Relation[]
  actors?: string[]
  ports?: PortDefinition[]
  packetFlow?: FlowStep[]
  failureSymptoms?: string[]
  /** "Approfondir" — optional deeper notes. */
  goDeeper?: string
  sources: Source[]
}

/* ---------- Questions ---------- */

interface QuestionBase {
  id: string
  concepts: string[]
  domain: Domain
  difficulty: 1 | 2 | 3
  prompt: string
  explanation: string
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple-choice'
  choices: string[]
  /** Index of the correct choice. */
  answer: number
}

export interface OrderingQuestion extends QuestionBase {
  type: 'ordering'
  /** Items listed in the correct order; the UI shuffles them. */
  items: string[]
}

export interface MatchingQuestion extends QuestionBase {
  type: 'matching'
  pairs: { left: string; right: string }[]
}

export interface LayerQuestion extends QuestionBase {
  type: 'layer'
  /** Items to place on OSI layers. `layers` lists every accepted layer. */
  items: { label: string; layers: number[] }[]
}

export interface TroubleshootingQuestion extends QuestionBase {
  type: 'troubleshooting'
  choices: string[]
  answer: number
}

export interface FreeResponseQuestion extends QuestionBase {
  type: 'free-response'
  /** Each expected idea, with keywords (lower-case, accent-insensitive) that reveal it. */
  expected: { label: string; keywords: string[] }[]
  sampleAnswer: string
}

export type Question =
  | MultipleChoiceQuestion
  | OrderingQuestion
  | MatchingQuestion
  | LayerQuestion
  | TroubleshootingQuestion
  | FreeResponseQuestion

export type QuestionType = Question['type']

/* ---------- Lessons & modules ---------- */

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'callout'; kind: 'idea' | 'warning' | 'analogy' | 'remember'; title?: string; text: string }
  | { type: 'diagram'; title?: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] }
  | { type: 'concepts'; ids: string[] }
  | { type: 'sequence'; title?: string; actors: string[]; steps: FlowStep[] }
  | { type: 'exercise'; questionIds: string[]; title?: string }
  | { type: 'takeaways'; items: string[] }

export interface Lesson {
  id: string
  title: string
  minutes: number
  blocks: Block[]
}

export interface Module {
  id: string
  order: number
  title: string
  subtitle: string
  domain: Domain
  /** Concepts this module teaches (used for progress & recommendations). */
  concepts: string[]
  prerequisites: string[]
  lessons: Lesson[]
  /** Question ids for the end-of-module quiz. */
  quiz: string[]
}

/* ---------- Scenarios (troubleshooting labs) ---------- */

export interface ScenarioChoice {
  label: string
  correct?: boolean
  feedback: string
}

export interface ScenarioStep {
  prompt: string
  choices: ScenarioChoice[]
}

export interface Scenario {
  id: string
  order: number
  title: string
  difficulty: 1 | 2 | 3
  concepts: string[]
  symptom: string
  facts: string[]
  steps: ScenarioStep[]
  /** Expected reasoning chain, one line per hop. */
  reasoning: string[]
  takeaway: string
}

/* ---------- Packet journeys ---------- */

export interface JourneyStep {
  n: number
  label: string
  /** Short summary shown in the timeline. */
  summary: string
  physical?: string
  protocol?: string
  osi?: string
  packet?: string
  device?: string
  source?: string
  destination?: string
  purpose: string
  concepts: string[]
  /** Where to look if this step fails. */
  ifItBreaks?: string
}

export interface Journey {
  id: string
  order: number
  title: string
  trigger: string
  description: string
  steps: JourneyStep[]
}

export interface ReferenceEntry {
  id: string
  title: string
  description: string
  url: string
  kind: Source['kind']
  concepts: string[]
}
