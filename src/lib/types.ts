export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type SkillCategory = 'ai' | 'search' | 'localization' | 'data' | 'growth' | 'leadership'
export type JobStatus = 'researching' | 'applied' | 'screening' | 'interviewing' | 'offer' | 'rejected' | 'accepted'
export type PostStatus = 'idea' | 'drafting' | 'scheduled' | 'published'
export type PostPlatform = 'linkedin' | 'substack' | 'both'

export interface AppData {
  career: CareerData
  wellness: WellnessData
  content: ContentData
  lastUpdated: string
}

// --- Career ---
export interface CareerData {
  currentComp: number
  targetComp: number
  currentRole: string
  currentCompany: string
  targetRole: string
  skills: Skill[]
  milestones: Milestone[]
  applications: JobApplication[]
  learningLog: LearningEntry[]
}

export interface Skill {
  id: string
  name: string
  category: SkillCategory
  proficiency: number      // 0–100
  target: number           // 0–100
  nextStep: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  targetDate: string
  completed: boolean
  completedDate?: string
  category: 'career' | 'comp' | 'learning' | 'network'
}

export interface JobApplication {
  id: string
  company: string
  role: string
  status: JobStatus
  compMin?: number
  compMax?: number
  appliedDate?: string
  notes: string
  isInternal: boolean
}

export interface LearningEntry {
  id: string
  date: string
  resource: string
  type: 'article' | 'course' | 'book' | 'podcast' | 'video' | 'project'
  topic: string
  notes: string
}

// --- Wellness ---
export interface WellnessData {
  habitLog: HabitEntry[]
  foodJournal: FoodEntry[]
  cycleData: CycleData
  mealPlan: PlannedMeal[]
  familyProfile: FamilyProfile
  foodChallengeActive: boolean
  foodChallengeStart?: string
}

export interface HabitEntry {
  date: string           // YYYY-MM-DD
  meditation: boolean
  meditationMinutes?: number
  sleep: boolean
  sleepHours?: number
  beauty: boolean
  note?: string
}

export interface FoodEntry {
  id: string
  date: string
  meal: MealType
  notes?: string
  photoDataUrl?: string
  voiceTranscript?: string
  tags?: string[]
  cyclePhase?: CyclePhase
}

export interface CycleData {
  lastPeriodStart: string    // YYYY-MM-DD
  avgCycleLength: number     // default 28
}

export interface PlannedMeal {
  id: string
  date: string               // YYYY-MM-DD
  meal: MealType
  name: string
  cycleAligned?: boolean
  notes?: string
}

export interface FamilyProfile {
  allergies: string[]           // e.g. ["peanuts (son)"]
  preferences: string[]
  householdSize: number
}

// --- Content ---
export interface ContentData {
  posts: ContentPost[]
  pillars: ContentPillar[]
  platformStats: PlatformStats
}

export interface ContentPost {
  id: string
  title: string
  body?: string
  status: PostStatus
  platform: PostPlatform
  pillarId: string
  scheduledDate?: string
  publishedDate?: string
  tags: string[]
  engagement?: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
  }
}

export interface ContentPillar {
  id: string
  name: string
  description: string
  color: string
  targetPerMonth: number
}

export interface PlatformStats {
  linkedin: { followers: number; targetFollowers: number; postsThisMonth: number; targetPerMonth: number; url?: string }
  substack: { followers: number; targetFollowers: number; postsThisMonth: number; targetPerMonth: number; url?: string }
}
