'use client'
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { CheckCircle2, Circle, TrendingUp, PenLine, Leaf, Briefcase, Megaphone, Flame } from 'lucide-react'
import Link from 'next/link'
import clsx from 'clsx'
import { loadData, saveData, getTodayKey } from '@/lib/storage'
import { getCurrentPhase, phaseInfo } from '@/lib/cycleUtils'
import type { AppData, HabitEntry } from '@/lib/types'

function getStreak(log: HabitEntry[], habit: 'meditation' | 'sleep' | 'beauty'): number {
  const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let expected = getTodayKey()
  for (const entry of sorted) {
    if (entry.date === expected && entry[habit]) {
      streak++
      const d = new Date(expected)
      d.setDate(d.getDate() - 1)
      expected = d.toISOString().slice(0, 10)
    } else if (entry.date < expected) break
    else if (entry.date === expected && !entry[habit]) break
  }
  return streak
}

export default function Dashboard() {
  const [data, setData] = useState<AppData | null>(null)
  const today = getTodayKey()

  useEffect(() => { setData(loadData()) }, [])

  if (!data) return <div className="p-8 text-wm-muted">Loading...</div>

  const todayEntry = data.wellness.habitLog.find(e => e.date === today)
  const phase = getCurrentPhase(data.wellness.cycleData)
  const pi = phaseInfo[phase]

  const habits: { key: 'meditation' | 'sleep' | 'beauty'; label: string; done: boolean; icon: string }[] = [
    { key: 'meditation', label: 'Meditation', done: !!todayEntry?.meditation, icon: '🧘' },
    { key: 'sleep',      label: 'Good sleep',  done: !!todayEntry?.sleep,     icon: '🌙' },
    { key: 'beauty',     label: 'Beauty',       done: !!todayEntry?.beauty,    icon: '✨' },
  ]

  function toggleHabit(key: 'meditation' | 'sleep' | 'beauty') {
    const updated = { ...data! }
    const existing = updated.wellness.habitLog.find(e => e.date === today)
    if (existing) {
      existing[key] = !existing[key]
    } else {
      updated.wellness.habitLog.unshift({
        date: today,
        meditation: key === 'meditation',
        sleep: key === 'sleep',
        beauty: key === 'beauty',
      })
    }
    setData({ ...updated })
    saveData(updated)
  }

  const compPct = Math.round(((data.career.currentComp - 117000) / (data.career.targetComp - 117000)) * 100)
  const readinessSkills = data.career.skills.map(s => s.proficiency)
  const avgReadiness = Math.round(readinessSkills.reduce((a, b) => a + b, 0) / readinessSkills.length)

  const pendingPosts = data.content.posts.filter(p => p.status !== 'published').length
  const publishedPosts = data.content.posts.filter(p => p.status === 'published').length

  const medStreak = getStreak(data.wellness.habitLog, 'meditation')
  const sleepStreak = getStreak(data.wellness.habitLog, 'sleep')
  const beautyStreak = getStreak(data.wellness.habitLog, 'beauty')

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-wm-dark">
          {greeting}, Ariana 👋
        </h1>
        <p className="text-wm-muted text-sm mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')} · {pi.energy}
        </p>
      </div>

      {/* Daily check-in */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-wm-warm">
        <h2 className="font-medium text-wm-dark mb-4 text-sm uppercase tracking-wide">Today's check-in</h2>
        <div className="grid grid-cols-3 gap-3">
          {habits.map(h => (
            <button
              key={h.key}
              onClick={() => toggleHabit(h.key)}
              className={clsx(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium',
                h.done
                  ? 'border-wm-mid bg-wm-mid/10 text-wm-mid'
                  : 'border-wm-warm bg-wm-cream text-wm-muted hover:border-wm-sage'
              )}
            >
              <span className="text-2xl">{h.icon}</span>
              <span>{h.label}</span>
              {h.done
                ? <CheckCircle2 size={16} className="text-wm-mid" />
                : <Circle size={16} className="text-wm-warm" />
              }
            </button>
          ))}
        </div>
      </section>

      {/* Streaks */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Meditation', streak: medStreak, icon: '🧘', color: 'text-wm-mid' },
          { label: 'Sleep', streak: sleepStreak, icon: '🌙', color: 'text-wm-gold' },
          { label: 'Beauty', streak: beautyStreak, icon: '✨', color: 'text-wm-coral' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-wm-warm text-center">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className={clsx('text-2xl font-bold', s.color)}>{s.streak}</div>
            <div className="text-xs text-wm-muted mt-0.5">{s.label} streak</div>
            {s.streak > 0 && <div className="text-xs mt-1 text-wm-gold flex items-center justify-center gap-1"><Flame size={10} />{s.streak}d</div>}
          </div>
        ))}
      </div>

      {/* Cycle phase banner */}
      <section
        className="rounded-2xl p-5 border"
        style={{ backgroundColor: pi.color + '15', borderColor: pi.color + '40' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: pi.color }}>{pi.label}</p>
            <p className="text-sm text-wm-dark font-medium">{pi.wellnessTip}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {pi.foodTips.map(tip => (
            <span key={tip} className="text-xs px-2.5 py-1 rounded-full bg-white/70 text-wm-dark">{tip}</span>
          ))}
        </div>
      </section>

      {/* 4 pillar cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/career" className="group bg-white rounded-2xl p-5 shadow-sm border border-wm-warm hover:border-wm-sage transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-wm-mid/10 flex items-center justify-center">
              <Briefcase size={16} className="text-wm-mid" />
            </div>
            <span className="font-medium text-sm text-wm-dark">Career</span>
          </div>
          <div className="text-2xl font-bold text-wm-mid">{avgReadiness}%</div>
          <p className="text-xs text-wm-muted mt-1">Avg skill readiness</p>
          <div className="mt-3 h-1.5 bg-wm-warm rounded-full">
            <div className="h-full bg-wm-mid rounded-full" style={{ width: `${avgReadiness}%` }} />
          </div>
          <p className="text-xs text-wm-coral mt-2 font-medium">
            $117k → $180k
          </p>
        </Link>

        <Link href="/wellness" className="group bg-white rounded-2xl p-5 shadow-sm border border-wm-warm hover:border-wm-sage transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Leaf size={16} className="text-green-600" />
            </div>
            <span className="font-medium text-sm text-wm-dark">Wellness</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {habits.filter(h => h.done).length}/3
          </div>
          <p className="text-xs text-wm-muted mt-1">Habits done today</p>
          <div className="mt-3 flex gap-1">
            {habits.map(h => (
              <div key={h.key} className={clsx('flex-1 h-1.5 rounded-full', h.done ? 'bg-green-500' : 'bg-wm-warm')} />
            ))}
          </div>
          <p className="text-xs text-wm-muted mt-2">{pi.label}</p>
        </Link>

        <Link href="/content" className="group bg-white rounded-2xl p-5 shadow-sm border border-wm-warm hover:border-wm-sage transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-wm-coral/10 flex items-center justify-center">
              <Megaphone size={16} className="text-wm-coral" />
            </div>
            <span className="font-medium text-sm text-wm-dark">Content</span>
          </div>
          <div className="text-2xl font-bold text-wm-coral">{publishedPosts}</div>
          <p className="text-xs text-wm-muted mt-1">Published posts</p>
          <div className="mt-3 h-1.5 bg-wm-warm rounded-full">
            <div className="h-full bg-wm-coral rounded-full" style={{ width: `${Math.min(100, (publishedPosts / 12) * 100)}%` }} />
          </div>
          <p className="text-xs text-wm-muted mt-2">{pendingPosts} in queue</p>
        </Link>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-wm-warm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-wm-gold/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-wm-gold" />
            </div>
            <span className="font-medium text-sm text-wm-dark">Growth</span>
          </div>
          <div className="text-2xl font-bold text-wm-gold">
            {data.content.platformStats.linkedin.followers.toLocaleString()}
          </div>
          <p className="text-xs text-wm-muted mt-1">LinkedIn followers</p>
          <div className="mt-3 h-1.5 bg-wm-warm rounded-full">
            <div
              className="h-full bg-wm-gold rounded-full"
              style={{ width: `${Math.round((data.content.platformStats.linkedin.followers / data.content.platformStats.linkedin.targetFollowers) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-wm-muted mt-2">
            {data.content.platformStats.substack.followers} Substack subs
          </p>
        </div>
      </div>

      {/* Upcoming posts */}
      <section className="bg-white rounded-2xl p-5 shadow-sm border border-wm-warm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-medium text-wm-dark text-sm uppercase tracking-wide">Content queue</h2>
          <Link href="/content" className="text-xs text-wm-mid hover:underline flex items-center gap-1">
            <PenLine size={12} /> View all
          </Link>
        </div>
        <div className="space-y-2">
          {data.content.posts.filter(p => p.status !== 'published').map(post => {
            const pillar = data.content.pillars.find(p2 => p2.id === post.pillarId)
            return (
              <div key={post.id} className="flex items-center gap-3 p-3 rounded-lg bg-wm-cream">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: pillar?.color ?? '#999' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-wm-dark truncate">{post.title}</p>
                  <p className="text-xs text-wm-muted capitalize">{post.platform} · {post.status}</p>
                </div>
                {post.scheduledDate && (
                  <span className="text-xs text-wm-muted flex-shrink-0">
                    {format(parseISO(post.scheduledDate), 'MMM d')}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
