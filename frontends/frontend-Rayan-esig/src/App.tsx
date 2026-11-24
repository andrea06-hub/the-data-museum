import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Briefcase,
  Code2,
  Command,
  ExternalLink,
  FolderGit2,
  GitBranch,
  GraduationCap,
  Layers,
  Mail,
  Network,
  Sparkles,
  Terminal,
  User,
  Users,
  Wifi,
  X,
} from 'lucide-react'
import { api } from './api/client'
import {
  DesktopWindow,
  clampRectToViewport,
  type WindowRect,
} from './components/DesktopWindow'
import { SkillGraph } from './components/SkillGraph'
import type {
  CandidatOut,
  CompetencesCommunesOut,
  GraphOut,
  PreuvesOut,
  ProjetOut,
  SimilairesOut,
  StatsOut,
  TransversalesOut,
} from './types/api'

type AppId = 'profil' | 'projets' | 'graphe' | 'terminal'

interface IconPosition {
  x: number
  y: number
}

interface AppDefinition {
  id: AppId
  title: string
  subtitle: string
  gradient: string
  icon: typeof User
}

const APPS: AppDefinition[] = [
  {
    id: 'profil',
    title: 'Profil',
    subtitle: 'Parcours & Bio',
    gradient: 'from-[#007aff] to-[#0051d5]',
    icon: User,
  },
  {
    id: 'projets',
    title: 'Projets',
    subtitle: 'Galerie & Similaires',
    gradient: 'from-[#ff9500] to-[#ff5e3a]',
    icon: FolderGit2,
  },
  {
    id: 'graphe',
    title: 'Graphe Neo4j',
    subtitle: 'Compétences & Preuves',
    gradient: 'from-[#5856d6] to-[#af52de]',
    icon: Network,
  },
  {
    id: 'terminal',
    title: 'API & Stack',
    subtitle: 'Routes R1–R9',
    gradient: 'from-[#2c2c2e] to-[#1c1c1e]',
    icon: Terminal,
  },
]

const DEFAULT_SLUG = 'rayan-marmouri'

function getInitialRect(index: number): WindowRect {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const width = Math.min(860, Math.max(400, vw - 220))
  const height = Math.min(600, Math.max(320, vh - 170))
  const x = Math.max(24, Math.round((vw - width) / 2) + index * 26)
  const y = Math.max(16, 26 + index * 26)
  return clampRectToViewport({ x, y, width, height })
}

function getInitialIconPositions(): Record<AppId, IconPosition> {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const startX = Math.max(20, vw - 124)
  return {
    profil: { x: startX, y: 24 },
    projets: { x: startX, y: 136 },
    graphe: { x: startX, y: 248 },
    terminal: { x: startX, y: 360 },
  }
}

function clampIconPosition(pos: IconPosition): IconPosition {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const maxX = Math.max(12, vw - 108)
  const maxY = Math.max(12, vh - 196)
  return {
    x: Math.min(Math.max(12, pos.x), maxX),
    y: Math.min(Math.max(12, pos.y), maxY),
  }
}

function formatPeriod(debut?: string | null, fin?: string | null) {
  if (!debut) return ''
  const start = debut.slice(0, 7)
  const end = fin ? fin.slice(0, 7) : 'Présent'
  return `${start} — ${end}`
}

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function App() {
  const clock = useClock()

  // Carte Identité (affichée au clic sur le nom en haut à gauche)
  const [showIdentity, setShowIdentity] = useState(false)

  // Positions déplaçables des icônes du bureau
  const [iconPositions, setIconPositions] = useState<Record<AppId, IconPosition>>(() =>
    getInitialIconPositions(),
  )
  const [draggingIconId, setDraggingIconId] = useState<AppId | null>(null)
  const iconDragRef = useRef<{
    id: AppId
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
    moved: boolean
  } | null>(null)
  const suppressIconClickRef = useRef<AppId | null>(null)

  // Gestion des fenêtres (ouvertes, réduites, ordre d'empilement z-index, dimensions)
  const [openApps, setOpenApps] = useState<AppId[]>(['profil'])
  const [minimizedApps, setMinimizedApps] = useState<AppId[]>([])
  const [windowOrder, setWindowOrder] = useState<AppId[]>(['profil'])
  const [maximizedApp, setMaximizedApp] = useState<AppId | null>(null)
  const [windowRects, setWindowRects] = useState<Record<AppId, WindowRect>>(() => ({
    profil: getInitialRect(0),
    projets: getInitialRect(1),
    graphe: getInitialRect(2),
    terminal: getInitialRect(3),
  }))

  // Recadrer les fenêtres et les icônes si le navigateur est redimensionné
  useEffect(() => {
    const onResize = () => {
      setWindowRects((prev) => ({
        profil: clampRectToViewport(prev.profil),
        projets: clampRectToViewport(prev.projets),
        graphe: clampRectToViewport(prev.graphe),
        terminal: clampRectToViewport(prev.terminal),
      }))
      setIconPositions((prev) => ({
        profil: clampIconPosition(prev.profil),
        projets: clampIconPosition(prev.projets),
        graphe: clampIconPosition(prev.graphe),
        terminal: clampIconPosition(prev.terminal),
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const visibleOrder = useMemo(
    () => windowOrder.filter((id) => openApps.includes(id) && !minimizedApps.includes(id)),
    [windowOrder, openApps, minimizedApps],
  )
  const focusedApp = visibleOrder.length > 0 ? visibleOrder[visibleOrder.length - 1] : null

  const focusApp = useCallback((id: AppId) => {
    setMinimizedApps((prev) => prev.filter((item) => item !== id))
    setWindowOrder((prev) => [...prev.filter((item) => item !== id), id])
  }, [])

  const openApp = useCallback(
    (id: AppId) => {
      setOpenApps((prev) => (prev.includes(id) ? prev : [...prev, id]))
      focusApp(id)
    },
    [focusApp],
  )

  const minimizeApp = useCallback((id: AppId) => {
    setMinimizedApps((prev) => (prev.includes(id) ? prev : [...prev, id]))
    setMaximizedApp((prev) => (prev === id ? null : prev))
  }, [])

  const closeApp = useCallback((id: AppId) => {
    setOpenApps((prev) => prev.filter((item) => item !== id))
    setMinimizedApps((prev) => prev.filter((item) => item !== id))
    setWindowOrder((prev) => prev.filter((item) => item !== id))
    setMaximizedApp((prev) => (prev === id ? null : prev))
  }, [])

  const toggleMaximize = useCallback(
    (id: AppId) => {
      focusApp(id)
      setMaximizedApp((prev) => (prev === id ? null : id))
    },
    [focusApp],
  )

  const handleIconPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, id: AppId) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const origin = iconPositions[id]
    iconDragRef.current = {
      id,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: origin.x,
      originY: origin.y,
      moved: false,
    }
  }

  const handleIconPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = iconDragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (!drag.moved && Math.hypot(dx, dy) > 5) {
      drag.moved = true
      setDraggingIconId(drag.id)
    }

    if (drag.moved) {
      setIconPositions((prev) => ({
        ...prev,
        [drag.id]: clampIconPosition({
          x: drag.originX + dx,
          y: drag.originY + dy,
        }),
      }))
    }
  }

  const handleIconPointerUp = (e: ReactPointerEvent<HTMLButtonElement>, id: AppId) => {
    const drag = iconDragRef.current
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    if (drag?.id === id && drag.moved) {
      suppressIconClickRef.current = id
    }
    iconDragRef.current = null
    setDraggingIconId(null)
  }

  // Données API
  const [slug, setSlug] = useState<string>(DEFAULT_SLUG)
  const [teamSlugs, setTeamSlugs] = useState<string[]>([DEFAULT_SLUG])

  const [candidat, setCandidat] = useState<CandidatOut | null>(null)
  const [stats, setStats] = useState<StatsOut | null>(null)
  const [projets, setProjets] = useState<ProjetOut[]>([])
  const [projetsRecents, setProjetsRecents] = useState<ProjetOut[]>([])
  const [graph, setGraph] = useState<GraphOut | null>(null)
  const [transversales, setTransversales] = useState<TransversalesOut | null>(null)

  const [selectedCompetence, setSelectedCompetence] = useState<string | null>(null)
  const [projectScope, setProjectScope] = useState<'candidat' | 'equipe'>('candidat')
  const [activeProjet, setActiveProjet] = useState<ProjetOut | null>(null)
  const [similaires, setSimilaires] = useState<SimilairesOut | null>(null)
  const [loadingSimilaires, setLoadingSimilaires] = useState(false)

  const [selectedSkillPreuve, setSelectedSkillPreuve] = useState<string | null>(null)
  const [preuves, setPreuves] = useState<PreuvesOut | null>(null)
  const [compareSlug, setCompareSlug] = useState<string>('')
  const [communes, setCommunes] = useState<CompetencesCommunesOut | null>(null)

  const [error, setError] = useState<string | null>(null)

  // Raccourci Échap pour fermer la sous-vue, la fenêtre active ou la carte Identité
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeProjet) {
          setActiveProjet(null)
        } else if (focusedApp) {
          closeApp(focusedApp)
        } else if (showIdentity) {
          setShowIdentity(false)
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeProjet, focusedApp, showIdentity, closeApp])

  // R8 : Projets récents & membres de l'équipe
  useEffect(() => {
    api
      .getProjetsRecents(25)
      .then((res) => {
        setProjetsRecents(res.items)
        const slugs = new Set<string>([DEFAULT_SLUG])
        res.items.forEach((p) => p.auteurs.forEach((a) => slugs.add(a)))
        const list = Array.from(slugs)
        setTeamSlugs(list)
        const other = list.find((s) => s !== DEFAULT_SLUG)
        if (other) setCompareSlug(other)
      })
      .catch(() => {})
  }, [])

  // R1, R3, R5, R7
  useEffect(() => {
    let cancelled = false
    setError(null)
    setSelectedCompetence(null)
    setActiveProjet(null)

    Promise.all([
      api.getCandidat(slug),
      api.getStatsCandidat(slug),
      api.getGrapheCompetences(slug),
      api.getCompetencesTransversales(slug, 2),
    ])
      .then(([candData, statsData, graphData, transvData]) => {
        if (cancelled) return
        setCandidat(candData)
        setStats(statsData)
        setGraph(graphData)
        setTransversales(transvData)
        if (statsData.competences.length > 0) {
          setSelectedSkillPreuve(statsData.competences[0].skill_slug)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  // R2
  useEffect(() => {
    api
      .getProjetsCandidat(slug, selectedCompetence ?? undefined)
      .then((res) => setProjets(res.items))
      .catch(() => setProjets([]))
  }, [slug, selectedCompetence])

  // R4
  useEffect(() => {
    if (!activeProjet) {
      setSimilaires(null)
      return
    }
    setLoadingSimilaires(true)
    api
      .getProjetsSimilaires(activeProjet.projet_slug, 4)
      .then(setSimilaires)
      .catch(() => setSimilaires(null))
      .finally(() => setLoadingSimilaires(false))
  }, [activeProjet])

  // R9
  useEffect(() => {
    if (!selectedSkillPreuve) return
    api
      .getPreuvesCompetence(selectedSkillPreuve)
      .then(setPreuves)
      .catch(() => setPreuves(null))
  }, [selectedSkillPreuve])

  // R6
  useEffect(() => {
    if (!compareSlug || compareSlug === slug) {
      setCommunes(null)
      return
    }
    api
      .getCompetencesCommunes([slug, compareSlug])
      .then(setCommunes)
      .catch(() => setCommunes(null))
  }, [slug, compareSlug])

  const displayedProjects = useMemo(() => {
    if (projectScope === 'equipe') {
      if (!selectedCompetence) return projetsRecents
      return projetsRecents.filter((p) =>
        p.competences.some((c) => c.skill_slug === selectedCompetence),
      )
    }
    return projets
  }, [projectScope, projets, projetsRecents, selectedCompetence])

  const activeAppMeta = APPS.find((a) => a.id === focusedApp)

  return (
    <div
      className="relative flex h-screen w-screen flex-col overflow-hidden"
      style={{
        background:
          'radial-gradient(circle at 18% 22%, #dce7ff 0%, transparent 45%), radial-gradient(circle at 82% 18%, #f3e4ff 0%, transparent 42%), radial-gradient(circle at 55% 85%, #e3f2fd 0%, transparent 50%), linear-gradient(135deg, #eef1f8 0%, #e4e8f2 100%)',
      }}
    >
      {/* ==================== BARRE DES MENUS MACOS ==================== */}
      <header className="z-50 flex h-8 shrink-0 select-none items-center justify-between border-b border-black/[0.06] bg-white/65 px-4 text-xs backdrop-blur-2xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowIdentity((prev) => !prev)}
            title="Afficher ou masquer la carte Identité"
            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-semibold tracking-tight transition ${
              showIdentity
                ? 'bg-[#0071e3]/12 text-[#0071e3]'
                : 'text-[#1d1d1f] hover:bg-black/[0.06]'
            }`}
          >
            <Command className="h-3.5 w-3.5 text-[#0071e3]" />
            <span>{candidat ? `${candidat.prenom} ${candidat.nom}` : 'Portfolio OS'}</span>
          </button>

          {activeAppMeta && (
            <span className="font-semibold text-[#1d1d1f]">{activeAppMeta.title}</span>
          )}
          <div className="hidden items-center gap-3 text-[#424245] sm:flex">
            <button onClick={() => openApp('profil')} className="hover:text-[#0071e3]">
              Parcours
            </button>
            <button onClick={() => openApp('projets')} className="hover:text-[#0071e3]">
              Projets
            </button>
            <button onClick={() => openApp('graphe')} className="hover:text-[#0071e3]">
              Graphe
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3.5 text-[#1d1d1f]">
          {teamSlugs.length > 1 && (
            <select
              aria-label="Profil affiché"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="rounded-md border border-black/10 bg-white/70 px-2 py-0.5 text-[11px] font-medium outline-none"
            >
              {teamSlugs.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
          <span
            title={error ? 'API déconnectée' : 'Connecté à FastAPI (MongoDB + Neo4j)'}
            className="flex items-center gap-1 text-[11px] text-[#424245]"
          >
            <Wifi className={`h-3.5 w-3.5 ${error ? 'text-red-500' : 'text-[#0071e3]'}`} />
          </span>
          <span className="font-medium capitalize text-[#1d1d1f]">{clock}</span>
        </div>
      </header>

      {/* ==================== ESPACE DU BUREAU ==================== */}
      <main className="relative flex-1 overflow-hidden p-5 sm:p-7">
        {/* Carte Identité (affichée au clic sur le nom en haut à gauche) */}
        <div className="relative z-10 flex max-w-xs select-none flex-col gap-4">
          {showIdentity && candidat && (
            <div
              onClick={() => openApp('profil')}
              className="animate-window-open relative cursor-pointer rounded-3xl border border-white/80 bg-white/80 p-5 shadow-[0_12px_36px_rgba(0,0,0,0.09)] backdrop-blur-2xl transition hover:bg-white/95"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowIdentity(false)
                }}
                aria-label="Fermer la carte Identité"
                className="absolute right-3.5 top-3.5 rounded-full bg-black/[0.05] p-1 text-[#6e6e73] transition hover:bg-black/10 hover:text-[#1d1d1f]"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#0071e3]">
                Identité
              </p>
              <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#1d1d1f]">
                {candidat.prenom} {candidat.nom}
              </h1>
              <p className="mt-0.5 text-xs text-[#6e6e73]">{candidat.titre}</p>
              {stats && (
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-black/[0.06] pt-3">
                  <div>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{stats.nb_projets}</p>
                    <p className="text-[11px] text-[#86868b]">Projets</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#1d1d1f]">{stats.nb_competences}</p>
                    <p className="text-[11px] text-[#86868b]">Compétences</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-white/85 p-4 text-xs text-red-600 backdrop-blur-xl">
              API hors ligne ({error}). Démarre FastAPI sur le port 8000.
            </div>
          )}
        </div>

        {/* Icônes d'applications déplaçables sur le bureau */}
        {APPS.map((app) => {
          const Icon = app.icon
          const isOpen = openApps.includes(app.id)
          const pos = iconPositions[app.id]
          const isDragging = draggingIconId === app.id

          return (
            <button
              key={app.id}
              type="button"
              onPointerDown={(e) => handleIconPointerDown(e, app.id)}
              onPointerMove={handleIconPointerMove}
              onPointerUp={(e) => handleIconPointerUp(e, app.id)}
              onPointerCancel={(e) => handleIconPointerUp(e, app.id)}
              onClick={() => {
                if (suppressIconClickRef.current === app.id) {
                  suppressIconClickRef.current = null
                  return
                }
                openApp(app.id)
              }}
              style={{
                left: `${pos.x}px`,
                top: `${pos.y}px`,
              }}
              className={`group absolute flex w-24 select-none flex-col items-center gap-1.5 rounded-2xl p-2 text-center touch-none focus:outline-none ${
                isDragging
                  ? 'z-30 cursor-grabbing scale-105 bg-white/45 shadow-lg backdrop-blur-md'
                  : 'z-10 cursor-grab transition-colors hover:bg-white/35'
              }`}
            >
              <div
                className={`relative flex h-14 w-14 items-center justify-center rounded-[16px] bg-gradient-to-br ${app.gradient} text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] ring-1 ring-white/40 transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon className="h-7 w-7 stroke-[1.9]" />
              </div>
              <span className="rounded-md px-1.5 py-0.5 text-[11px] font-medium text-[#1d1d1f] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] group-hover:bg-[#0071e3] group-hover:text-white group-hover:drop-shadow-none">
                {app.title}
              </span>
              {isOpen && <span className="h-1 w-1 rounded-full bg-[#1d1d1f]/60" />}
            </button>
          )
        })}

        {/* ==================== FENÊTRES D'APPLICATIONS ==================== */}
        {openApps.map((appId) => {
          const meta = APPS.find((a) => a.id === appId)!
          const orderIndex = visibleOrder.indexOf(appId)
          const zIndex = orderIndex >= 0 ? 20 + orderIndex : 20

          return (
            <DesktopWindow
              key={appId}
              title={meta.title}
              subtitle={meta.subtitle}
              rect={windowRects[appId]}
              zIndex={zIndex}
              isFocused={focusedApp === appId}
              isMaximized={maximizedApp === appId}
              isMinimized={minimizedApps.includes(appId)}
              onFocus={() => focusApp(appId)}
              onClose={() => closeApp(appId)}
              onMinimize={() => minimizeApp(appId)}
              onToggleMaximize={() => toggleMaximize(appId)}
              onChangeRect={(nextRect) =>
                setWindowRects((prev) => ({ ...prev, [appId]: nextRect }))
              }
            >
              {/* ---------- APP 1 : PROFIL & PARCOURS ---------- */}
              {appId === 'profil' && candidat && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-2xs">
                    <p className="text-xs font-medium uppercase tracking-widest text-[#0071e3]">
                      Candidat · {candidat.candidat_slug}
                    </p>
                    <h2 className="mt-1.5 text-3xl font-semibold tracking-tight">
                      {candidat.prenom} {candidat.nom}
                    </h2>
                    <p className="mt-1 text-base text-[#6e6e73]">{candidat.titre}</p>
                    {candidat.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-[#424245]">{candidat.bio}</p>
                    )}

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                      {candidat.contacts.email && (
                        <a
                          href={`mailto:${candidat.contacts.email}`}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-black/80"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {candidat.contacts.email}
                        </a>
                      )}
                      {candidat.contacts.github && (
                        <a
                          href={candidat.contacts.github}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-medium hover:bg-[#e8e8ed]"
                        >
                          <GitBranch className="h-3.5 w-3.5" />
                          GitHub
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#86868b]" />
                        </a>
                      )}
                      {candidat.contacts.linkedin && (
                        <a
                          href={candidat.contacts.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-medium hover:bg-[#e8e8ed]"
                        >
                          LinkedIn
                          <ArrowUpRight className="h-3.5 w-3.5 text-[#86868b]" />
                        </a>
                      )}
                      {candidat.langues.map((l) => (
                        <span
                          key={l.langue}
                          className="rounded-full border border-black/[0.06] px-3 py-1 text-xs text-[#6e6e73]"
                        >
                          {l.langue} · {l.niveau}
                        </span>
                      ))}
                    </div>
                  </div>

                  {stats && stats.competences.length > 0 && (
                    <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">Stack technique (R3)</h3>
                        <span className="text-xs text-[#86868b]">
                          Cliquer ouvre Projets filtrés
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {stats.competences.map((comp) => (
                          <button
                            key={comp.skill_slug}
                            onClick={() => {
                              setSelectedCompetence(comp.skill_slug)
                              setProjectScope('candidat')
                              setActiveProjet(null)
                              openApp('projets')
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.07] bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-medium transition hover:border-[#0071e3]/40 hover:bg-[#0071e3]/[0.07]"
                          >
                            <span>{comp.nom}</span>
                            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-semibold text-[#6e6e73]">
                              {comp.nb_projets}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs">
                      <div className="mb-4 flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-[#0071e3]" />
                        <h3 className="text-base font-semibold">Expériences</h3>
                      </div>
                      <div className="space-y-5 border-l border-black/10 pl-4">
                        {candidat.experiences.map((exp, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#0071e3]" />
                            <p className="text-[11px] font-medium text-[#86868b]">
                              {formatPeriod(exp.debut, exp.fin)}
                              {exp.type ? ` · ${exp.type}` : ''}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold">{exp.poste}</p>
                            <p className="text-xs font-medium text-[#424245]">{exp.entreprise}</p>
                            {exp.description && (
                              <p className="mt-1.5 text-xs leading-relaxed text-[#6e6e73]">
                                {exp.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs">
                      <div className="mb-4 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#0071e3]" />
                        <h3 className="text-base font-semibold">Formation</h3>
                      </div>
                      <div className="space-y-5 border-l border-black/10 pl-4">
                        {candidat.formations.map((form, idx) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#1d1d1f]" />
                            <p className="text-[11px] font-medium text-[#86868b]">
                              {formatPeriod(form.debut, form.fin)}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold">{form.diplome}</p>
                            <p className="text-xs text-[#6e6e73]">{form.ecole}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---------- APP 2 : PROJETS & SIMILAIRES (R2, R8, R4) ---------- */}
              {appId === 'projets' && (
                <div className="space-y-6">
                  {activeProjet ? (
                    <div className="space-y-6">
                      <button
                        onClick={() => setActiveProjet(null)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-[#1d1d1f] shadow-2xs hover:bg-[#e8e8ed]"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Retour aux projets
                      </button>

                      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-2xs">
                        <p className="text-xs font-medium uppercase tracking-wider text-[#0071e3]">
                          {activeProjet.type ?? 'Projet'} ·{' '}
                          {formatPeriod(activeProjet.date_debut, activeProjet.date_fin)}
                        </p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                          {activeProjet.titre}
                        </h2>
                        {activeProjet.description && (
                          <p className="mt-3 text-sm leading-relaxed text-[#424245]">
                            {activeProjet.description}
                          </p>
                        )}
                        {activeProjet.resultats && (
                          <div className="mt-4 rounded-2xl bg-[#f5f5f7] p-4">
                            <p className="text-xs font-semibold">Résultats</p>
                            <p className="mt-1 text-xs text-[#424245]">{activeProjet.resultats}</p>
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {activeProjet.competences.map((c) => (
                            <span
                              key={c.skill_slug}
                              className="rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium"
                            >
                              {c.nom}
                            </span>
                          ))}
                        </div>

                        {(activeProjet.liens.github || activeProjet.liens.demo) && (
                          <div className="mt-5 flex flex-wrap gap-2.5">
                            {activeProjet.liens.github && (
                              <a
                                href={activeProjet.liens.github}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#1d1d1f] px-4 py-2 text-xs font-medium text-white hover:bg-black/80"
                              >
                                <FolderGit2 className="h-3.5 w-3.5" />
                                GitHub
                              </a>
                            )}
                            {activeProjet.liens.demo && (
                              <a
                                href={activeProjet.liens.demo}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-2 text-xs font-medium text-white hover:bg-[#0077ed]"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Démo
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-3xl border border-black/[0.06] bg-white p-7 shadow-2xs">
                        <div className="mb-3 flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-[#0071e3]" />
                          <h3 className="text-sm font-semibold">
                            Projets similaires recommandés par Neo4j (R4)
                          </h3>
                        </div>
                        {loadingSimilaires ? (
                          <p className="text-xs text-[#86868b]">Calcul des similarités…</p>
                        ) : similaires && similaires.similaires.length > 0 ? (
                          <div className="space-y-2.5">
                            {similaires.similaires.map((sim) => (
                              <div
                                key={sim.projet_slug}
                                className="flex items-center justify-between gap-3 rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/70 p-3.5"
                              >
                                <div>
                                  <p className="text-sm font-semibold">{sim.titre}</p>
                                  <p className="mt-0.5 text-xs text-[#6e6e73]">
                                    En commun : {sim.competences_communes.join(', ')}
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0071e3]">
                                  {sim.score} tag{sim.score > 1 ? 's' : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#86868b]">
                            Aucun projet similaire trouvé dans le graphe.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex rounded-full bg-[#e8e8ed] p-1">
                          <button
                            onClick={() => setProjectScope('candidat')}
                            className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                              projectScope === 'candidat'
                                ? 'bg-white text-[#1d1d1f] shadow-2xs'
                                : 'text-[#6e6e73]'
                            }`}
                          >
                            {candidat?.prenom ?? 'Candidat'} ({projets.length})
                          </button>
                          <button
                            onClick={() => setProjectScope('equipe')}
                            className={`rounded-full px-3.5 py-1 text-xs font-medium transition ${
                              projectScope === 'equipe'
                                ? 'bg-white text-[#1d1d1f] shadow-2xs'
                                : 'text-[#6e6e73]'
                            }`}
                          >
                            Récents équipe ({projetsRecents.length})
                          </button>
                        </div>
                      </div>

                      {stats && stats.competences.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => setSelectedCompetence(null)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                              selectedCompetence === null
                                ? 'bg-[#1d1d1f] text-white'
                                : 'bg-white text-[#424245] hover:bg-[#e8e8ed]'
                            }`}
                          >
                            Tous
                          </button>
                          {stats.competences.map((c) => (
                            <button
                              key={c.skill_slug}
                              onClick={() =>
                                setSelectedCompetence(
                                  selectedCompetence === c.skill_slug ? null : c.skill_slug,
                                )
                              }
                              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                                selectedCompetence === c.skill_slug
                                  ? 'bg-[#0071e3] text-white'
                                  : 'bg-white text-[#424245] hover:bg-[#e8e8ed]'
                              }`}
                            >
                              {c.nom}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {displayedProjects.map((proj) => (
                          <article
                            key={proj.projet_slug}
                            onClick={() => setActiveProjet(proj)}
                            className="group flex cursor-pointer flex-col justify-between rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <div>
                              <div className="flex items-center justify-between text-[11px] text-[#86868b]">
                                <span className="uppercase tracking-wider">
                                  {proj.type ?? 'Projet'}
                                </span>
                                <span>{formatPeriod(proj.date_debut, proj.date_fin)}</span>
                              </div>
                              <h3 className="mt-1.5 text-lg font-semibold group-hover:text-[#0071e3]">
                                {proj.titre}
                              </h3>
                              {proj.description && (
                                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#6e6e73]">
                                  {proj.description}
                                </p>
                              )}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                              {proj.competences.map((c) => (
                                <span
                                  key={c.skill_slug}
                                  className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-[11px] font-medium text-[#424245]"
                                >
                                  {c.nom}
                                </span>
                              ))}
                            </div>
                          </article>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ---------- APP 3 : GRAPHE & COMPÉTENCES (R5, R7, R9, R6) ---------- */}
              {appId === 'graphe' && (
                <div className="space-y-6">
                  {graph && (
                    <SkillGraph
                      graph={graph}
                      selectedSkillSlug={selectedSkillPreuve}
                      onSelectSkill={(s) => setSelectedSkillPreuve(s)}
                    />
                  )}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs">
                      <div className="mb-3 flex items-center gap-2">
                        <Layers className="h-4 w-4 text-[#0071e3]" />
                        <h3 className="text-base font-semibold">
                          Compétences transversales (R7)
                        </h3>
                      </div>
                      <div className="space-y-2.5">
                        {transversales?.competences.length ? (
                          transversales.competences.map((t) => (
                            <button
                              key={t.skill_slug}
                              onClick={() => setSelectedSkillPreuve(t.skill_slug)}
                              className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                                selectedSkillPreuve === t.skill_slug
                                  ? 'border-[#0071e3] bg-[#0071e3]/[0.05]'
                                  : 'border-black/[0.06] bg-[#f5f5f7]/60 hover:bg-[#f5f5f7]'
                              }`}
                            >
                              <div>
                                <p className="text-xs font-semibold">{t.nom}</p>
                                <p className="mt-0.5 text-[11px] text-[#86868b]">
                                  {t.projets.join(' · ')}
                                </p>
                              </div>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-[#0071e3]">
                                {t.nb_projets} projets
                              </span>
                            </button>
                          ))
                        ) : (
                          <p className="text-xs text-[#86868b]">
                            Aucune compétence transversale.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs">
                      <div className="mb-3 flex items-center gap-2">
                        <Code2 className="h-4 w-4 text-[#0071e3]" />
                        <h3 className="text-base font-semibold">
                          Preuves · {preuves?.nom ?? selectedSkillPreuve ?? 'Compétence'} (R9)
                        </h3>
                      </div>
                      {preuves && preuves.candidats.length > 0 ? (
                        <div className="space-y-2.5">
                          {preuves.candidats.map((cp) => (
                            <div
                              key={cp.candidat_slug}
                              className="rounded-2xl border border-black/[0.06] bg-[#f5f5f7]/60 p-3.5"
                            >
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold">
                                  {cp.prenom} {cp.nom}
                                </p>
                                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium">
                                  {cp.nb_projets} preuve(s)
                                </span>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {cp.projets.map((pr) => (
                                  <span
                                    key={pr.projet_slug}
                                    className="rounded-full bg-white px-2.5 py-0.5 text-[11px] text-[#424245]"
                                  >
                                    {pr.titre}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#86868b]">
                          Clique sur un nœud compétence du graphe.
                        </p>
                      )}
                    </div>
                  </div>

                  {teamSlugs.length > 1 && (
                    <div className="rounded-3xl border border-black/[0.06] bg-white p-6 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-[#0071e3]" />
                          <h3 className="text-base font-semibold">
                            Compétences communes équipe (R6)
                          </h3>
                        </div>
                        <select
                          value={compareSlug}
                          onChange={(e) => setCompareSlug(e.target.value)}
                          className="rounded-full border border-black/[0.08] bg-[#f5f5f7] px-3.5 py-1 text-xs font-medium outline-none"
                        >
                          {teamSlugs
                            .filter((s) => s !== slug)
                            .map((s) => (
                              <option key={s} value={s}>
                                Comparer avec {s}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {communes && communes.competences_communes.length > 0 ? (
                          communes.competences_communes.map((c) => (
                            <span
                              key={c.skill_slug}
                              className="rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-medium text-[#0071e3]"
                            >
                              {c.nom}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-[#86868b]">
                            Aucune compétence commune enregistrée.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ---------- APP 4 : TERMINAL / ARCHITECTURE API ---------- */}
              {appId === 'terminal' && (
                <div className="rounded-2xl bg-[#1d1d1f] p-6 font-mono text-xs text-[#f5f5f7] shadow-inner">
                  <p className="text-[#30d158]">
                    rayan@esigelec-nosql:~$ curl -s http://127.0.0.1:8000/api/health
                  </p>
                  <p className="mt-1 text-[#98989d]">{`{"status": "ok", "databases": ["MongoDB Atlas", "Neo4j Aura"]}`}</p>

                  <p className="mt-5 text-[#30d158]">
                    rayan@esigelec-nosql:~$ cat API_ROUTES.md | grep "GET"
                  </p>
                  <ul className="mt-2 space-y-1.5 text-[#d1d1d6]">
                    <li>
                      <span className="text-[#64d2ff]">[R1 Mongo]</span> GET /api/candidats/{slug}
                    </li>
                    <li>
                      <span className="text-[#64d2ff]">[R2 Mongo]</span> GET /api/candidats/{slug}
                      /projets
                    </li>
                    <li>
                      <span className="text-[#64d2ff]">[R3 Mongo]</span> GET /api/candidats/{slug}
                      /stats
                    </li>
                    <li>
                      <span className="text-[#bf5af2]">[R4 Neo4j]</span> GET
                      /api/graph/projets/:slug/similaires
                    </li>
                    <li>
                      <span className="text-[#bf5af2]">[R5 Neo4j]</span> GET
                      /api/graph/competences/{slug}
                    </li>
                    <li>
                      <span className="text-[#bf5af2]">[R6 Neo4j]</span> GET
                      /api/graph/competences/communes
                    </li>
                    <li>
                      <span className="text-[#bf5af2]">[R7 Neo4j]</span> GET
                      /api/graph/candidats/{slug}/competences-transversales
                    </li>
                    <li>
                      <span className="text-[#64d2ff]">[R8 Mongo]</span> GET /api/projets/recents
                    </li>
                    <li>
                      <span className="text-[#ff9f0a]">[R9 Hybride]</span> GET
                      /api/competences/:slug/preuves
                    </li>
                  </ul>
                </div>
              )}
            </DesktopWindow>
          )
        })}
      </main>

      {/* ==================== DOCK FLOTTANT EN BAS ==================== */}
      <footer className="z-50 flex select-none justify-center pb-3">
        <div className="flex items-center gap-2.5 rounded-3xl border border-white/60 bg-white/55 px-3.5 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
          {APPS.map((app) => {
            const Icon = app.icon
            const isOpen = openApps.includes(app.id)
            const isFocused = focusedApp === app.id
            return (
              <button
                key={app.id}
                onClick={() => openApp(app.id)}
                title={`${app.title} — ${app.subtitle}`}
                className="group relative flex flex-col items-center"
              >
                <span className="pointer-events-none absolute -top-9 rounded-lg bg-[#1d1d1f]/85 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-sm backdrop-blur-md transition-opacity group-hover:opacity-100">
                  {app.title}
                </span>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${app.gradient} text-white shadow-md ring-1 ring-white/40 transition-all duration-200 group-hover:-translate-y-1.5 group-hover:scale-110 ${
                    isFocused ? 'ring-2 ring-[#0071e3]' : ''
                  }`}
                >
                  <Icon className="h-5 w-5 stroke-[2]" />
                </div>
                <span
                  className={`mt-1 h-1 w-1 rounded-full transition-opacity ${
                    isOpen ? 'bg-[#1d1d1f] opacity-80' : 'opacity-0'
                  }`}
                />
              </button>
            )
          })}
        </div>
      </footer>
    </div>
  )
}
