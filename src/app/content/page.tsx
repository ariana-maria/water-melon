'use client'
import { useState, useEffect } from 'react'
import { format, parseISO, startOfWeek, eachDayOfInterval, addDays } from 'date-fns'
import { Plus, Linkedin, ExternalLink, BarChart2, Edit3, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'
import { loadData, saveData } from '@/lib/storage'
import type { AppData, ContentPost, PostPlatform, PostStatus } from '@/lib/types'

const statusColors: Record<PostStatus, string> = {
  idea:      'bg-gray-100 text-gray-600',
  drafting:  'bg-yellow-50 text-yellow-700',
  scheduled: 'bg-blue-50 text-blue-700',
  published: 'bg-green-50 text-green-700',
}

const platformIcon = (p: PostPlatform) =>
  p === 'linkedin' ? '💼' : p === 'substack' ? '📨' : '💼📨'

export default function ContentPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [view, setView] = useState<'calendar' | 'queue' | 'pillars'>('queue')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', platform: 'linkedin' as PostPlatform, pillarId: '', scheduledDate: '', body: '' })

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return <div className="p-8 text-wm-muted">Loading...</div>

  const { content } = data
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: thisWeekStart, end: addDays(thisWeekStart, 6) })

  const publishedThisMonth = content.posts.filter(p =>
    p.status === 'published' &&
    p.publishedDate?.startsWith(new Date().toISOString().slice(0, 7))
  )

  function addPost() {
    if (!newPost.title.trim()) return
    const updated = { ...data! }
    updated.content.posts.unshift({
      id: `post${Date.now()}`,
      title: newPost.title,
      body: newPost.body || undefined,
      status: 'idea',
      platform: newPost.platform,
      pillarId: newPost.pillarId || updated.content.pillars[0].id,
      scheduledDate: newPost.scheduledDate || undefined,
      tags: [],
    })
    setData({ ...updated })
    saveData(updated)
    setNewPost({ title: '', platform: 'linkedin', pillarId: '', scheduledDate: '', body: '' })
    setShowNew(false)
  }

  function updateStatus(id: string, status: PostStatus) {
    const updated = { ...data! }
    const post = updated.content.posts.find(p => p.id === id)
    if (!post) return
    post.status = status
    if (status === 'published' && !post.publishedDate) {
      post.publishedDate = new Date().toISOString().slice(0, 10)
    }
    setData({ ...updated })
    saveData(updated)
  }

  function updatePost(id: string, fields: Partial<ContentPost>) {
    const updated = { ...data! }
    const idx = updated.content.posts.findIndex(p => p.id === id)
    if (idx >= 0) updated.content.posts[idx] = { ...updated.content.posts[idx], ...fields }
    setData({ ...updated })
    saveData(updated)
    setEditingId(null)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-wm-dark">Content</h1>
        <p className="text-wm-muted text-sm mt-1">LinkedIn · Substack · Your professional + personal brand</p>
      </div>

      {/* Platform stats */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-wm-green text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Linkedin size={18} />
            <span className="font-medium">LinkedIn</span>
          </div>
          <p className="text-3xl font-bold">{content.platformStats.linkedin.followers.toLocaleString()}</p>
          <p className="text-sm text-white/60">followers · target {content.platformStats.linkedin.targetFollowers.toLocaleString()}</p>
          <div className="mt-3 h-1.5 bg-white/20 rounded-full">
            <div
              className="h-full bg-wm-gold rounded-full"
              style={{ width: `${Math.min(100, (content.platformStats.linkedin.followers / content.platformStats.linkedin.targetFollowers) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-white/50 mt-2">
            {content.platformStats.linkedin.postsThisMonth} posts this month · target {content.platformStats.linkedin.targetPerMonth}/mo
          </p>
        </div>

        <div className="bg-wm-coral text-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📨</span>
            <span className="font-medium">Substack</span>
          </div>
          <p className="text-3xl font-bold">{content.platformStats.substack.followers}</p>
          <p className="text-sm text-white/70">subscribers · target {content.platformStats.substack.targetFollowers}</p>
          <div className="mt-3 h-1.5 bg-white/30 rounded-full">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: content.platformStats.substack.followers === 0 ? '2%' : `${(content.platformStats.substack.followers / content.platformStats.substack.targetFollowers) * 100}%` }}
            />
          </div>
          <p className="text-xs text-white/70 mt-2">
            {content.platformStats.substack.postsThisMonth === 0
              ? '🚀 First issue unlocks everything'
              : `${content.platformStats.substack.postsThisMonth} issues · target ${content.platformStats.substack.targetPerMonth}/mo`}
          </p>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-wm-warm rounded-xl p-1 w-fit">
        {(['queue', 'calendar', 'pillars'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors',
              view === v ? 'bg-white text-wm-dark shadow-sm' : 'text-wm-muted hover:text-wm-dark'
            )}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Queue view */}
      {view === 'queue' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-wm-dark">All posts</h2>
            <button
              onClick={() => setShowNew(!showNew)}
              className="flex items-center gap-1.5 text-sm text-wm-mid hover:text-wm-dark font-medium"
            >
              <Plus size={16} /> New post
            </button>
          </div>

          {showNew && (
            <div className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm space-y-3">
              <input
                className="w-full px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage"
                placeholder="Post title or hook..."
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              />
              <textarea
                className="w-full px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage resize-none"
                rows={3}
                placeholder="Draft body (optional)..."
                value={newPost.body}
                onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))}
              />
              <div className="grid sm:grid-cols-3 gap-3">
                <select
                  className="px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage"
                  value={newPost.platform}
                  onChange={e => setNewPost(p => ({ ...p, platform: e.target.value as PostPlatform }))}
                >
                  <option value="linkedin">LinkedIn</option>
                  <option value="substack">Substack</option>
                  <option value="both">Both</option>
                </select>
                <select
                  className="px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage"
                  value={newPost.pillarId}
                  onChange={e => setNewPost(p => ({ ...p, pillarId: e.target.value }))}
                >
                  <option value="">Select pillar...</option>
                  {content.pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="date"
                  className="px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage"
                  value={newPost.scheduledDate}
                  onChange={e => setNewPost(p => ({ ...p, scheduledDate: e.target.value }))}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={addPost} className="px-4 py-2 bg-wm-mid text-white rounded-lg text-sm font-medium">Add to queue</button>
                <button onClick={() => setShowNew(false)} className="px-4 py-2 text-wm-muted rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          )}

          {(['idea', 'drafting', 'scheduled', 'published'] as PostStatus[]).map(status => {
            const posts = content.posts.filter(p => p.status === status)
            if (posts.length === 0) return null
            return (
              <div key={status}>
                <p className="text-xs font-semibold text-wm-muted uppercase tracking-wide mb-2 capitalize">{status}</p>
                <div className="space-y-2">
                  {posts.map(post => {
                    const pillar = content.pillars.find(p => p.id === post.pillarId)
                    const isEditing = editingId === post.id
                    return (
                      <div key={post.id} className="bg-white rounded-xl p-4 border border-wm-warm shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: pillar?.color ?? '#999' }} />
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <EditPost post={post} pillars={content.pillars} onSave={fields => updatePost(post.id, fields)} onCancel={() => setEditingId(null)} />
                            ) : (
                              <>
                                <p className="font-medium text-sm text-wm-dark">{post.title}</p>
                                {post.body && <p className="text-xs text-wm-muted mt-1 line-clamp-2">{post.body}</p>}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="text-lg">{platformIcon(post.platform)}</span>
                                  {pillar && (
                                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: pillar.color + '20', color: pillar.color }}>
                                      {pillar.name}
                                    </span>
                                  )}
                                  {post.scheduledDate && (
                                    <span className="text-xs text-wm-muted">{format(parseISO(post.scheduledDate), 'MMM d')}</span>
                                  )}
                                  {post.engagement?.likes && (
                                    <span className="text-xs text-wm-muted">❤️ {post.engagement.likes} · 💬 {post.engagement.comments} · 👁 {post.engagement.views?.toLocaleString()}</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {!isEditing && (
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <select
                                value={post.status}
                                onChange={e => updateStatus(post.id, e.target.value as PostStatus)}
                                className={clsx('text-xs px-2 py-1 rounded-full border-0 focus:outline-none font-medium cursor-pointer', statusColors[post.status])}
                              >
                                {(['idea', 'drafting', 'scheduled', 'published'] as PostStatus[]).map(s => (
                                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                ))}
                              </select>
                              <button onClick={() => setEditingId(post.id)} className="text-wm-muted hover:text-wm-dark">
                                <Edit3 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <section>
          <h2 className="font-medium text-wm-dark mb-4">This week</h2>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const key = day.toISOString().slice(0, 10)
              const dayPosts = content.posts.filter(p => p.scheduledDate === key || p.publishedDate === key)
              return (
                <div key={key} className="min-h-24">
                  <p className={clsx(
                    'text-xs font-medium mb-2 text-center',
                    key === new Date().toISOString().slice(0, 10) ? 'text-wm-coral' : 'text-wm-muted'
                  )}>
                    {format(day, 'EEE')}<br />{format(day, 'd')}
                  </p>
                  <div className="space-y-1">
                    {dayPosts.map(p => {
                      const pillar = content.pillars.find(pl => pl.id === p.pillarId)
                      return (
                        <div
                          key={p.id}
                          className="text-xs px-1.5 py-1 rounded-md truncate"
                          style={{ backgroundColor: (pillar?.color ?? '#999') + '20', color: pillar?.color ?? '#999' }}
                          title={p.title}
                        >
                          {platformIcon(p.platform)} {p.title.slice(0, 20)}…
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Pillars view */}
      {view === 'pillars' && (
        <section className="space-y-4">
          <h2 className="font-medium text-wm-dark">Content pillars</h2>
          {content.pillars.map(pillar => {
            const pillarPosts = content.posts.filter(p => p.pillarId === pillar.id)
            const published = pillarPosts.filter(p => p.status === 'published').length
            const pct = Math.min(100, Math.round((published / pillar.targetPerMonth) * 100))
            return (
              <div key={pillar.id} className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-wm-dark">{pillar.name}</p>
                    <p className="text-xs text-wm-muted mt-0.5">{pillar.description}</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: pillar.color }}>{published}/{pillar.targetPerMonth}</span>
                </div>
                <div className="h-2 bg-wm-warm rounded-full">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pillar.color }} />
                </div>
                <p className="text-xs text-wm-muted mt-2">{pillarPosts.length} total posts · {published} published this month</p>
              </div>
            )
          })}
        </section>
      )}
    </div>
  )
}

function EditPost({
  post,
  pillars,
  onSave,
  onCancel,
}: {
  post: ContentPost
  pillars: AppData['content']['pillars']
  onSave: (fields: Partial<ContentPost>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body ?? '')
  const [pillarId, setPillarId] = useState(post.pillarId)
  const [platform, setPlatform] = useState(post.platform)
  const [scheduledDate, setScheduledDate] = useState(post.scheduledDate ?? '')

  return (
    <div className="space-y-2">
      <input className="w-full px-2 py-1 text-sm border border-wm-sage rounded-lg focus:outline-none" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea className="w-full px-2 py-1 text-xs border border-wm-warm rounded-lg resize-none focus:outline-none" rows={3} value={body} onChange={e => setBody(e.target.value)} placeholder="Body (optional)" />
      <div className="flex gap-2 flex-wrap">
        <select className="text-xs px-2 py-1 border border-wm-warm rounded-lg focus:outline-none" value={platform} onChange={e => setPlatform(e.target.value as PostPlatform)}>
          <option value="linkedin">LinkedIn</option>
          <option value="substack">Substack</option>
          <option value="both">Both</option>
        </select>
        <select className="text-xs px-2 py-1 border border-wm-warm rounded-lg focus:outline-none" value={pillarId} onChange={e => setPillarId(e.target.value)}>
          {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" className="text-xs px-2 py-1 border border-wm-warm rounded-lg focus:outline-none" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button onClick={() => onSave({ title, body: body || undefined, pillarId, platform, scheduledDate: scheduledDate || undefined })} className="px-3 py-1 bg-wm-mid text-white rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle2 size={12} /> Save</button>
        <button onClick={onCancel} className="px-3 py-1 text-wm-muted text-xs">Cancel</button>
      </div>
    </div>
  )
}
