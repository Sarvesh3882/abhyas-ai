'use client'
import { getLevelInfo } from '@/lib/gamification'

export default function XPBar({ xp }: { xp: number }) {
  const info = getLevelInfo(xp)
  const pct = info.neededXP > 0 ? Math.min(100, (info.currentXP / info.neededXP) * 100) : 100
  const blocks = 10
  const filled = Math.round((pct / 100) * blocks)

  return (
    <div>
      <div className="flex justify-between text-[7px] mb-1 text-[var(--text-muted)]"
        style={{ fontFamily: "'Press Start 2P', monospace" }}>
        <span>LVL {info.level} — {info.title}</span>
        <span>{info.currentXP}/{info.neededXP || '∞'} XP</span>
      </div>
      <div className="xp-bar-track">
        <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-0.5 mt-1">
        {Array.from({ length: blocks }).map((_, i) => (
          <div key={i} className="h-2 flex-1"
            style={{ background: i < filled ? 'var(--purple)' : 'var(--bg-panel)', border: '1px solid #000' }} />
        ))}
      </div>
    </div>
  )
}
