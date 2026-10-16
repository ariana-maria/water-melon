'use client'
import { useState, useEffect, useRef } from 'react'
import { format, parseISO, eachDayOfInterval, subDays } from 'date-fns'
import { Camera, Mic, MicOff, Plus, AlertTriangle, Flame, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'
import { loadData, saveData, getTodayKey } from '@/lib/storage'
import { getCurrentPhase, getDaysUntilNextPeriod, phaseInfo } from '@/lib/cycleUtils'
import type { AppData, FoodEntry, HabitEntry } from '@/lib/types'

const CHALLENGE_DAYS = 30

function HabitHeatmap({ log }: { log: HabitEntry[] }) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() })
  const byDate = Object.fromEntries(log.map(e => [e.date, e]))
  return (
    <div className="flex flex-wrap gap-1">
      {days.map(d => {
        const key = d.toISOString().slice(0, 10)
        const entry = byDate[key]
        const done = entry ? [entry.meditation, entry.sleep, entry.beauty].filter(Boolean).length : 0
        const color = done === 3 ? 'bg-wm-mid' : done === 2 ? 'bg-wm-sage' : done === 1 ? 'bg-wm-warm' : 'bg-gray-100'
        return (
          <div key={key} className={clsx('w-6 h-6 rounded-sm', color)} title={`${format(d, 'MMM d')} — ${done}/3`} />
        )
      })}
    </div>
  )
}

export default function WellnessPage() {
  const [data, setData] = useState<AppData | null>(null)
  const [recording, setRecording] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [newMeal, setNewMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [showFoodForm, setShowFoodForm] = useState(false)
  const [newCycleDate, setNewCycleDate] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const today = getTodayKey()

  useEffect(() => { setData(loadData()) }, [])
  if (!data) return <div className="p-8 text-wm-muted">Loading...</div>

  const phase = getCurrentPhase(data.wellness.cycleData)
  const pi = phaseInfo[phase]
  const daysUntilNext = getDaysUntilNextPeriod(data.wellness.cycleData)
  const todayHabit = data.wellness.habitLog.find(e => e.date === today)
  const todayFood = data.wellness.foodJournal.filter(e => e.date === today)

  // 30-day challenge
  const challengeActive = data.wellness.foodChallengeActive
  const challengeDay = challengeActive && data.wellness.foodChallengeStart
    ? Math.min(CHALLENGE_DAYS, Math.floor((Date.now() - new Date(data.wellness.foodChallengeStart).getTime()) / 86400000) + 1)
    : null

  function toggleHabit(key: 'meditation' | 'sleep' | 'beauty', value?: number) {
    const updated = { ...data! }
    const entry = updated.wellness.habitLog.find(e => e.date === today)
    if (entry) {
      entry[key] = !entry[key]
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

  function updateSleepHours(h: number) {
    const updated = { ...data! }
    let entry = updated.wellness.habitLog.find(e => e.date === today)
    if (!entry) {
      entry = { date: today, meditation: false, sleep: false, beauty: false }
      updated.wellness.habitLog.unshift(entry)
    }
    entry.sleepHours = h
    entry.sleep = h >= 7
    setData({ ...updated })
    saveData(updated)
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function toggleRecording() {
    if (recording) {
      mediaRef.current?.stop()
      setRecording(false)
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mr = new MediaRecorder(stream)
        chunksRef.current = []
        mr.ondataavailable = e => chunksRef.current.push(e.data)
        mr.onstop = () => {
          stream.getTracks().forEach(t => t.stop())
          setVoiceTranscript('[Voice note recorded — transcript coming soon]')
        }
        mr.start()
        mediaRef.current = mr
        setRecording(true)
      } catch {
        setVoiceTranscript('[Microphone not available — type a note instead]')
      }
    }
  }

  function saveFoodEntry() {
    const updated = { ...data! }
    const entry: FoodEntry = {
      id: `f${Date.now()}`,
      date: today,
      meal: newMeal,
      notes: newNote || undefined,
      photoDataUrl: photoPreview || undefined,
      voiceTranscript: voiceTranscript || undefined,
      cyclePhase: phase,
    }
    updated.wellness.foodJournal.unshift(entry)
    setData({ ...updated })
    saveData(updated)
    setNewNote('')
    setPhotoPreview(null)
    setVoiceTranscript('')
    setShowFoodForm(false)
  }

  function startChallenge() {
    const updated = { ...data! }
    updated.wellness.foodChallengeActive = true
    updated.wellness.foodChallengeStart = today
    setData({ ...updated })
    saveData(updated)
  }

  function updateCycleDate() {
    if (!newCycleDate) return
    const updated = { ...data! }
    updated.wellness.cycleData.lastPeriodStart = newCycleDate
    setData({ ...updated })
    saveData(updated)
    setNewCycleDate('')
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-wm-dark">Wellness</h1>
        <p className="text-wm-muted text-sm mt-1">Daily rituals, seasonal nourishment, and cycle-aware living</p>
      </div>

      {/* Cycle phase */}
      <section className="rounded-2xl p-6 border" style={{ backgroundColor: pi.color + '18', borderColor: pi.color + '50' }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: pi.color }}>{pi.label}</p>
            <p className="text-sm font-medium text-wm-dark mb-1">{pi.energy}</p>
            <p className="text-sm text-wm-muted">{pi.wellnessTip}</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-wm-dark">{daysUntilNext}d</p>
            <p className="text-xs text-wm-muted">until next</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {pi.foodTips.map(tip => (
            <span key={tip} className="text-xs px-2.5 py-1.5 rounded-full bg-white/70 text-wm-dark border border-white">🌿 {tip}</span>
          ))}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <input
            type="date"
            className="px-3 py-1.5 rounded-lg text-xs border border-white/50 bg-white/60 focus:outline-none"
            placeholder="Update last period date"
            value={newCycleDate}
            onChange={e => setNewCycleDate(e.target.value)}
          />
          <button onClick={updateCycleDate} className="text-xs px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors font-medium">Update cycle</button>
        </div>
      </section>

      {/* Habits */}
      <section>
        <h2 className="font-medium text-wm-dark mb-4">Today's Rituals</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {/* Meditation */}
          <div className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm">
            <div className="text-2xl mb-2">🧘</div>
            <p className="font-medium text-wm-dark">Meditation</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1} max={120}
                className="w-16 px-2 py-1 border border-wm-warm rounded-lg text-sm focus:outline-none focus:border-wm-sage"
                placeholder="min"
                value={todayHabit?.meditationMinutes ?? ''}
                onChange={e => {
                  const updated = { ...data! }
                  let entry = updated.wellness.habitLog.find(h => h.date === today)
                  if (!entry) { entry = { date: today, meditation: false, sleep: false, beauty: false }; updated.wellness.habitLog.unshift(entry) }
                  entry.meditationMinutes = parseInt(e.target.value)
                  entry.meditation = parseInt(e.target.value) > 0
                  setData({ ...updated }); saveData(updated)
                }}
              />
              <span className="text-sm text-wm-muted">minutes</span>
              {todayHabit?.meditation && <CheckCircle2 size={18} className="text-wm-mid ml-auto" />}
            </div>
          </div>

          {/* Sleep */}
          <div className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm">
            <div className="text-2xl mb-2">🌙</div>
            <p className="font-medium text-wm-dark">Sleep</p>
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                min={1} max={12} step={0.5}
                className="w-16 px-2 py-1 border border-wm-warm rounded-lg text-sm focus:outline-none focus:border-wm-sage"
                placeholder="hrs"
                value={todayHabit?.sleepHours ?? ''}
                onChange={e => updateSleepHours(parseFloat(e.target.value))}
              />
              <span className="text-sm text-wm-muted">hours</span>
              {todayHabit?.sleep && <CheckCircle2 size={18} className="text-wm-gold ml-auto" />}
            </div>
            {todayHabit?.sleepHours && todayHabit.sleepHours < 7 && (
              <p className="text-xs text-wm-coral mt-2 flex items-center gap-1"><AlertTriangle size={12} /> Aim for 7+ hrs</p>
            )}
          </div>

          {/* Beauty */}
          <div className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm">
            <div className="text-2xl mb-2">✨</div>
            <p className="font-medium text-wm-dark">Beauty Routine</p>
            <button
              onClick={() => toggleHabit('beauty')}
              className={clsx(
                'mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                todayHabit?.beauty
                  ? 'bg-wm-pink/30 text-wm-coral'
                  : 'bg-wm-cream text-wm-muted hover:bg-wm-warm'
              )}
            >
              {todayHabit?.beauty ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              {todayHabit?.beauty ? 'Done ✓' : 'Mark done'}
            </button>
          </div>
        </div>
      </section>

      {/* Heatmap */}
      <section className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm">
        <h2 className="font-medium text-wm-dark mb-1">30-day habit heatmap</h2>
        <p className="text-xs text-wm-muted mb-4">Dark = all 3 habits · Medium = 2 · Light = 1 · Empty = 0</p>
        <HabitHeatmap log={data.wellness.habitLog} />
      </section>

      {/* Food journal */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-medium text-wm-dark">Seasonal Food Journal</h2>
            {!challengeActive && (
              <p className="text-xs text-wm-muted mt-0.5">Log for just 30 days to tune your seasonal meal plan</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!challengeActive && (
              <button
                onClick={startChallenge}
                className="text-xs px-3 py-1.5 bg-wm-mid text-white rounded-lg font-medium hover:bg-wm-green transition-colors"
              >
                Start 30-day challenge
              </button>
            )}
            {challengeActive && challengeDay && (
              <span className="text-xs px-3 py-1.5 bg-wm-sage/20 text-wm-mid rounded-lg font-medium flex items-center gap-1">
                <Flame size={12} /> Day {challengeDay}/{CHALLENGE_DAYS}
              </span>
            )}
          </div>
        </div>

        {/* Family dietary notes */}
        <div className="bg-wm-coral/10 border border-wm-coral/30 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle size={14} className="text-wm-coral flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-wm-coral">Household dietary notes</p>
            <p className="text-xs text-wm-dark mt-0.5">
              {data.wellness.familyProfile.allergies.join(', ')} · {data.wellness.familyProfile.preferences.join(', ')}
            </p>
          </div>
        </div>

        {/* Add food entry */}
        <button
          onClick={() => setShowFoodForm(!showFoodForm)}
          className="flex items-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-wm-warm text-wm-muted text-sm hover:border-wm-sage hover:text-wm-mid transition-colors mb-3"
        >
          <Plus size={16} /> Log what you ate
        </button>

        {showFoodForm && (
          <div className="bg-white rounded-2xl p-5 border border-wm-warm shadow-sm mb-4 space-y-4">
            <select
              className="w-full px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage"
              value={newMeal}
              onChange={e => setNewMeal(e.target.value as typeof newMeal)}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>

            <textarea
              className="w-full px-3 py-2 rounded-lg border border-wm-warm text-sm focus:outline-none focus:border-wm-sage resize-none"
              rows={2}
              placeholder="What did you eat? (optional note)"
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
            />

            <div className="flex gap-3">
              {/* Photo */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
                  photoPreview ? 'border-wm-mid bg-wm-mid/10 text-wm-mid' : 'border-wm-warm text-wm-muted hover:border-wm-sage'
                )}
              >
                <Camera size={16} /> {photoPreview ? 'Photo added ✓' : 'Add photo'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhoto}
              />

              {/* Voice */}
              <button
                onClick={toggleRecording}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors',
                  recording ? 'border-wm-coral bg-wm-coral/10 text-wm-coral animate-pulse' : 'border-wm-warm text-wm-muted hover:border-wm-sage'
                )}
              >
                {recording ? <MicOff size={16} /> : <Mic size={16} />}
                {recording ? 'Recording...' : voiceTranscript ? 'Voice added ✓' : 'Voice note'}
              </button>
            </div>

            {photoPreview && (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Food preview" className="w-full max-h-40 object-cover rounded-lg" />
                <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 bg-white/90 text-wm-coral rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
              </div>
            )}

            {voiceTranscript && (
              <p className="text-xs text-wm-muted italic bg-wm-cream rounded-lg px-3 py-2">{voiceTranscript}</p>
            )}

            <div className="flex gap-2">
              <button onClick={saveFoodEntry} className="px-4 py-2 bg-wm-mid text-white rounded-lg text-sm font-medium hover:bg-wm-green transition-colors">Save entry</button>
              <button onClick={() => { setShowFoodForm(false); setPhotoPreview(null); setVoiceTranscript('') }} className="px-4 py-2 text-wm-muted rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Today's food */}
        {todayFood.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-wm-muted font-medium uppercase tracking-wide">Today</p>
            {todayFood.map(entry => (
              <div key={entry.id} className="flex gap-3 p-3 bg-white rounded-xl border border-wm-warm shadow-sm">
                {entry.photoDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={entry.photoDataUrl} alt="meal" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                )}
                <div>
                  <p className="text-xs font-semibold text-wm-mid capitalize">{entry.meal}</p>
                  {entry.notes && <p className="text-sm text-wm-dark mt-0.5">{entry.notes}</p>}
                  {entry.voiceTranscript && <p className="text-xs text-wm-muted mt-0.5 italic">{entry.voiceTranscript}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Meal plan */}
      <section>
        <h2 className="font-medium text-wm-dark mb-4">This week's meal plan</h2>
        <div className="space-y-3">
          {['breakfast', 'lunch', 'dinner'].map(mealType => {
            const todayMeals = data.wellness.mealPlan.filter(m => m.date === today && m.meal === mealType)
            return (
              <div key={mealType} className="bg-white rounded-xl p-4 border border-wm-warm shadow-sm">
                <p className="text-xs font-semibold text-wm-muted uppercase tracking-wide capitalize mb-2">{mealType}</p>
                {todayMeals.length > 0
                  ? todayMeals.map(m => (
                    <div key={m.id} className="flex items-center gap-2">
                      {m.cycleAligned && <span className="text-xs text-wm-sage" title="Cycle aligned">🌿</span>}
                      <p className="text-sm text-wm-dark">{m.name}</p>
                    </div>
                  ))
                  : <p className="text-sm text-wm-muted italic">Nothing planned — add one below</p>
                }
              </div>
            )
          })}
        </div>
        <p className="text-xs text-wm-muted mt-3">🌿 = cycle-aligned meal · No peanuts (son's allergy)</p>
      </section>
    </div>
  )
}
