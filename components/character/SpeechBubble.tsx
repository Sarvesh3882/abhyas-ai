'use client'
import { useMemo } from 'react'

interface Props {
  context?: 'default' | 'wrong' | 'streak' | 'high_score' | 'low_score' | 'goal_complete'
  streakDays?: number
  score?: number
}

export default function SpeechBubble({ context = 'default', streakDays = 0, score }: Props) {
  const message = useMemo(() => {
    if (context === 'wrong') return 'We learn from this. Reload! 🔄'
    if (context === 'goal_complete') return 'QUEST COMPLETE! +50 XP 🎉'
    if (context === 'high_score' || (score !== undefined && score > 80)) return 'LEGENDARY performance! 👑'
    if (context === 'low_score' || (score !== undefined && score < 40)) return 'Every topper had this day. Fix it! 🔧'
    if (context === 'streak' && streakDays > 0) return `${streakDays} days strong! Don't stop! 🔥`

    const hour = new Date().getHours()
    if (hour >= 6 && hour < 12) return 'Rise and grind, warrior! ⚔️'
    if (hour >= 12 && hour < 18) return 'Keep pushing, champion! 💪'
    if (hour >= 18 && hour < 22) return 'Evening grind hits different 🔥'
    return 'Night owl mode activated 🦉'
  }, [context, streakDays, score])

  return (
    <div className="relative bg-[var(--bg-panel)] pixel-box p-2 text-[8px] text-[var(--text-primary)] max-w-[160px]"
      style={{ fontFamily: "'Press Start 2P', monospace" }}>
      {message}
      <div className="absolute -bottom-2 left-4 w-0 h-0"
        style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '8px solid var(--purple)' }} />
    </div>
  )
}
