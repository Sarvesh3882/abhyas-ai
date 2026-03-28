'use client'
import { motion } from 'framer-motion'

interface Props {
  completed: number
  goal: number
}

export default function DailyGoal({ completed, goal }: Props) {
  const pct = Math.min(100, (completed / goal) * 100)
  const done = completed >= goal

  return (
    <div className={`pixel-box-yellow bg-[var(--bg-card)] p-4 ${done ? 'pixel-box-green' : ''}`}
      style={{ border: `3px solid ${done ? 'var(--green)' : 'var(--yellow)'}`, boxShadow: '4px 4px 0px #000' }}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-[8px] text-[var(--yellow)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          DAILY QUEST 📋
        </span>
        {done && <span className="text-[8px] text-[var(--green)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>COMPLETE! 🎉</span>}
      </div>
      <div className="xp-bar-track mb-2">
        <motion.div
          className="h-full"
          style={{ background: done ? 'var(--green)' : 'var(--yellow)', boxShadow: `0 0 8px ${done ? 'var(--green)' : 'var(--yellow)'}` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>
      <div className="text-[7px] text-[var(--text-muted)]">
        {completed}/{goal} questions · +50 BONUS XP on completion!
      </div>
    </div>
  )
}
