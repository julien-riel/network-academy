import { describe, expect, it } from 'vitest'
import { findPath, neighbours } from './graph'
import { gradeFreeResponse, normalize } from './grading'
import type { FreeResponseQuestion } from '../types/content'

describe('graph', () => {
  it('finds a path RADIUS → DHCP through VLAN', () => {
    const path = findPath('radius', 'dhcp')
    expect(path).not.toBeNull()
    const ids = path!.map((p) => p.concept.id)
    expect(ids[0]).toBe('radius')
    expect(ids[ids.length - 1]).toBe('dhcp')
    expect(ids.length).toBeLessThanOrEqual(4)
    expect(ids).toContain('vlan')
  })

  it('lists neighbours with relation labels', () => {
    const n = neighbours('8021x')
    expect(n.some((x) => x.concept.id === 'radius')).toBe(true)
    expect(n.every((x) => x.edge.label.length > 0)).toBe(true)
  })
})

describe('grading', () => {
  it('normalizes accents and case', () => {
    expect(normalize('Réseau Wi-Fi')).toBe('reseau wi-fi')
  })

  it('detects expected ideas in a free response', () => {
    const q: FreeResponseQuestion = {
      id: 'x',
      type: 'free-response',
      concepts: ['radius'],
      domain: 'security',
      difficulty: 1,
      prompt: '',
      explanation: '',
      sampleAnswer: '',
      expected: [
        { label: 'AAA', keywords: ['aaa', 'central'] },
        { label: 'AP client', keywords: ['access point', 'nas'] },
      ],
    }
    const g = gradeFreeResponse(q, "RADIUS est un serveur AAA central ; l'Access Point est son client.")
    expect(g.score).toBe(1)
    expect(g.correct).toBe(true)
    expect(gradeFreeResponse(q, 'Aucune idée.').score).toBe(0)
  })
})
