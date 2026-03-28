'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { BADGES } from '@/lib/gamification'
import PixelModal from '../ui/PixelModal'

export default function BadgeShelf({ earned }: { earned: string[] }) {
  const [selected, setSelected] = useState<typeof BADGES[0] | null>(null)

  return (
    <div>
      <div className="text-[8px] text-[var(--yellow)] mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        ACHIEVEMENTS 🏅
      </div>
      <div className="flex flex-wrap gap-2">
        {BADGES.map(badge => {
          const isEarned = earned.includes(badge.id)
          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSelected(badge)}
              className={`cursor-pointer pixel-box p-2 text-center ${isEarned ? '' : 'opacity-30 grayscale'}`}
              style={{ minWidth: 64 }}
            >
              <div className="text-xl">{badge.name.split(' ').slice(-1)[0]}</div>
              <div className="text-[5px] mt-1 text-[var(--text-muted)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                {isEarned ? badge.name.replace(/[^\w\s]/g, '').trim().slice(0, 10) : '???'}
              </div>
            </motion.div>
          )
        })}
      </div>

      <PixelModal open={!!selected} onClose={() => setSelected(null)} title="ACHIEVEMENT">
        {selected && (
          <div className="text-center">
            <div className="text-5xl mb-3">{selected.name.split(' ').slice(-1)[0]}</div>
            <div className="text-[10px] text-[var(--cyan)] mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {selected.name}
            </div>
            <div className="text-sm text-[var(--text-muted)]">{selected.desc}</div>
            {!earned.includes(selected.id) && (
              <div className="mt-3 text-[8px] text-[var(--pink)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                🔒 NOT YET EARNED
              </div>
            )}
          </div>
        )}
      </PixelModal>
    </div>
  )
}
