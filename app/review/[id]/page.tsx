'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase'
import { addXP } from '@/lib/gamification'
import AIMentorBubble from '@/components/mentor/AIMentorBubble'
import MindMap from '@/components/mentor/MindMap'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

type Filter = 'all' | 'guessing' | 'overthinking'

interface WrongItem {
  response: any
  question: any
  explanation: string | null
  mindMap: any | null
  loadingAI: boolean
  understood: boolean
}

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.id as string

  const [user, setUser] = useState<UserProfile | null>(null)
  const [items, setItems] = useState<WrongItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(profile as UserProfile)

      const { data: responses } = await supabase
        .from('question_responses')
        .select('*, questions(*)')
        .eq('attempt_id', attemptId)
        .eq('is_correct', false)

      const wrongItems: WrongItem[] = (responses ?? []).map((r: any) => ({
        response: r,
        question: r.questions,
        explanation: r.ai_feedback ?? null,
        mindMap: r.mind_map_json ?? null,
        loadingAI: !r.ai_feedback,
        understood: r.understood ?? false,
      }))

      setItems(wrongItems)
      setLoading(false)

      // Only auto-load AI for the first wrong answer, rest load on demand
      if (wrongItems.length > 0 && !wrongItems[0].explanation) {
        setTimeout(() => fetchAI(0, wrongItems[0], authUser.id), 500)
      }
    }
    init()
  }, [attemptId, router])

  const fetchAI = async (idx: number, item: WrongItem, userId: string) => {
    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_text: item.question?.question_text,
          correct_answer: item.question?.correct_option,
          student_answer: item.response?.selected_option,
          subject: item.question?.subject,
          topic: item.question?.topic,
          time_taken_seconds: item.response?.time_taken_seconds,
          response_pattern: item.response?.response_pattern,
          response_id: item.response?.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error('Mentor API error:', data)
        setItems(prev => prev.map((it, i) => i === idx ? { ...it, explanation: `Error: ${data.error ?? 'API failed'}`, loadingAI: false } : it))
        return
      }
      setItems(prev => prev.map((it, i) => i === idx
        ? { ...it, explanation: data.explanation, mindMap: data.mindMap, loadingAI: false }
        : it
      ))
    } catch (err) {
      console.error('Fetch error:', err)
      setItems(prev => prev.map((it, i) => i === idx ? { ...it, explanation: 'Failed to load AI explanation. Check console.', loadingAI: false } : it))
    }
  }

  const handleUnderstood = async (idx: number, responseId: string) => {
    if (!user) return
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, understood: true } : it))
    await supabase.from('question_responses').update({ understood: true }).eq('id', responseId)
    await addXP(user.id, 5)
  }

  const filtered = items.filter(item => {
    if (filter === 'all') return true
    if (filter === 'guessing') return item.response?.response_pattern === 'guessing'
    if (filter === 'overthinking') return item.response?.response_pattern === 'overthinking'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-6">
        <SkeletonLoader lines={8} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-sm text-[var(--text-primary)] mb-1" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            POST-BATTLE ANALYSIS 🔍
          </h1>
          <p className="text-[var(--text-muted)] text-xs">Wrong answers only — let&apos;s fix them</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'guessing', 'overthinking'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`pixel-btn text-[7px] ${filter === f ? '' : 'pixel-btn-dark'}`}>
              {f === 'all' ? 'ALL WRONG' : f === 'guessing' ? '🎲 GUESSED' : '🤔 OVERTHOUGHT'}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="pixel-box bg-[var(--bg-card)] p-8 text-center">
            <div className="text-[var(--green)] text-sm mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
              PERFECT! 🎉
            </div>
            <div className="text-[var(--text-muted)] text-xs">No wrong answers in this filter.</div>
          </div>
        )}

        <div className="space-y-6">
          {filtered.map((item, idx) => {
            const q = item.question
            if (!q) return null
            const timeTaken = item.response?.time_taken_seconds ?? 0
            const pattern = item.response?.response_pattern ?? 'calculated'
            const patternLabel = pattern === 'guessing' ? '🎲 LIKELY GUESSED' : pattern === 'overthinking' ? '🤔 OVERTHINKING' : pattern === 'rushed' ? '⚡ RUSHED' : '🎯 CALCULATED'
            const patternColor = pattern === 'guessing' ? 'var(--pink)' : pattern === 'overthinking' ? 'var(--purple)' : pattern === 'rushed' ? 'var(--yellow)' : 'var(--green)'

            return (
              <motion.div key={item.response?.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="pixel-box bg-[var(--bg-card)]"
                style={{ borderColor: 'var(--purple)' }}>

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-[var(--bg-panel)]">
                  <div>
                    <span className="text-[8px] text-[var(--yellow)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                      Q.{String(items.indexOf(item) + 1).padStart(2, '0')} — {q.topic}
                    </span>
                    <div className="mt-1">
                      <span className="text-[7px] px-2 py-0.5" style={{ fontFamily: "'Press Start 2P', monospace", color: patternColor, border: `1px solid ${patternColor}` }}>
                        {patternLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-[7px] text-[var(--text-muted)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                    ⏱ {Math.floor(timeTaken / 60)}m {timeTaken % 60}s
                  </div>
                </div>

                {/* Question */}
                <div className="p-4 border-b border-[var(--bg-panel)]">
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed mb-4">{q.question_text}</p>
                  <div className="flex gap-3 flex-wrap">
                    <div className="px-3 py-2 text-sm" style={{ border: '3px solid var(--pink)', background: '#FF658422', boxShadow: '3px 3px 0px #000' }}>
                      ❌ Your Answer: {item.response?.selected_option ?? 'Skipped'}
                    </div>
                    <div className="px-3 py-2 text-sm" style={{ border: '3px solid var(--green)', background: '#43D19E22', boxShadow: '3px 3px 0px #000' }}>
                      ✅ Correct: {q.correct_option}
                    </div>
                  </div>
                </div>

                {/* AI Mentor */}
                <div className="p-4 border-b border-[var(--bg-panel)]">
                  {item.explanation ? (
                    <AIMentorBubble
                      explanation={item.explanation}
                      loading={item.loadingAI}
                      characterId={user?.character_id ?? 3}
                    />
                  ) : item.loadingAI ? (
                    <AIMentorBubble explanation={null} loading={true} characterId={user?.character_id ?? 3} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="text-[8px] text-[var(--text-muted)]" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                        🤖 ABHYAS SAYS:
                      </div>
                      <button
                        className="pixel-btn text-[7px]"
                        onClick={() => fetchAI(idx, item, user?.id ?? '')}>
                        LOAD AI EXPLANATION ✨
                      </button>
                    </div>
                  )}
                </div>

                {/* Mind Map */}
                {(item.mindMap || item.loadingAI) && (
                  <div className="p-4 border-b border-[var(--bg-panel)]">
                    <div className="text-[8px] text-[var(--cyan)] mb-2" style={{ fontFamily: "'Press Start 2P', monospace" }}>
                      🧠 CONCEPT MAP
                    </div>
                    {item.loadingAI ? (
                      <div className="h-32 flex items-center justify-center">
                        <SkeletonLoader lines={3} />
                      </div>
                    ) : item.mindMap ? (
                      <MindMap data={item.mindMap} />
                    ) : null}
                  </div>
                )}

                {/* I Got It */}
                <div className="p-4">
                  {item.understood ? (
                    <button className="pixel-btn text-[7px]" style={{ background: 'var(--bg-panel)', cursor: 'default' }} disabled>
                      ✅ UNDERSTOOD
                    </button>
                  ) : (
                    <button
                      className="pixel-btn pixel-btn-green text-[7px]"
                      onClick={() => handleUnderstood(idx, item.response?.id)}>
                      ✅ I GOT IT! +5 XP
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="flex gap-4 mt-8 pb-8 flex-wrap">
          <button className="pixel-btn" onClick={() => router.push('/dashboard')}>
            HOME 🏠
          </button>
          <button className="pixel-btn pixel-btn-dark" onClick={() => router.push('/dashboard')}>
            NEW BATTLE ⚔️
          </button>
        </div>
      </motion.div>
    </div>
  )
}
