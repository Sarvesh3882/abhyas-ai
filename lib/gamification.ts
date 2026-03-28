import { supabase } from './supabase'

export const LEVEL_THRESHOLDS = [
  { level: 1, min: 0,     max: 500,   title: 'Rookie' },
  { level: 2, min: 500,   max: 1500,  title: 'Challenger' },
  { level: 3, min: 1500,  max: 3500,  title: 'Warrior' },
  { level: 4, min: 3500,  max: 7000,  title: 'Scholar' },
  { level: 5, min: 7000,  max: 12000, title: 'Elite' },
  { level: 6, min: 12000, max: Infinity, title: 'Legend' },
]

export function getLevelInfo(xp: number) {
  const lvl = LEVEL_THRESHOLDS.find(l => xp >= l.min && xp < l.max) ?? LEVEL_THRESHOLDS[5]
  const next = LEVEL_THRESHOLDS.find(l => l.level === lvl.level + 1)
  return {
    level: lvl.level,
    title: lvl.title,
    currentXP: xp - lvl.min,
    neededXP: next ? next.min - lvl.min : 0,
    nextLevel: next?.level ?? lvl.level,
  }
}

export const BADGES = [
  { id: 'first_blood',   name: 'First Blood 🗡️',    desc: 'Complete your first test' },
  { id: 'sharp_shooter', name: 'Sharp Shooter 🎯',  desc: 'Score >80% five times' },
  { id: 'night_owl',     name: 'Night Owl 🦉',       desc: 'Practice after 10 PM' },
  { id: 'comeback_kid',  name: 'Comeback Kid 💪',    desc: 'Improve same topic 3 times' },
  { id: 'streak_7',      name: 'Week Warrior 🔥',    desc: '7 day streak' },
  { id: 'streak_30',     name: 'Iron Will ⚔️',       desc: '30 day streak' },
  { id: 'legend_score',  name: 'LEGENDARY 👑',       desc: 'Score 100% on any test' },
  { id: 'speed_demon',   name: 'Speed Demon ⚡',     desc: 'Finish test in under half the time' },
]

export async function addXP(userId: string, amount: number): Promise<{ newXP: number; leveledUp: boolean; newLevel: number }> {
  const { data: user } = await supabase.from('users').select('xp_points, level').eq('id', userId).single()
  if (!user) return { newXP: 0, leveledUp: false, newLevel: 1 }

  const oldLevel = getLevelInfo(user.xp_points).level
  const newXP = user.xp_points + amount
  const newLevelInfo = getLevelInfo(newXP)
  const leveledUp = newLevelInfo.level > oldLevel

  await supabase.from('users').update({ xp_points: newXP, level: newLevelInfo.level }).eq('id', userId)
  return { newXP, leveledUp, newLevel: newLevelInfo.level }
}

export async function checkAndAwardBadges(userId: string, context: {
  attemptCount?: number
  highScoreCount?: number
  submittedHour?: number
  streakDays?: number
  isPerfectScore?: boolean
  isSpeedRun?: boolean
  currentBadges?: string[]
}) {
  const badges = context.currentBadges ?? []
  const newBadges: string[] = []

  if (!badges.includes('first_blood') && (context.attemptCount ?? 0) >= 1) newBadges.push('first_blood')
  if (!badges.includes('sharp_shooter') && (context.highScoreCount ?? 0) >= 5) newBadges.push('sharp_shooter')
  if (!badges.includes('night_owl') && (context.submittedHour ?? -1) >= 22) newBadges.push('night_owl')
  if (!badges.includes('streak_7') && (context.streakDays ?? 0) >= 7) newBadges.push('streak_7')
  if (!badges.includes('streak_30') && (context.streakDays ?? 0) >= 30) newBadges.push('streak_30')
  if (!badges.includes('legend_score') && context.isPerfectScore) newBadges.push('legend_score')
  if (!badges.includes('speed_demon') && context.isSpeedRun) newBadges.push('speed_demon')

  if (newBadges.length > 0) {
    const updated = [...badges, ...newBadges]
    await supabase.from('users').update({ badges: updated }).eq('id', userId)
  }
  return newBadges
}

export async function updateStreak(userId: string, lastActiveDate: string | null, currentStreak: number) {
  const today = new Date().toISOString().split('T')[0]
  if (lastActiveDate === today) return currentStreak

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak = lastActiveDate === yesterday ? currentStreak + 1 : 1

  await supabase.from('users').update({ streak_days: newStreak, last_active_date: today }).eq('id', userId)
  return newStreak
}

export function detectResponsePattern(timeTaken: number, isCorrect: boolean): string {
  if (timeTaken < 15) return 'rushed'
  if (timeTaken < 20 && !isCorrect) return 'guessing'
  if (timeTaken > 180 && !isCorrect) return 'overthinking'
  if (timeTaken < 60 && isCorrect) return 'confident'
  return 'calculated'
}
