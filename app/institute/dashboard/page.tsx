'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase'
import Sidebar from '@/components/layout/Sidebar'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

interface StudentRow {
  id: string
  name: string
  last_active_date: string | null
  streak_days: number
  xp_points: number
  testsDone: number
  avgScore: number
  weakestTopic: string
}

export default function InstituteDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [institute, setInstitute] = useState<any>(null)
  const [students, setStudents] = useState<StudentRow[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedTest, setSelectedTest] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [sortKey, setSortKey] = useState<keyof StudentRow>('name')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }

      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      if (!profile || profile.role !== 'institute') { router.push('/dashboard'); return }
      setUser(profile as UserProfile)

      // Get or create institute
      let inst = null
      const { data: existing } = await supabase.from('institutes').select('*').eq('owner_id', authUser.id).single()
      if (existing) {
        inst = existing
      } else {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        const { data: created } = await supabase.from('institutes').insert({
          name: `${profile.name}'s Institute`, owner_id: authUser.id, invite_code: code
        }).select().single()
        inst = created
      }
      setInstitute(inst)

      // Get students
      const { data: memberRows } = await supabase
        .from('institute_students')
        .select('student_id, users(*)')
        .eq('institute_id', inst?.id)

      const studentProfiles = memberRows?.map((m: any) => m.users).filter(Boolean) ?? []

      // Build student rows with stats
      const rows: StudentRow[] = await Promise.all(studentProfiles.map(async (s: any) => {
        const { data: atts } = await supabase.from('attempts').select('total_score').eq('user_id', s.id).eq('status', 'submitted')
        const { data: perf } = await supabase.from('topic_performance').select('*').eq('user_id', s.id).order('total_correct', { ascending: true }).limit(1)
        const avgScore = atts && atts.length > 0 ? Math.round(atts.reduce((sum: number, a: any) => sum + (a.total_score ?? 0), 0) / atts.length) : 0
        return {
          id: s.id,
          name: s.name ?? 'Unknown',
          last_active_date: s.last_active_date,
          streak_days: s.streak_days ?? 0,
          xp_points: s.xp_points ?? 0,
          testsDone: atts?.length ?? 0,
          avgScore,
          weakestTopic: perf?.[0]?.topic ?? '—',
        }
      }))

      setStudents(rows)

      const { data: testsData } = await supabase.from('tests').select('*').order('created_at', { ascending: false })
      setTests(testsData ?? [])
      setLoading(false)
    }
    init()
  }, [router])

  const copyCode = () => {
    navigator.clipboard.writeText(institute?.invite_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const assignTest = async () => {
    if (!selectedTest || !institute) return
    setAssigning(true)
    await supabase.from('tests').update({ assigned_to_institute: institute.id }).eq('id', selectedTest)
    setAssigning(false)
    alert('Test assigned to all students!')
  }

  const today = new Date().toISOString().split('T')[0]
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]

  const filtered = students
    .filter(s => s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey]; const bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv)
      return (bv as number) - (av as number)
    })

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex">
        <div className="w-64 bg-[var(--bg-card)] p-4"><SkeletonLoader lines={8} /></div>
        <div className="flex-1 p-8"><SkeletonLoader lines={12} /></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <Sidebar user={user} />
      <main className="flex-1 p-6 overflow-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">

          {/* Institute header */}
          <div className="pixel-box bg-[var(--bg-card)] p-6">
            <div className="text-sm text-[var(--text-primary)] mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              {institute?.name ?? 'My Institute'}
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="pixel-box-cyan p-3" style={{ border: '3px solid var(--cyan)', boxShadow: '4px 4px 0px #000' }}>
                <div className="text-[6px] text-[var(--text-muted)] mb-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>INVITE CODE</div>
                <div className="text-lg text-[var(--cyan)] tracking-widest" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                  {institute?.invite_code}
                </div>
              </div>
              <button className="pixel-btn pixel-btn-dark text-[7px]" onClick={copyCode}>
                {copied ? '✅ COPIED!' : '📋 COPY CODE'}
              </button>
            </div>
          </div>

          {/* Assign test */}
          <div className="pixel-box bg-[var(--bg-card)] p-4">
            <div className="text-[8px] text-[var(--yellow)] mb-3" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              ASSIGN BATTLE ⚔️
            </div>
            <div className="flex gap-3 flex-wrap items-end">
              <div>
                <div className="text-[6px] text-[var(--text-muted)] mb-1">SELECT TEST:</div>
                <select value={selectedTest} onChange={e => setSelectedTest(e.target.value)}
                  className="bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 text-xs pixel-box outline-none"
                  style={{ fontFamily: 'Inter' }}>
                  <option value="">-- Pick a test --</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <button className="pixel-btn text-[7px]" onClick={assignTest} disabled={!selectedTest || assigning}>
                {assigning ? 'ASSIGNING...' : 'ASSIGN TO ALL STUDENTS ⚔️'}
              </button>
            </div>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: '👥', label: 'Total Students', value: students.length },
              { icon: '🎯', label: 'Avg Score', value: students.length > 0 ? Math.round(students.reduce((s, st) => s + st.avgScore, 0) / students.length) : 0 },
              { icon: '⚠️', label: 'Inactive (3d+)', value: students.filter(s => !s.last_active_date || s.last_active_date < threeDaysAgo).length },
              { icon: '🔥', label: 'Active Today', value: students.filter(s => s.last_active_date === today).length },
            ].map(s => (
              <div key={s.label} className="pixel-box bg-[var(--bg-card)] p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg text-[var(--cyan)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>{s.value}</div>
                <div className="text-[6px] text-[var(--text-muted)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Student table */}
          <div className="pixel-box bg-[var(--bg-card)] p-4">
            <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
              <div className="text-[8px] text-[var(--cyan)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                STUDENT ROSTER 👥
              </div>
              <input
                type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                className="bg-[var(--bg-primary)] text-[var(--text-primary)] p-2 text-xs pixel-box outline-none w-40"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-[var(--bg-panel)] text-[var(--text-muted)]">
                    {[
                      { key: 'name', label: 'NAME' },
                      { key: 'last_active_date', label: 'LAST ACTIVE' },
                      { key: 'testsDone', label: 'TESTS' },
                      { key: 'avgScore', label: 'AVG SCORE' },
                      { key: 'weakestTopic', label: 'WEAKEST TOPIC' },
                      { key: 'streak_days', label: 'STREAK' },
                    ].map(col => (
                      <th key={col.key}
                        className="p-2 text-left text-[7px] cursor-pointer hover:text-[var(--cyan)]"
                        style={{ fontFamily: "'Press Start 2P', monospace" }}
                        onClick={() => setSortKey(col.key as keyof StudentRow)}>
                        {col.label} {sortKey === col.key ? '▼' : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(s => {
                    const isInactive = !s.last_active_date || s.last_active_date < threeDaysAgo
                    return (
                      <tr key={s.id}
                        className={`border-t border-[var(--bg-panel)] ${isInactive ? 'bg-[#FF658411]' : ''}`}>
                        <td className="p-2 text-[var(--text-primary)]">
                          {s.name}
                          {isInactive && <span className="ml-2 text-[var(--pink)] text-[6px]">INACTIVE ⚠️</span>}
                        </td>
                        <td className="p-2 text-[var(--text-muted)]">{s.last_active_date ?? 'Never'}</td>
                        <td className="p-2 text-center text-[var(--cyan)]">{s.testsDone}</td>
                        <td className="p-2 text-center text-[var(--green)]">{s.avgScore}</td>
                        <td className="p-2 text-[var(--pink)]">{s.weakestTopic}</td>
                        <td className="p-2 text-center">
                          <span className="text-[var(--yellow)]">🔥 {s.streak_days}d</span>
                        </td>
                      </tr>
                    )
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-[var(--text-muted)]">
                        No students yet. Share your invite code!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
