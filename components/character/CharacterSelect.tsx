'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { CHARACTERS } from './PixelCharacter'
import PixelCharacter from './PixelCharacter'
import PixelButton from '../ui/PixelButton'

interface Props {
  onSelect: (id: number) => void
  loading?: boolean
}

export default function CharacterSelect({ onSelect, loading }: Props) {
  const [selected, setSelected] = useState<number>(1)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
      <h1 className="pixel-glow text-sm mb-2 text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        CHOOSE YOUR WARRIOR
      </h1>
      <p className="text-[var(--text-muted)] text-xs mb-8 font-inter">Select your companion for this journey</p>

      <div className="grid grid-cols-4 gap-4 mb-8 max-w-2xl">
        {CHARACTERS.map(char => (
          <motion.div
            key={char.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelected(char.id)}
            className={`cursor-pointer p-3 text-center transition-all ${
              selected === char.id ? 'pixel-box-cyan' : 'pixel-box'
            } bg-[var(--bg-card)]`}
            style={selected === char.id ? { boxShadow: '0 0 12px var(--cyan), 4px 4px 0px #000' } : {}}
          >
            <PixelCharacter characterId={char.id} size={48} animation={selected === char.id ? 'idle' : 'none'} />
            <div className="text-[6px] mt-2 text-[var(--text-primary)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {char.name}
            </div>
            <div className="text-[5px] mt-1 text-[var(--text-muted)]">{char.stats}</div>
          </motion.div>
        ))}
      </div>

      <PixelButton onClick={() => onSelect(selected)} disabled={loading} size="lg">
        {loading ? 'SAVING...' : 'BEGIN QUEST ⚔️'}
      </PixelButton>
    </div>
  )
}
