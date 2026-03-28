'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Question, UserProfile } from '@/lib/supabase'
import { detectResponsePattern, addXP, checkAndAwardBadges } from '@/lib/gamification'
import PixelModal from '@/components/ui/PixelModal'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

type AnswerMap = Record<string, string>
type TimeMap = Record<string, number>
type FlagMap = Record<string, boolean>

export default function TestPage() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string
  const [user, setUser] = useState<UserProfile | null>(null)
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'preparing'|'rules'|'active'|'submitting'>('preparing')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState<AnswerMap>({})
  const [flagged, setFlagged] = useState<FlagMap>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [questionTimes, setQuestionTimes] = useState<TimeMap>({})
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showFocusBreach, setShowFocusBreach] = useState(false)
  const [answerReveal, setAnswerReveal] = useState<Record<string, 'correct'|'wrong'|null>>({})
  const [xpFloats, setXpFloats] = useState<{id:number;x:number;y:number}[]>([])
  const xpFloatId = useRef(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const questionStartRef = useRef(Date.now())

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(profile as UserProfile)
      const { data: testData } = await supabase.from('tests').select('*').eq('id', testId).single()
      if (!testData) { router.push('/dashboard'); return }
      setTest(testData)
      const { data: tqs } = await supabase.from('test_questions').select('question_id, order_number, questions(*)').eq('test_id', testId).order('order_number')
      const qs = tqs?.map((tq: any) => tq.questions).filter(Boolean) ?? []
      setQuestions(qs)
      setTimeLeft(testData.duration_minutes * 60)
      const { data: attempt } = await supabase.from('attempts').insert({ user_id: authUser.id, test_id: testId, status: 'ongoing' }).select().single()
      setAttemptId(attempt?.id ?? null)
      setLoading(false)
      setTimeout(() => setPhase('rules'), 1500)
    }
    init()
  }, [testId, router])

  useEffect(() => {
    if (phase !== 'active') return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { handleSubmit(); return 0 } return t - 1 })
    }, 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase])

  useEffect(() => {
    const onVis = () => { if (document.hidden && phase === 'active') setShowFocusBreach(true) }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [phase])

  const recordQuestionTime = useCallback((qId: string) => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000)
    setQuestionTimes(prev => ({ ...prev, [qId]: (prev[qId] ?? 0) + elapsed }))
    questionStartRef.current = Date.now()
  }, [])

  const goToQuestion = (idx: number) => {
    if (questions[currentIdx]) recordQuestionTime(questions[currentIdx].id)
    setCurrentIdx(idx)
    questionStartRef.current = Date.now()
  }

  const selectAnswer = (qId: string, option: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (answers[qId]) return
    const q = questions.find(q => q.id === qId)!
    const isCorrect = option === q.correct_option
    setAnswers(prev => ({ ...prev, [qId]: option }))
    setAnswerReveal(prev => ({ ...prev, [qId]: isCorrect ? 'correct' : 'wrong' }))
    if (isCorrect) {
      const rect = e.currentTarget.getBoundingClientRect()
      const id = xpFloatId.current++
      setXpFloats(prev => [...prev, { id, x: rect.left, y: rect.top }])
      setTimeout(() => setXpFloats(prev => prev.filter(f => f.id !== id)), 900)
    }
  }

  const handleSubmit = async () => {
    if (!user || !attemptId || !test) return
    setPhase('submitting')
    if (timerRef.current) clearInterval(timerRef.current)
    if (questions[currentIdx]) recordQuestionTime(questions[currentIdx].id)
    const timeUsed = (test.duration_minutes * 60) - timeLeft
    let score = 0
    const responses = questions.map(q => {
      const selected = answers[q.id] ?? null
      const isCorrect = selected === q.correct_option
      if (isCorrect) score++
      const timeTaken = questionTimes[q.id] ?? 0
      return { attempt_id: attemptId, question_id: q.id, selected_option: selected, is_correct: isCorrect, time_taken_seconds: timeTaken, was_skipped: !selected, response_pattern: detectResponsePattern(timeTaken, isCorrect) }
    })
    await supabase.from('question_responses').insert(responses)
    await supabase.from('attempts').update({ submitted_at: new Date().toISOString(), total_score: score, status: 'submitted' }).eq('id', attemptId)
    const topicMap: Record<string, { correct:number; total:number; time:number; subject:string }> = {}
    questions.forEach((q, i) => {
      if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0, time: 0, subject: q.subject }
      topicMap[q.topic].total++
      if (responses[i].is_correct) topicMap[q.topic].correct++
      topicMap[q.topic].time += responses[i].time_taken_seconds
    })
    for (const [topic, val] of Object.entries(topicMap)) {
      const { data: ex } = await supabase.from('topic_performance').select('*').eq('user_id', user.id).eq('topic', topic).single()
      if (ex) await supabase.from('topic_performance').update({ total_attempted: ex.total_attempted + val.total, total_correct: ex.total_correct + val.correct, avg_time_seconds: Math.round((ex.avg_time_seconds + val.time / val.total) / 2), last_updated: new Date().toISOString() }).eq('id', ex.id)
      else await supabase.from('topic_performance').insert({ user_id: user.id, subject: val.subject, topic, total_attempted: val.total, total_correct: val.correct, avg_time_seconds: Math.round(val.time / val.total) })
    }
    await addXP(user.id, score * 10 + 50)
    await supabase.from('users').update({ daily_completed_today: (user.daily_completed_today ?? 0) + questions.length }).eq('id', user.id)
    await supabase.from('leaderboard').insert({ user_id: user.id, test_id: testId, score, accuracy: questions.length > 0 ? (score / questions.length) * 100 : 0, time_taken_total: timeUsed })
    const { data: allAttempts } = await supabase.from('attempts').select('total_score').eq('user_id', user.id)
    const highScoreCount = (allAttempts as Array<{total_score:number|null}>|null)?.filter(a => ((a.total_score??0)/questions.length) > 0.8).length ?? 0
    await checkAndAwardBadges(user.id, { attemptCount: allAttempts?.length??0, highScoreCount, submittedHour: new Date().getHours(), streakDays: user.streak_days, isPerfectScore: score===questions.length, isSpeedRun: timeUsed < test.duration_minutes*60*0.5, currentBadges: user.badges??[] })
    router.push(`/results/${attemptId}`)
  }

  const q = questions[currentIdx]
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const timerDanger = timeLeft < 300

  if (loading) return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
      <div className="text-center">
        <div className="pixel-glow text-[10px] mb-4" style={{fontFamily:"'Press Start 2P',monospace"}}>PREPARING BATTLE...</div>
        <SkeletonLoader lines={3} />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
      {xpFloats.map(f => (
        <motion.div key={f.id} className="fixed pointer-events-none z-50 text-[var(--green)]"
          style={{left:f.x,top:f.y,fontFamily:"'Press Start 2P',monospace",fontSize:10}}
          initial={{opacity:1,y:0}} animate={{opacity:0,y:-40}} transition={{duration:0.8}}>
          +10 XP
        </motion.div>
      ))}

      <PixelModal open={phase==='rules'} onClose={()=>{}} title="BATTLE RULES ⚔️">
        <div className="space-y-3 text-sm text-[var(--text-muted)]">
          <div>📋 {test?.total_questions} questions · ⏰ {test?.duration_minutes} minutes</div>
          <div>✅ +10 XP per correct answer</div>
          <div>⚠️ Tab switching will be detected</div>
        </div>
        <button className="pixel-btn w-full mt-4" onClick={()=>{document.documentElement.requestFullscreen?.().catch(()=>{});setPhase('active');questionStartRef.current=Date.now()}}>
          ENTER BATTLE ⚔️
        </button>
      </PixelModal>

      <PixelModal open={showFocusBreach} onClose={()=>setShowFocusBreach(false)} title="">
        <div className="text-center">
          <div className="text-[var(--pink)] text-[10px] mb-2" style={{fontFamily:"'Press Start 2P',monospace"}}>⚠️ FOCUS BREACH</div>
          <div className="text-sm text-[var(--text-muted)] mb-4">Return to battle!</div>
          <button className="pixel-btn pixel-btn-red" onClick={()=>setShowFocusBreach(false)}>RETURN</button>
        </div>
      </PixelModal>

      <PixelModal open={showSubmitModal} onClose={()=>setShowSubmitModal(false)} title="SUBMIT FINAL ANSWERS?">
        <div className="text-sm text-[var(--text-muted)] mb-4 space-y-1">
          <div>✅ Answered: {Object.keys(answers).length}</div>
          <div>⏭️ Skipped: {questions.length - Object.keys(answers).length}</div>
        </div>
        <div className="flex gap-3">
          <button className="pixel-btn pixel-btn-green flex-1" onClick={()=>{setShowSubmitModal(false);handleSubmit()}}>CONFIRM ✅</button>
          <button className="pixel-btn pixel-btn-dark flex-1" onClick={()=>setShowSubmitModal(false)}>CANCEL ❌</button>
        </div>
      </PixelModal>

      {phase==='active' && q && (
        <>
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-card)] pixel-box">
            <div className="text-[7px] text-[var(--text-muted)]" style={{fontFamily:"'Press Start 2P',monospace"}}>{test?.title}</div>
            <div className={`text-[10px] px-3 py-1 pixel-box ${timerDanger?'timer-danger':''}`} style={{fontFamily:"'Press Start 2P',monospace",color:timerDanger?'var(--pink)':'var(--cyan)'}}>
              ⏰ {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
            </div>
            <div className="text-[7px] text-[var(--text-muted)]" style={{fontFamily:"'Press Start 2P',monospace"}}>Q {currentIdx+1}/{questions.length}</div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            <div className="w-48 bg-[var(--bg-card)] p-3 overflow-y-auto shrink-0">
              <div className="text-[6px] text-[var(--text-muted)] mb-2" style={{fontFamily:"'Press Start 2P',monospace"}}>QUESTIONS</div>
              <div className="grid grid-cols-5 gap-1">
                {questions.map((q2,i) => (
                  <button key={q2.id} onClick={()=>goToQuestion(i)} className="text-[7px] p-1 text-center"
                    style={{background:flagged[q2.id]?'var(--yellow)':answers[q2.id]?'var(--green)':i===currentIdx?'var(--purple)':'var(--bg-panel)',border:'2px solid #000',color:'#fff',fontFamily:"'Press Start 2P',monospace",minWidth:24,minHeight:24}}>
                    {i+1}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
                  <div className="inline-block pixel-box px-2 py-1 mb-3 text-[8px] text-[var(--yellow)]" style={{fontFamily:"'Press Start 2P',monospace"}}>
                    Q.{String(currentIdx+1).padStart(2,'0')} — {q.topic}
                  </div>
                  <div className="text-base text-[var(--text-primary)] mb-6 leading-relaxed">{q.question_text}</div>
                  <div className="space-y-3">
                    {(['A','B','C','D'] as const).map(opt => {
                      const optText = q[`option_${opt.toLowerCase()}` as keyof Question] as string
                      const isSelected = answers[q.id]===opt
                      const reveal = answerReveal[q.id]
                      const isCorrectOpt = q.correct_option===opt
                      let borderColor='var(--purple)', bg='var(--bg-card)'
                      if (reveal) { if(isCorrectOpt){borderColor='var(--green)';bg='#43D19E22'} else if(isSelected){borderColor='var(--pink)';bg='#FF658422'} }
                      else if (isSelected) { borderColor='var(--cyan)'; bg='var(--purple-glow)' }
                      return (
                        <motion.button key={opt} whileHover={!answers[q.id]?{scale:1.01}:{}}
                          onClick={(e:React.MouseEvent<HTMLButtonElement>)=>selectAnswer(q.id,opt,e)}
                          className="w-full text-left p-4 transition-all"
                          style={{border:`3px solid ${borderColor}`,background:bg,boxShadow:'3px 3px 0px #000',cursor:answers[q.id]?'default':'pointer'}}>
                          <span className="text-[8px] text-[var(--text-muted)] mr-3" style={{fontFamily:"'Press Start 2P',monospace"}}>{opt}.</span>
                          <span className="text-sm text-[var(--text-primary)]">{optText}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                  <div className="flex gap-3 mt-6 flex-wrap">
                    <button className="pixel-btn pixel-btn-yellow text-[7px]" onClick={()=>setFlagged(prev=>({...prev,[q.id]:!prev[q.id]}))}>
                      {flagged[q.id]?'⚑ UNFLAG':'⚑ MARK REVIEW'}
                    </button>
                    <button className="pixel-btn pixel-btn-dark text-[7px]" onClick={()=>goToQuestion(Math.max(0,currentIdx-1))} disabled={currentIdx===0}>← PREV</button>
                    <button className="pixel-btn text-[7px]" onClick={()=>goToQuestion(Math.min(questions.length-1,currentIdx+1))} disabled={currentIdx===questions.length-1}>NEXT →</button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          <div className="fixed bottom-6 right-6">
            <button className="pixel-btn" style={{background:'var(--pink)'}} onClick={()=>setShowSubmitModal(true)}>SUBMIT ✅</button>
          </div>
        </>
      )}

      {phase==='submitting' && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="pixel-glow text-sm mb-4" style={{fontFamily:"'Press Start 2P',monospace"}}>CALCULATING RESULTS...</div>
            <SkeletonLoader lines={3} />
          </div>
        </div>
      )}
    </div>
  )
}
