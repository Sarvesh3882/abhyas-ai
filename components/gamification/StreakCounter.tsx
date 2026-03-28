export default function StreakCounter({ days }: { days: number }) {
  return (
    <div className="flex items-center gap-2 pixel-box p-2 bg-[var(--bg-panel)]">
      <span className="text-xl">🔥</span>
      <div>
        <div className="text-[8px] text-[var(--yellow)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          {days} DAY STREAK
        </div>
        <div className="text-[6px] text-[var(--text-muted)]">Keep it going!</div>
      </div>
    </div>
  )
}
