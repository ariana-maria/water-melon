import { differenceInDays, parseISO } from 'date-fns'
import type { CycleData, CyclePhase } from './types'

export function getCurrentPhase(cycleData: CycleData, today = new Date()): CyclePhase {
  const start = parseISO(cycleData.lastPeriodStart)
  const dayOfCycle = (differenceInDays(today, start) % cycleData.avgCycleLength) + 1

  if (dayOfCycle <= 5) return 'menstrual'
  if (dayOfCycle <= 13) return 'follicular'
  if (dayOfCycle <= 17) return 'ovulatory'
  return 'luteal'
}

export function getDaysUntilNextPeriod(cycleData: CycleData, today = new Date()): number {
  const start = parseISO(cycleData.lastPeriodStart)
  const dayOfCycle = (differenceInDays(today, start) % cycleData.avgCycleLength) + 1
  return cycleData.avgCycleLength - dayOfCycle + 1
}

export const phaseInfo: Record<CyclePhase, { label: string; color: string; energy: string; foodTips: string[]; wellnessTip: string }> = {
  menstrual: {
    label: 'Menstrual Phase',
    color: '#E85D4A',
    energy: 'Rest & restore',
    foodTips: ['Iron-rich foods (lentils, spinach)', 'Dark chocolate', 'Warm soups & stews', 'Ginger tea for cramps'],
    wellnessTip: 'Honor rest. Gentle movement, extra sleep, and nourishing meals.',
  },
  follicular: {
    label: 'Follicular Phase',
    color: '#7DAA83',
    energy: 'Rising energy',
    foodTips: ['Fermented foods (yogurt, kimchi)', 'Light proteins', 'Spring vegetables', 'Seeds (pumpkin, flax)'],
    wellnessTip: 'Energy is building — great time to plan, start new projects, and try new recipes.',
  },
  ovulatory: {
    label: 'Ovulatory Phase',
    color: '#D4A853',
    energy: 'Peak power',
    foodTips: ['Raw vegetables', 'Fiber-rich foods', 'Light proteins (fish, chicken)', 'Berries & antioxidants'],
    wellnessTip: 'Your most social, communicative phase. Post that content. Network. Pitch yourself.',
  },
  luteal: {
    label: 'Luteal Phase',
    color: '#F4A5AC',
    energy: 'Wind down',
    foodTips: ['Complex carbs (sweet potato, quinoa)', 'Magnesium-rich foods (dark leafy greens)', 'Herbal teas', 'Mood-supporting B vitamins'],
    wellnessTip: 'Nesting energy. Great for deep work, reflection, and meal prep.',
  },
}
