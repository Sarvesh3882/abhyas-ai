'use client'

export const CHARACTERS = [
  { id: 1, name: 'The Scholar',   stats: 'INT +5 | FOCUS +3', emoji: '🧑‍🎓' },
  { id: 2, name: 'The Warrior',   stats: 'STR +5 | SPEED +3', emoji: '⚔️' },
  { id: 3, name: 'The Wizard',    stats: 'INT +7 | MAGIC +5', emoji: '🧙' },
  { id: 4, name: 'The Ninja',     stats: 'SPD +6 | AGI +4',   emoji: '🥷' },
  { id: 5, name: 'The Robot',     stats: 'INT +6 | SCI +5',   emoji: '🤖' },
  { id: 6, name: 'The Explorer',  stats: 'CUR +5 | LCK +3',   emoji: '🧭' },
  { id: 7, name: 'The Archer',    stats: 'AIM +6 | FOC +4',   emoji: '🏹' },
  { id: 8, name: 'The Alchemist', stats: 'CHM +7 | INT +4',   emoji: '⚗️' },
]

// CSS pixel-art avatars — 16×16 grid using colored divs
const PIXEL_GRIDS: Record<number, { grid: string[][]; palette: Record<string, string> }> = {
  1: {
    palette: { P: '#6C63FF', S: '#EAEAEA', G: '#43D19E', B: '#13132B', H: '#FFD166', _: 'transparent' },
    grid: [
      ['_','_','_','P','P','P','P','_','_','_','_','_','_','_','_','_'],
      ['_','_','P','H','H','H','H','P','_','_','_','_','_','_','_','_'],
      ['_','_','P','H','S','S','H','P','_','_','_','_','_','_','_','_'],
      ['_','_','P','S','S','S','S','P','_','_','_','_','_','_','_','_'],
      ['_','_','_','P','P','P','P','_','_','_','_','_','_','_','_','_'],
      ['_','_','P','P','G','G','P','P','_','_','_','_','_','_','_','_'],
      ['_','P','P','G','G','G','G','P','P','_','_','_','_','_','_','_'],
      ['_','_','P','G','G','G','G','P','_','_','_','_','_','_','_','_'],
      ['_','_','P','G','G','G','G','P','_','_','_','_','_','_','_','_'],
      ['_','_','_','P','G','G','P','_','_','_','_','_','_','_','_','_'],
      ['_','_','_','P','_','_','P','_','_','_','_','_','_','_','_','_'],
      ['_','_','_','P','_','_','P','_','_','_','_','_','_','_','_','_'],
    ],
  },
}

interface Props {
  characterId: number
  size?: number
  animation?: 'idle' | 'happy' | 'sad' | 'none'
}

export default function PixelCharacter({ characterId, size = 64, animation = 'idle' }: Props) {
  const char = CHARACTERS.find(c => c.id === characterId) ?? CHARACTERS[0]
  const animClass = animation === 'idle' ? 'char-idle' : animation === 'happy' ? 'char-happy' : animation === 'sad' ? 'char-sad' : ''

  return (
    <div
      className={`flex items-center justify-center ${animClass}`}
      style={{ width: size, height: size, fontSize: size * 0.6, lineHeight: 1 }}
      title={char.name}
    >
      {char.emoji}
    </div>
  )
}
