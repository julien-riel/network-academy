import type { Question } from '../types/content'

export function typeLabel(t: Question['type']): string {
  return {
    'multiple-choice': 'Choix',
    ordering: 'Ordre',
    matching: 'Qui parle à qui',
    layer: 'Couche OSI',
    troubleshooting: 'Troubleshooting',
    'free-response': 'Explique-le toi-même',
  }[t]
}

export function scoreBand(pct: number): string {
  if (pct < 60) return 'Needs review'
  if (pct < 75) return 'Functional'
  if (pct < 85) return 'Job ready'
  if (pct < 95) return 'Strong'
  return 'Excellent'
}
