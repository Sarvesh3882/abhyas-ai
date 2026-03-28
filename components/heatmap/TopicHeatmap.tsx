'use client'
import { useState } from 'react'
import type { TopicPerformance } from '@/lib/supabase'

export default function TopicHeatmap({ data }: { data: TopicPerformance[] }) {
  const [tooltip, setTooltip] = useState<{ topic: string; acc: number; avg: number } | null>(null)

  return (
    <div>
      <div className="text-[8px] text-[var(--cyan)] mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        BATTLE MAP 🗺️
      </div>
      {data.length === 0 && (
        <div className="text-[var(--text-muted)] text-xs text-center py-4">No battles yet. Start a test!</div>
      )}
      <div className="flex flex-wrap gap-2">
        {data.map(tp => {
          const acc = tp.total_attempted > 0 ? (tp.total_correct / tp.total_attempted) * 100 : 0
          const variant = acc > 70 ? 'green' : acc > 40 ? 'yellow' : 'red'
          const label = acc > 70 ? '✅' : acc > 40 ? '⚡' : '⚠️'
          const borderColor = acc > 70 ? 'var(--green)' : acc > 40 ? 'var(--yellow)' : 'var(--pink)'

          return (
            <div
              key={tp.id}
              className="relative cursor-pointer p-2 bg-[var(--bg-card)] text-center"
              style={{ border: `3px solid ${borderColor}`, boxShadow: '3px 3px 0px #000', minWidth: 80 }}
              onMouseEnter={() => setTooltip({ topic: tp.topic, acc: Math.round(acc), avg: tp.avg_time_seconds })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="text-sm">{label}</div>
              <div className="text-[6px] text-[var(--text-primary)] mt-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                {tp.topic.slice(0, 10)}
              </div>
              <div className="text-[5px] text-[var(--text-muted)]">{Math.round(acc)}%</div>
            </div>
          )
        })}
      </div>
      {tooltip && (
        <div className="mt-2 pixel-box p-2 text-[7px] text-[var(--text-primary)] inline-block">
          {tooltip.topic} · {tooltip.acc}% accuracy · avg {tooltip.avg}s
        </div>
      )}
    </div>
  )
}
