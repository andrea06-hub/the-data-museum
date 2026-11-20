import { useMemo, useState } from 'react'
import type { GraphNode, GraphOut } from '../types/api'

interface PositionedNode extends GraphNode {
  x: number
  y: number
  r: number
}

interface SkillGraphProps {
  graph: GraphOut
  selectedSkillSlug: string | null
  onSelectSkill: (skillSlug: string) => void
}

export function SkillGraph({ graph, selectedSkillSlug, onSelectSkill }: SkillGraphProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { positionedNodes, nodeMap } = useMemo(() => {
    const cx = 420
    const cy = 260
    const result: PositionedNode[] = []

    const candidats = graph.nodes.filter((n) => n.type === 'candidat')
    const projets = graph.nodes.filter((n) => n.type === 'projet')
    const competences = graph.nodes.filter((n) => n.type === 'competence')

    candidats.forEach((n) => {
      result.push({ ...n, x: cx, y: cy, r: 28 })
    })

    projets.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(projets.length, 1) - Math.PI / 2
      result.push({
        ...n,
        x: cx + 115 * Math.cos(angle),
        y: cy + 100 * Math.sin(angle),
        r: 18,
      })
    })

    competences.forEach((n, i) => {
      const angle = (2 * Math.PI * i) / Math.max(competences.length, 1) - Math.PI / 3
      const bonus = Math.min((n.nb_projets ?? 1) * 2.5, 10)
      result.push({
        ...n,
        x: cx + 225 * Math.cos(angle),
        y: cy + 195 * Math.sin(angle),
        r: 13 + bonus,
      })
    })

    const map = new Map<string, PositionedNode>()
    result.forEach((n) => map.set(n.id, n))
    return { positionedNodes: result, nodeMap: map }
  }, [graph])

  const connectedIds = useMemo(() => {
    if (!hoveredId) return null
    const set = new Set<string>([hoveredId])
    graph.links.forEach((l) => {
      if (l.source === hoveredId) set.add(l.target)
      if (l.target === hoveredId) set.add(l.source)
    })
    return set
  }, [hoveredId, graph.links])

  return (
    <div className="relative w-full overflow-hidden rounded-3xl border border-black/[0.06] bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-2">
        <div className="flex items-center gap-4 text-xs text-[#86868b]">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#1d1d1f]" /> Candidat
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0071e3]" /> Projet
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#e8e8ed] ring-1 ring-black/15" /> Compétence (cliquable)
          </span>
        </div>
        <span className="text-xs text-[#86868b]">
          {graph.nodes.length} nœuds · {graph.links.length} relations Neo4j
        </span>
      </div>

      <svg viewBox="0 0 840 520" className="h-[440px] w-full select-none">
        {/* Arêtes */}
        <g>
          {graph.links.map((link, idx) => {
            const s = nodeMap.get(link.source)
            const t = nodeMap.get(link.target)
            if (!s || !t) return null

            const isHighlighted =
              !hoveredId || link.source === hoveredId || link.target === hoveredId

            return (
              <line
                key={`${link.source}-${link.target}-${idx}`}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={link.type === 'A_REALISE' ? '#0071e3' : '#86868b'}
                strokeOpacity={isHighlighted ? (hoveredId ? 0.55 : 0.22) : 0.05}
                strokeWidth={isHighlighted && hoveredId ? 1.8 : 1.1}
                className="transition-all duration-200"
              />
            )
          })}
        </g>

        {/* Nœuds */}
        <g>
          {positionedNodes.map((node) => {
            const dimmed = connectedIds && !connectedIds.has(node.id)
            const isSkill = node.type === 'competence'
            const skillSlug = isSkill ? node.id.replace(/^competence:/, '') : null
            const isSelected = skillSlug !== null && skillSlug === selectedSkillSlug

            let fill = '#f5f5f7'
            let stroke = 'rgba(0,0,0,0.14)'
            let textColor = '#1d1d1f'

            if (node.type === 'candidat') {
              fill = '#1d1d1f'
              stroke = '#1d1d1f'
              textColor = '#1d1d1f'
            } else if (node.type === 'projet') {
              fill = '#0071e3'
              stroke = '#0071e3'
              textColor = '#1d1d1f'
            } else if (isSelected) {
              fill = '#0071e3'
              stroke = '#0071e3'
            }

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredId(node.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => skillSlug && onSelectSkill(skillSlug)}
                style={{ opacity: dimmed ? 0.25 : 1 }}
                className={`transition-opacity duration-200 ${isSkill ? 'cursor-pointer' : ''}`}
              >
                <circle
                  r={node.r}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                {node.type === 'competence' && node.nb_projets && (
                  <text
                    textAnchor="middle"
                    dy="3.5"
                    fontSize="10"
                    fontWeight="600"
                    fill={isSelected ? '#ffffff' : '#1d1d1f'}
                  >
                    {node.nb_projets}
                  </text>
                )}
                <text
                  y={node.r + 14}
                  textAnchor="middle"
                  fontSize={node.type === 'candidat' ? '12' : '11'}
                  fontWeight={node.type === 'candidat' ? '600' : '500'}
                  fill={textColor}
                >
                  {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}