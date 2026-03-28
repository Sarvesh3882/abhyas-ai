'use client'
import PixelCharacter from '../character/PixelCharacter'
import SkeletonLoader from '../ui/SkeletonLoader'

interface Props {
  explanation: string | null
  loading: boolean
  characterId?: number
}

export default function AIMentorBubble({ explanation, loading, characterId = 3 }: Props) {
  return (
    <div className="bg-[var(--bg-card)] p-4" style={{ borderLeft: '4px solid var(--purple)' }}>
      <div className="flex items-start gap-3">
        <PixelCharacter characterId={characterId} size={40} animation="idle" />
        <div className="flex-1">
          <div className="text-[8px] text-[var(--purple)] mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            🤖 ABHYAS SAYS:
          </div>
          {loading ? (
            <SkeletonLoader lines={4} />
          ) : (
            <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
              {explanation}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
