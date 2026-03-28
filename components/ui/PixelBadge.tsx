'use client'
import { motion } from 'framer-motion'
import { BADGES } from '@/lib/gamification'

interface Props {
  badgeId: string
  earned?: boolean
  size?: 'sm' | 'md'
  onClick?: () => void
}

export default function PixelBadge({ badgeId, earned = false, size = 'md', onClick }: Props) {
  const badge = BADGES.find(b => b.id === badgeId)
  if (!badge) return null

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      onClick={onClick}
      className={`cursor-pointer text-center p-2 pixel-box ${earned ? '' : 'opacity-30 grayscale'}`}
      style={{ minWidth: size === 'sm' ? 60 : 80 }}
    >
      <div className="text-2xl mb-1">{badge.name.split(' ').pop()}</div>
      <div className="text-[6px] text-[var(--text-muted)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        {earned ? badge.name.replace(/[^\w\s]/g, '').trim() : '???'}
      </div>
    </motion.div>
  )
}
