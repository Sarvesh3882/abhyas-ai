'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import type { UserProfile, TopicPerformance } from '@/lib/supabase'
import { getLevelInfo, BADGES } from '@/lib/gamification'
import Sidebar from '@/components/layout/Sidebar'
import PixelCharacter from '@/components/character/PixelCharacter'
import XPBar from '@/components/gamification/XPBar'
import PixelModal from '@/components/ui/PixelModal'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [topicPerf, setTopicPerf] = useState<TopicPerformance[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<typeof BADGES[0] | null>(null)
  const [changingChar, setChangingChar] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (!profile) { router.push('/auth/login'); return }
      setUser(profile as UserProfile)

      const [{ data: perf }, { data: atts }] = await Promise.all([
        supabase.from('topic_performance').select('*').eq('user_id', authUser.id),
        supabase.from('attempts').select('*').eq('user_id', authUser.id).eq('status', 'submitted'),
      ])
      setTopicPerf(perf ?? [])
      setAttempts(atts ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex">
        <div className="w-64 bg-[var(--bg-card)] p-4"><SkeletonLoader lines={8} /></div>
        <div className="flex-1 p-8"><SkeletonLoader lines={12} /></div>
      </div>
    )
  }

  const levelInfo = getLevelInfo(user.xp_points)
  const totalQuestions = topicPerf.reduce((s, t) => s + t.total_attempted, 0)
  const totalCorrect = topicPerf.reduce((s, t) => s + t.total_correct, 0)
  const overallAcc = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0

  // Radar data
  const subjects = ['Physics', 'Chemistry', 'Biology', 'Maths']
  const radarData = subjects.map(subj => {
    const subjPerf = topicPerf.filter(t => t.subject === subj)
    const total = subjPerf.reduce((s, t) => s + t.total_attempted, 0)
    const correct = subjPerf.reduce((s, t) => s + t.total_correct, 0)
    return { subject: subj, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 }
  })

  const sortedTopics = [...topicPerf].sort((a, b) => {
    const accA = a.total_attempted > 0 ? a.total_correct / a.total_attempted : 0
    const accB = b.total_attempted > 0 ? b.total_correct / b.total_attempted : 0
    return accA - accB
  })

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <Sidebar user={user} />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">

          {/* Hero */}
          <div className="pixel-box bg-[var(--bg-card)] p-6 text-center">
            <div className="flex justify-center mb-3">
              <PixelCharacter characterId={user.character_id} size={120} animation="idle" />
            </div>
            <div className="text-sm text-[var(--text-primary)] mb-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {user.name}
            </div>
            <div className="text-[8px] text-[var(--yellow)] mb-4" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              LVL {levelInfo.level} — {levelInfo.title}
            </div>
            <div className="max-w-sm mx-auto mb-4">
              <XPBar xp={user.xp_points} />
            </div>
            <button className="pixel-btn pixel-btn-dark text-[7px]" onClick={() => router.push('/auth/character-select')}>
              CHANGE CHARACTER
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '🗡️', label: 'Total Battles', value: attempts.length },
              { icon: '🎯', label: 'Overall Accuracy', value: `${overallAcc}%` },
              { icon: '🔥', label: 'Best Streak', value: `${user.streak_days}d` },
              { icon: '⚡', label: 'Questions Solved', value: totalQuestions },
            ].map(s => (
              <div key={s.label} className="pixel-box bg-[var(--bg-card)] p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg text-[var(--cyan)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>{s.value}</div>
                <div className="text-[6px] text-[var(--text-muted)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Radar chart */}
          <div className="pixel-box bg-[var(--bg-card)] p-4">
            <div className="text-[8px] text-[var(--cyan)] mb-4" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              PERFORMANCE RADAR 📡
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1A1A35" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7B7B9D', fontSize: 10, fontFamily: 'Inter' }} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="#00F5FF" fill="#6C63FF" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Badge collection */}
          <div className="pixel-box bg-[var(--bg-card)] p-4">
            <div className="text-[8px] text-[var(--yellow)] mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              BADGE COLLECTION 🏅
            </div>
            <div className="flex flex-wrap gap-3">
              {BADGES.map(badge => {
                const isEarned = (user.badges ?? []).includes(badge.id)
                return (
                  <motion.div key={badge.id} whileHover={{ scale: 1.1 }}
                    onClick={() => setSelectedBadge(badge)}
                    className={`cursor-pointer pixel-box p-3 text-center ${isEarned ? '' : 'opacity-30 grayscale'}`}
                    style={{ minWidth: 72 }}>
                    <div className="text-2xl">{badge.name.split(' ').pop()}</div>
                    <div className="text-[5px] mt-1 text-[var(--text-muted)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                      {isEarned ? badge.name.replace(/[^\w\s]/g, '').trim().slice(0, 12) : '???'}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Topic mastery */}
          {sortedTopics.length > 0 && (
            <div className="pixel-box bg-[var(--bg-card)] p-4">
              <div className="text-[8px] text-[var(--cyan)] mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                TOPIC MASTERY 📚
              </div>
              <div className="space-y-2">
                {sortedTopics.map(tp => {
                  const acc = tp.total_attempted > 0 ? Math.round((tp.total_correct / tp.total_attempted) * 100) : 0
                  const color = acc > 70 ? 'var(--green)' : acc > 40 ? 'var(--yellow)' : 'var(--pink)'
                  return (
                    <div key={tp.id} className="flex items-center gap-3">
                      <div className="text-xs text-[var(--text-primary)] w-32 truncate">{tp.topic}</div>
                      <div className="flex-1 bg-[var(--bg-panel)] h-3" style={{ border: '1px solid #000' }}>
                        <div className="h-full transition-all" style={{ width: `${acc}%`, background: color }} />
                      </div>
                      <div className="text-[7px] w-10 text-right" style={{ color, fontFamily: "'Press Start 2P', monospace" }}>
                        {acc}%
                      </div>
                      <div className="text-[6px] text-[var(--text-muted)] w-16">{tp.total_attempted} attempts</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Badge modal */}
      <PixelModal open={!!selectedBadge} onClose={() => setSelectedBadge(null)} title="ACHIEVEMENT">
        {selectedBadge && (
          <div className="text-center">
            <div className="text-5xl mb-3">{selectedBadge.name.split(' ').pop()}</div>
            <div className="text-[10px] text-[var(--cyan)] mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {selectedBadge.name}
            </div>
            <div className="text-sm text-[var(--text-muted)]">{selectedBadge.desc}</div>
            {!(user.badges ?? []).includes(selectedBadge.id) && (
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
