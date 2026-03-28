'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Brain, Swords, Trophy, Flame, Target, BookOpen, ChevronRight, Zap, Star, TrendingUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { UserProfile, TopicPerformance } from '@/lib/supabase'
import { updateStreak, getLevelInfo } from '@/lib/gamification'
import { generateSmartTest } from '@/lib/adaptive'
import Sidebar from '@/components/layout/Sidebar'
import DailyGoal from '@/components/gamification/DailyGoal'
import BadgeShelf from '@/components/gamification/BadgeShelf'
import TopicHeatmap from '@/components/heatmap/TopicHeatmap'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } }

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [tests, setTests] = useState<any[]>([])
  const [attempts, setAttempts] = useState<any[]>([])
  const [topicPerf, setTopicPerf] = useState<TopicPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [smartLoading, setSmartLoading] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (!profile) { router.push('/auth/login'); return }
      if (!profile.character_id) { router.push('/auth/character-select'); return }
      if (profile.role === 'institute') { router.push('/institute/dashboard'); return }

      const today = new Date().toISOString().split('T')[0]
      let up = { ...profile }
      up.streak_days = await updateStreak(authUser.id, profile.last_active_date, profile.streak_days)
      if (profile.goal_last_reset_date !== today) {
        await supabase.from('users').update({ daily_completed_today: 0, goal_last_reset_date: today }).eq('id', authUser.id)
        up.daily_completed_today = 0
      }
      setUser(up as UserProfile)

      const [{ data: t }, { data: a }, { data: p }] = await Promise.all([
        supabase.from('tests').select('*')
          .or(`exam_type.eq.${up.exam_type ?? 'JEE'},exam_type.eq.Both`)
          .order('created_at', { ascending: false }).limit(10),
        supabase.from('attempts').select('*, tests(title)').eq('user_id', authUser.id).order('started_at', { ascending: false }).limit(5),
        supabase.from('topic_performance').select('*').eq('user_id', authUser.id),
      ])
      setTests(t ?? []); setAttempts(a ?? []); setTopicPerf(p ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const handleSmartTest = async () => {
    if (!user) return
    setSmartLoading(true)
    const id = await generateSmartTest(user.id)
    if (id) router.push(`/test/${id}`)
    else { alert('Complete a normal test first!'); setSmartLoading(false) }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex">
        <div className="w-64 shrink-0" style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>
          <div className="p-6"><SkeletonLoader lines={8} /></div>
        </div>
        <div className="flex-1 p-8"><SkeletonLoader lines={12} /></div>
      </div>
    )
  }

  const lvl = getLevelInfo(user.xp_points)
  const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, a) => s + (a.total_score ?? 0), 0) / attempts.length) : 0
  const totalQ = topicPerf.reduce((s, t) => s + t.total_attempted, 0)
  const accuracy = totalQ > 0 ? Math.round(topicPerf.reduce((s, t) => s + t.total_correct, 0) / totalQ * 100) : 0

  const stats = [
    { icon: Swords, label: 'Tests Taken', value: attempts.length, color: '#a78bfa', bg: 'rgba(124,58,237,0.1)', trend: '+2 this week' },
    { icon: Target, label: 'Accuracy', value: `${accuracy}%`, color: '#22d3ee', bg: 'rgba(6,182,212,0.1)', trend: 'Overall' },
    { icon: Flame, label: 'Day Streak', value: `${user.streak_days}`, color: '#fb923c', bg: 'rgba(249,115,22,0.1)', trend: 'Keep going!' },
    { icon: Trophy, label: 'Total XP', value: user.xp_points.toLocaleString(), color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', trend: `LVL ${lvl.level}` },
  ]

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <Sidebar user={user} />

      <main className="flex-1 overflow-auto">
        {/* Top gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-96 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at top right, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />

        <div className="relative p-6 lg:p-8 max-w-7xl mx-auto">
          <motion.div variants={stagger} initial="initial" animate="animate">

            {/* Header */}
            <motion.div variants={fadeUp} className="flex items-start justify-between mb-8 flex-wrap gap-4">
              <div>
                <p className="text-[var(--text-secondary)] text-sm mb-1">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <h1 className="text-3xl font-bold text-white font-sora">
                  Hey, <span className="gradient-text">{user.name?.split(' ')[0]}</span> 👋
                </h1>
                <p className="text-[var(--text-secondary)] mt-1">
                  {lvl.title} · {lvl.currentXP}/{lvl.neededXP} XP to Level {lvl.nextLevel}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="badge badge-purple">
                  <Star size={12} /> LVL {lvl.level} {lvl.title}
                </div>
                {user.streak_days >= 3 && (
                  <div className="badge badge-yellow">
                    🔥 {user.streak_days} day streak
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((s, i) => (
                <motion.div key={s.label} className="stat-card"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 rounded-xl" style={{ background: s.bg }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{s.trend}</span>
                  </div>
                  <div className="text-2xl font-bold text-white font-sora mb-1">{s.value}</div>
                  <div className="text-sm text-[var(--text-secondary)]">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>

            {/* Main grid */}
            <div className="grid lg:grid-cols-3 gap-6 mb-6">

              {/* Start Battle — spans 2 cols */}
              <motion.div variants={fadeUp} className="lg:col-span-2 card p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white font-sora">Start a Battle</h2>
                    <p className="text-[var(--text-secondary)] text-sm mt-0.5">Choose a test or let AI pick for you</p>
                  </div>
                  <Swords size={24} className="text-purple-400" />
                </div>

                {/* Smart test CTA */}
                <motion.button onClick={handleSmartTest} disabled={smartLoading}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full p-4 rounded-xl mb-4 text-left relative overflow-hidden group"
                  style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(6,182,212,0.1) 100%)', border: '1px solid rgba(124,58,237,0.3)' }}>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(6,182,212,0.15) 100%)' }} />
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.3)' }}>
                        <Brain size={20} className="text-purple-300" />
                      </div>
                      <div>
                        <div className="text-white font-semibold">AI Smart Test</div>
                        <div className="text-[var(--text-secondary)] text-xs mt-0.5">Adapts to your weak topics automatically</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-purple text-xs">AI Powered</span>
                      <ChevronRight size={18} className="text-purple-400" />
                    </div>
                  </div>
                </motion.button>

                {/* Test list */}
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-3">Available Tests</p>
                  {tests.map((t, i) => (
                    <motion.button key={t.id} onClick={() => router.push(`/test/${t.id}`)}
                      whileHover={{ x: 4 }} className="w-full text-left p-3 rounded-xl flex items-center justify-between group transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                          style={{ background: 'rgba(124,58,237,0.15)' }}>
                          📝
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors">{t.title}</div>
                          <div className="text-[var(--text-muted)] text-xs">{t.total_questions}Q · {t.duration_minutes} min</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-purple-400 transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Daily Quest */}
              <motion.div variants={fadeUp} className="space-y-4">
                <DailyGoal completed={user.daily_completed_today} goal={user.daily_goal_questions} />

                {/* Quick stats */}
                <div className="card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Performance</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Avg Score', value: avgScore, max: 10, color: '#a78bfa' },
                      { label: 'Accuracy', value: accuracy, max: 100, color: '#22d3ee' },
                      { label: 'Topics Tracked', value: Math.min(topicPerf.length * 10, 100), max: 100, color: '#34d399' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[var(--text-secondary)]">{s.label}</span>
                          <span className="text-white font-medium">{s.label === 'Topics Tracked' ? topicPerf.length : s.value}{s.label === 'Accuracy' ? '%' : ''}</span>
                        </div>
                        <div className="xp-bar-track">
                          <motion.div className="xp-bar-fill" style={{ background: `linear-gradient(90deg, ${s.color}88, ${s.color})` }}
                            initial={{ width: 0 }} animate={{ width: `${(s.value / s.max) * 100}%` }} transition={{ duration: 1, delay: 0.3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Battle Map */}
            <motion.div variants={fadeUp} className="card p-6 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen size={20} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white font-sora">Battle Map</h2>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mb-5">Your topic mastery at a glance</p>
              <TopicHeatmap data={topicPerf} />
            </motion.div>

            {/* Recent + Badges */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent battles */}
              <motion.div variants={fadeUp} className="card p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-white font-sora">Recent Battles</h2>
                  <Zap size={18} className="text-yellow-400" />
                </div>
                {attempts.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-3">⚔️</div>
                    <p className="text-[var(--text-secondary)]">No battles yet</p>
                    <p className="text-[var(--text-muted)] text-sm mt-1">Start your first test above</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attempts.map((a, i) => {
                      const pct = a.tests?.total_questions > 0 ? Math.round((a.total_score / a.tests.total_questions) * 100) : 0
                      return (
                        <motion.div key={a.id}
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                          className="flex items-center justify-between p-3 rounded-xl group cursor-pointer transition-all"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                          onClick={() => router.push(`/review/${a.id}`)}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                              style={{ background: pct >= 70 ? 'rgba(16,185,129,0.15)' : pct >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(236,72,153,0.15)' }}>
                              {pct >= 70 ? '🏆' : pct >= 40 ? '⚔️' : '🔄'}
                            </div>
                            <div>
                              <div className="text-white text-sm font-medium">{(a.tests as any)?.title ?? 'Test'}</div>
                              <div className="text-[var(--text-muted)] text-xs">{new Date(a.started_at).toLocaleDateString('en-IN')}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-white font-bold">{a.total_score ?? 0} pts</div>
                              <div className={`text-xs ${pct >= 70 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-pink-400'}`}>{pct}%</div>
                            </div>
                            <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-purple-400 transition-colors" />
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </motion.div>

              {/* Badges */}
              <motion.div variants={fadeUp} className="card p-6">
                <BadgeShelf earned={user.badges ?? []} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
