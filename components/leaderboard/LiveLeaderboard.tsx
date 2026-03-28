'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'

interface Entry {
  id: string; rank: number; user_id: string
  score: number; accuracy: number; time_taken_total: number
  users?: { name: string }
}

export default function LiveLeaderboard({ testId, currentUserId }: { testId: string; currentUserId: string }) {
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    supabase.from('leaderboard').select('*, users(name)').eq('test_id', testId)
      .order('score', { ascending: false }).then(({ data }) => {
        if (data) setEntries(data as Entry[])
      })

    const channel = supabase.channel(`leaderboard:${testId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leaderboard', filter: `test_id=eq.${testId}` },
        () => {
          supabase.from('leaderboard').select('*, users(name)').eq('test_id', testId)
            .order('score', { ascending: false }).then(({ data }) => {
              if (data) setEntries(data as Entry[])
            })
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [testId])

  return (
    <div>
      <div className="text-[8px] text-[var(--yellow)] mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
        LIVE RANKINGS 🏆
      </div>
      <div className="pixel-box overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)]">
              {['RANK', 'PLAYER', 'SCORE', 'ACC%', 'TIME'].map(h => (
                <th key={h} className="p-2 text-left text-[7px]" style={{ fontFamily: "'Press Start 2P', monospace" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {entries.map((e, i) => (
                <motion.tr
                  key={e.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border-t border-[var(--bg-panel)] ${e.user_id === currentUserId ? 'bg-[var(--purple-glow)]' : ''}`}
                >
                  <td className="p-2 text-[var(--yellow)] font-pixel text-[8px]">#{i + 1}</td>
                  <td className="p-2 text-[var(--text-primary)]">
                    {(e.users as any)?.name ?? 'Player'}
                    {e.user_id === currentUserId && <span className="ml-1 text-[var(--cyan)]">← YOU</span>}
                  </td>
                  <td className="p-2 text-[var(--green)]">{e.score}</td>
                  <td className="p-2">{Math.round(e.accuracy)}%</td>
                  <td className="p-2 text-[var(--text-muted)]">{Math.floor(e.time_taken_total / 60)}m</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {entries.length === 0 && (
          <div className="p-4 text-center text-[var(--text-muted)] text-xs">Waiting for players...</div>
        )}
      </div>
    </div>
  )
}
