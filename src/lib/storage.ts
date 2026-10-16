'use client'
import type { AppData } from './types'
import { defaultData } from './defaultData'

const KEY = 'wm2026'

export function loadData(): AppData {
  if (typeof window === 'undefined') return defaultData
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultData
    return { ...defaultData, ...JSON.parse(raw) }
  } catch {
    return defaultData
  }
}

export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, lastUpdated: new Date().toISOString() }))
  } catch {
    // localStorage unavailable (private mode, storage full)
  }
}

export function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10)
}
