'use client'
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Circle, Plus, BookOpen, TrendingUp, Target, Building2 } from 'lucide-react'
import clsx from 'clsx'
import { loadData, saveData } from '@/lib/storage'
import type { AppData, Skill, JobApplication, Milestone } from '@/lib/types'

const categoryColors: Record<string, string> = {
  ai: '#2D6A4F',
  search: '#D4A853',
  localization: '#E85D4A',
  data: '#7DAA83',
  growth: '#F4A5AC',
  leadership: '#8A8070',
}

const categoryLabels: Record<string, string> = {
  ai: 'AI', search: 'Search', localization: 'L10n', data: 'Data', growth: 'Growth', leadership: 'Leadership',
}

const statusColors: Record<string, string> = {
  researching: 'bg-gray-100 text-gray-600',
  applied: 'bg-blue-50 text-blue-700',
  screening: 'bg-yellow-50 text-yellow-700',
  interviewing: 'bg-orange-50 text-orange-700',
  offer: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  accepted: 'bg-emerald-100 text-emerald-700',
}

function SkillBar({ skill }: { skill: Skill }) {
  const color = categoryColors[skill.category] ?? '#999'
  return (
    <div className="bg-white rounded-xl p-4 border border-wm-warm shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium text-sm text-wm-dark">{skill.name}</p>
          <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: color + '20', color }}>
            {categoryLabels[skill.category]}
          </span>
        </div>
        <span className="text-lg font-bold" style={{ color }}>{skill.proficiency}%</span>
      </div>
      <div className="mt-3 space-y-1">
        <div className="h-2 bg-wm-warm rounded-full relative overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${skill.proficiency}%`, backgroundColor: color }} />
          {/* Target marker */}
          <div className="absolute top-0 h-full w-0.5 bg-wm-dark/30" style={{ left: `${skill.target}%` }} />
        </div>
        <div className="flex justify-between text-xs text-wm-muted">
          <span>Now: {skill.proficiency}%</span>
          <span>Target: {skill.target}%</span>
        </div>
      </div>
      <p className="text-xs text-wm-muted mt-2 italic">→ {skill.nextStep}</p>
    </div>
  )
}

export default function CareerPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('')
  const [newMilestoneDate, setNewMilestoneDate] = useState('')
  const [showAddApp, setShowAddApp] = useState(false)
  const [newApp, setNewApp] = useState({ company: '', role: '', compMin: '', compMax: '', notes: '' })

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return <div className="p-8 text-wm-muted">Loading...</div>

  const { career } = data

  const compGap = career.targetComp - career.currentComp
  const compGapPct = Math.round((compGap / career.currentComp) * 100)
  const avgSkill = Math.round(career.skills.reduce((a, s) => a + s.proficiency, 0) / career.skills.length)

  function toggleMilestone(id: string) {
    const updated = { ...data! }
    const m = updated.career.milestones.find(m => m.id === id)
    if (!m) return
    m.completed = !m.completed
    m.completedDate = m.completed ? new Date().toISOString().slice(0, 10) : undefined
    setData({ ...updated })
    saveData(updated)
  }

  function addMilestone() {
    if (!newMilestoneTitle.trim()) return
    const updated = { ...data! }
    updated.career.milestones.push({
      id: `m${Date.now()}`,
      title: newMilestoneTitle,
      description: '',
      targetDate: newMilestoneDate || '2026-12-31',
      completed: false,
      category: 'career',
    })
    setData({ ...updated })
    saveData(updated)
    setNewMilestoneTitle('')
    setNewMilestoneDate('')
  }

  function addApplication() {
    if (!newApp.company.trim() || !newApp.role.trim()) return
    const updated = { ...data! }
    updated.career.applications.push({
      id: `a${Date.now()}`,
      company: newApp.company,
      role: newApp.role,
      status: 'researching',
      compMin: newApp.compMin ? parseInt(newApp.compMin) : undefined,
      compMax: newApp.compMax ? parseInt(newApp.compMax) : undefined,
      notes: newApp.notes,
      isInternal: false,
    })
    setData({ ...updated })
    saveData(updated)
    setNewApp({ company: '', role: '', compMin: '', compMax: '', notes: '' })
    setShowAddApp(false)
  }

  function updateAppStatus(id: string, status: JobApplication['status']) {
    const updated = { ...data! }
    const app = updated.career.applications.find(a => a.id === id)
    if (app) app.status = status
    setData({ ...updated })
    saveData(updated)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-wm-dark">Career</h1>
        <p className="text-wm-muted text-sm mt-1">{career.currentRole} at {career.currentCompany} → {career.targetRole}</p>
      </div>

      {/* Comp tracker */}
      <section className="bg-wm-green text-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Compensation goal</p>
            <p className="text-4xl font-bold">${career.targetComp.toLocaleString()}</p>
            <p className="text-sm text-white/60 mt-1">
              Currently ${career.currentComp.toLocaleString()} · +${compGap.toLocaleString()} (+{compGapPct}%) needed
            </p>
          </div>
          <div className="text-right">
            <TrendingUp size={28} className="text-wm-gold ml-auto" />
            <p className="text-xs text-white/50 mt-1">by EOY 2026</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-white/60 mb-1">
            <span>Skill readiness</span>
            <span>{avgSkill}% avg</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full">
            <div className="h-full bg-wm-gold rounded-full transition-all" style={{ width: `${avgSkill}%` }} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-lg font-bold">{career.milestones.filter(m => m.completed).length}/{career.milestones.length}</p>
            <p className="text-xs text-white/60">Milestones done</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-lg font-bold">{career.applications.length}</p>
            <p className="text-xs text-white/60">Applications</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <p className="text-lg font-bold">{career.learningLog.length}</p>
            <p className="text-xs text-white/60">Learning entries</p>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section>
        <h2 className="font-medium text-wm-dark mb-4">Skill Matrix</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {career.skills.map(skill => <SkillBar key={skill.id} skill={skill} />)}
        </div>
      </section>

      {/* Milestones */}
      <section>
        <h2 className="font-medium text-wm-dark mb-4">Milestones</h2>
        <div className="space-y-2">
          {career.milestones.map(m => (
            <div
              key={m.id}
              className={clsx(
                'flex items-start gap-3 p-4 rounded-xl border transition-colors',
                m.completed ? 'bg-wm-cream border-wm-warm opacity-70' : 'bg-white border-wm-warm shadow-sm'
              )}
            >
              <button onClick={() => toggleMilestone(m.id)} className="mt-0.5 flex-shrink-0">
                {m.completed
                  ? <CheckCircle2 size={20} className="text-wm-mid" />
                  : <Circle size={20} className="text-wm-warm" />
                }
              </button>
              <div className="flex-1 min-w-0">
                <p className={clsx('font-medium text-sm', m.completed && 'line-through text-wm-muted')}>{m.title}</p>
                {m.description && <p className="text-xs text-wm-muted mt-0.5">{m.description}</p>}
              </div>
              <span className="text-xs text-wm-muted flex-shrink-0">
                {format(parseISO(m.targetDate), 'MMM d')}
              </span>
            </div>
          ))}
        </div>
        {/* Add milestone */}
        <div className="mt-3 flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage"
            placeholder="Add milestone..."
            value={newMilestoneTitle}
            onChange={e => setNewMilestoneTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addMilestone()}
          />
          <input
            type="date"
            className="px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage"
            value={newMilestoneDate}
            onChange={e => setNewMilestoneDate(e.target.value)}
          />
          <button
            onClick={addMilestone}
            className="px-4 py-2 bg-wm-mid text-white rounded-lg text-sm font-medium hover:bg-wm-green transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* Job applications */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-wm-dark">Applications</h2>
          <button
            onClick={() => setShowAddApp(!showAddApp)}
            className="flex items-center gap-1.5 text-sm text-wm-mid hover:text-wm-dark font-medium"
          >
            <Plus size={16} /> Add
          </button>
        </div>

        {showAddApp && (
          <div className="bg-wm-cream rounded-xl p-4 border border-wm-warm mb-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input className="px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage" placeholder="Company" value={newApp.company} onChange={e => setNewApp(p => ({ ...p, company: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage" placeholder="Role" value={newApp.role} onChange={e => setNewApp(p => ({ ...p, role: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage" placeholder="Min comp ($)" type="number" value={newApp.compMin} onChange={e => setNewApp(p => ({ ...p, compMin: e.target.value }))} />
              <input className="px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage" placeholder="Max comp ($)" type="number" value={newApp.compMax} onChange={e => setNewApp(p => ({ ...p, compMax: e.target.value }))} />
            </div>
            <textarea className="w-full px-3 py-2 rounded-lg border border-wm-warm text-sm bg-white focus:outline-none focus:border-wm-sage resize-none" placeholder="Notes..." rows={2} value={newApp.notes} onChange={e => setNewApp(p => ({ ...p, notes: e.target.value }))} />
            <div className="flex gap-2">
              <button onClick={addApplication} className="px-4 py-2 bg-wm-mid text-white rounded-lg text-sm font-medium">Add application</button>
              <button onClick={() => setShowAddApp(false)} className="px-4 py-2 text-wm-muted rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {career.applications.map(app => (
            <div key={app.id} className="bg-white rounded-xl p-4 border border-wm-warm shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-wm-muted flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-wm-dark">{app.company}</p>
                    <p className="text-xs text-wm-muted">{app.role}</p>
                  </div>
                  {app.isInternal && (
                    <span className="text-xs px-2 py-0.5 bg-wm-gold/20 text-wm-gold rounded-full">Internal</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {app.compMin && (
                    <span className="text-xs text-wm-muted">
                      ${(app.compMin / 1000).toFixed(0)}k{app.compMax ? `–${(app.compMax / 1000).toFixed(0)}k` : '+'}
                    </span>
                  )}
                  <select
                    value={app.status}
                    onChange={e => updateAppStatus(app.id, e.target.value as JobApplication['status'])}
                    className={clsx('text-xs px-2 py-1 rounded-full border-0 focus:outline-none font-medium cursor-pointer', statusColors[app.status])}
                  >
                    {(['researching', 'applied', 'screening', 'interviewing', 'offer', 'rejected', 'accepted'] as const).map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              {app.notes && <p className="text-xs text-wm-muted mt-2 pl-6">{app.notes}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* Learning log */}
      <section>
        <h2 className="font-medium text-wm-dark mb-4 flex items-center gap-2">
          <BookOpen size={16} className="text-wm-mid" /> Learning Log
        </h2>
        <div className="space-y-2">
          {career.learningLog.map(entry => (
            <div key={entry.id} className="flex gap-3 p-3 bg-white rounded-xl border border-wm-warm shadow-sm">
              <div className="text-xs text-wm-muted w-20 flex-shrink-0 pt-0.5">
                {format(parseISO(entry.date), 'MMM d')}
              </div>
              <div>
                <p className="text-sm font-medium text-wm-dark">{entry.resource}</p>
                <p className="text-xs text-wm-muted capitalize">{entry.type} · {entry.topic}</p>
                {entry.notes && <p className="text-xs text-wm-muted mt-1 italic">{entry.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
