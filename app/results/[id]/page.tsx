'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase'
import { getLevelInfo } from '@/lib/gamification'
import LiveLeaderboard from '@/components/leaderboard/LiveLeaderboard'
import PixelCharacter from '@/components/character/PixelCharacter'
import SpeechBubble from '@/components/character/SpeechBubble'
import SkeletonLoader from '@/components/ui/SkeletonLoader'

export default function ResultsPage() {
  const router = useRouter()
  const params = useParams()
  const attemptId = params.id as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [victoryPhase, setVictoryPhase] = useState(true)
  const [displayScore, setDisplayScore] = useState(0)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel, setNewLevel] = useState(1)
  const [confetti, setConfetti] = useState<{id:number;x:number;y:number;color:string;dx:number;dy:number}[]>([])
  const [charAnim, setCharAnim] = useState<'idle'|'happy'|'sad'>('idle')

  useEffect(() => {
    const init = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth/login'); return }
      const { data: profile } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      const { data: attempt } = await supabase.from('attempts').select('*, tests(*)').eq('id', attemptId).single()
      if (!attempt) { router.push('/dashboard'); return }
      const { data: responses } = await supabase.from('question_responses').select('*, questions(*)').eq('attempt_id', attemptId)
      setData({ attempt, test: attempt.tests, responses: responses ?? [], user: profile as UserProfile })
      const score = attempt.total_score ?? 0
      const total = attempt.tests?.total_questions ?? 1
      const pct = (score / total) * 100
      if (pct > 80) setCharAnim('happy')
      else if (pct < 40) setCharAnim('sad')
      const oldXP = Math.max(0, (profile?.xp_points ?? 0) - (score * 10 + 50))
      const oldLevel = getLevelInfo(oldXP).level
      const newLvl = getLevelInfo(profile?.xp_points ?? 0).level
      if (newLvl > oldLevel) {
        setNewLevel(newLvl)
        setShowLevelUp(true)
        const pieces = Array.from({length:50},(_,i) => ({id:i,x:window.innerWidth/2,y:window.innerHeight/2,color:['#6C63FF','#FF6584','#43D19E','#FFD166','#00F5FF'][i%5],dx:(Math.random()-0.5)*400,dy:(Math.random()-0.5)*400}))
        setConfetti(pieces)
        setTimeout(() => setConfetti([]), 2000)
      }
      setLoading(false)
      setTimeout(() => setVictoryPhase(false), 2000)
    }
    init()
  }, [attemptId, router])

  useEffect(() => {
    if (!data || victoryPhase) return
    const target = data.attempt.total_score ?? 0
    if (target === 0) return
    const interval = setInterval(() => {
      setDisplayScore(prev => {
        const next = prev + Math.ceil(target / 50)
        if (next >= target) { clearInterval(interval); return target }
        return next
      })
    }, 20)
    return () => clearInterval(interval)
  }, [data, victoryPhase])

  if (loading) return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center"><SkeletonLoader lines={5} /></div>
  if (!data) return null

  const { attempt, test, responses, user } = data
  const score = attempt.total_score ?? 0
  const total = test?.total_questions ?? responses.length
  const pct = total > 0 ? Math.round((score / total) * 100) : 0
  const timeUsed = attempt.submitted_at ? Math.round((new Date(attempt.submitted_at).getTime() - new Date(attempt.started_at).getTime()) / 1000) : 0
  const rushed = responses.filter((r:any) => r.response_pattern==='rushed').length
  const guessing = responses.filter((r:any) => r.response_pattern==='guessing').length
  const overthinking = responses.filter((r:any) => r.response_pattern==='overthinking').length
  const confident = responses.filter((r:any) => r.response_pattern==='confident').length
  const victoryText = pct>70?'VICTORY! ⚔️':pct>=40?'BATTLE COMPLETE 🛡️':'RETRY MISSION 🔄'
  const victoryColor = pct>70?'var(--cyan)':pct>=40?'var(--yellow)':'var(--pink)'
  const scoreCtx = pct>80?'high_score':pct<40?'low_score':'default'
  const levelInfo = getLevelInfo(user.xp_points)

  const subjectMap: Record<string,{attempted:number;correct:number;wrong:number;time:number}> = {}
  responses.forEach((r:any) => {
    const s = r.questions?.subject ?? 'Unknown'
    if (!subjectMap[s]) subjectMap[s] = {attempted:0,correct:0,wrong:0,time:0}
    subjectMap[s].attempted++
    if (r.is_correct) subjectMap[s].correct++
    else subjectMap[s].wrong++
    subjectMap[s].time += r.time_taken_seconds ?? 0
  })

  const topicMap: Record<string,{correct:number;total:number}> = {}
  responses.forEach((r:any) => {
    const t = r.questions?.topic ?? 'Unknown'
    if (!topicMap[t]) topicMap[t] = {correct:0,total:0}
    topicMap[t].total++
    if (r.is_correct) topicMap[t].correct++
  })
  const topicList = Object.entries(topicMap).map(([t,v]) => ({topic:t, acc:v.total>0?(v.correct/v.total)*100:0}))
  const strengths = [...topicList].sort((a,b)=>b.acc-a.acc).slice(0,3)
  const weaknesses = [...topicList].sort((a,b)=>a.acc-b.acc).slice(0,3)

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-6 overflow-auto">
      {confetti.map(c => (
        <motion.div key={c.id} className="confetti-piece fixed" style={{background:c.color,left:c.x,top:c.y}} animate={{x:c.dx,y:c.dy,opacity:0}} transition={{duration:1.5}} />
      ))}

      <AnimatePresence>
        {showLevelUp && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
            <motion.div className="text-center" initial={{scale:0}} animate={{scale:1}} transition={{type:'spring',bounce:0.5}}>
              <div className="pixel-glow text-2xl mb-2" style={{fontFamily:"'Press Start 2P',monospace"}}>LEVEL UP! ⬆️</div>
              <div className="text-[var(--yellow)] text-lg" style={{fontFamily:"'Press Start 2P',monospace"}}>LVL {newLevel}</div>
              <button className="pixel-btn mt-6" onClick={()=>setShowLevelUp(false)}>CONTINUE</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {victoryPhase && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-[var(--bg-primary)]" exit={{opacity:0}} transition={{duration:0.5}}>
            <motion.div className="text-center" initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}>
              <div className="text-2xl" style={{fontFamily:"'Press Start 2P',monospace",color:victoryColor,textShadow:`0 0 20px ${victoryColor}`}}>{victoryText}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="max-w-4xl mx-auto space-y-6">
        <motion.div className="text-center" initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} transition={{delay:2.2}}>
          <div className="text-[var(--green)] text-sm" style={{fontFamily:"'Press Start 2P',monospace"}}>+{score*10+50} XP EARNED!</div>
          <div className="text-[var(--text-muted)] text-xs mt-1">LVL {levelInfo.level} — {levelInfo.title}</div>
        </motion.div>

        <div className="pixel-box bg-[var(--bg-card)] p-6 text-center">
          <div className="text-5xl mb-2" style={{fontFamily:"'Press Start 2P',monospace",color:victoryColor}}>{displayScore}</div>
          <div className="text-[var(--text-muted)] text-sm mb-4">/ {total} CORRECT</div>
          <div className="flex justify-center gap-8 text-sm">
            <div><div className="text-[var(--cyan)] text-lg">{pct}%</div><div className="text-[6px] text-[var(--text-muted)]">ACCURACY</div></div>
            <div><div className="text-[var(--yellow)] text-lg">{Math.floor(timeUsed/60)}m {timeUsed%60}s</div><div className="text-[6px] text-[var(--text-muted)]">TIME USED</div></div>
            <div><div className="text-[var(--green)] text-lg">{score}/{total}</div><div className="text-[6px] text-[var(--text-muted)]">CORRECT</div></div>
          </div>
        </div>

        <div className="pixel-box bg-[var(--bg-card)] p-4">
          <div className="text-[8px] text-[var(--cyan)] mb-3" style={{fontFamily:"'Press Start 2P',monospace"}}>BATTLE ANALYSIS 🧠</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{icon:'⚡',label:'Rushed',value:rushed,color:'var(--yellow)'},{icon:'🎲',label:'Guessing',value:guessing,color:'var(--pink)'},{icon:'🤔',label:'Overthinking',value:overthinking,color:'var(--purple)'},{icon:'✅',label:'Confident',value:confident,color:'var(--green)'}].map(s => (
              <div key={s.label} className="pixel-box bg-[var(--bg-panel)] p-3 text-center">
                <div className="text-xl">{s.icon}</div>
                <div className="text-lg mt-1" style={{color:s.color,fontFamily:"'Press Start 2P',monospace"}}>{s.value}</div>
                <div className="text-[6px] text-[var(--text-muted)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {Object.keys(subjectMap).length > 0 && (
          <div className="pixel-box bg-[var(--bg-card)] p-4">
            <div className="text-[8px] text-[var(--yellow)] mb-3" style={{fontFamily:"'Press Start 2P',monospace"}}>SUBJECT BREAKDOWN 📊</div>
            <table className="w-full text-sm">
              <thead><tr className="text-[var(--text-muted)] text-[7px]" style={{fontFamily:"'Press Start 2P',monospace"}}>
                <th className="text-left p-2">SUBJECT</th><th className="p-2">ATTEMPTED</th><th className="p-2">CORRECT</th><th className="p-2">WRONG</th><th className="p-2">AVG TIME</th>
              </tr></thead>
              <tbody>
                {Object.entries(subjectMap).map(([subj,v]) => (
                  <tr key={subj} className="border-t border-[var(--bg-panel)]">
                    <td className="p-2 text-[var(--text-primary)]">{subj}</td>
                    <td className="p-2 text-center text-[var(--text-muted)]">{v.attempted}</td>
                    <td className="p-2 text-center text-[var(--green)]">{v.correct}</td>
                    <td className="p-2 text-center text-[var(--pink)]">{v.wrong}</td>
                    <td className="p-2 text-center text-[var(--text-muted)]">{Math.round(v.time/v.attempted)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-[var(--bg-card)] p-4" style={{border:'3px solid var(--green)',boxShadow:'4px 4px 0px #000'}}>
            <div className="text-[8px] text-[var(--green)] mb-3" style={{fontFamily:"'Press Start 2P',monospace"}}>POWER TOPICS 💪</div>
            {strengths.map(s => (
              <div key={s.topic} className="flex justify-between items-center py-1 border-b border-[var(--bg-panel)]">
                <span className="text-sm text-[var(--text-primary)]">{s.topic}</span>
                <span className="text-[var(--green)] text-xs">{Math.round(s.acc)}%</span>
              </div>
            ))}
          </div>
          <div className="bg-[var(--bg-card)] p-4" style={{border:'3px solid var(--pink)',boxShadow:'4px 4px 0px #000'}}>
            <div className="text-[8px] text-[var(--pink)] mb-3" style={{fontFamily:"'Press Start 2P',monospace"}}>WEAK POINTS ⚠️</div>
            {weaknesses.map(s => (
              <div key={s.topic} className="flex justify-between items-center py-1 border-b border-[var(--bg-panel)]">
                <span className="text-sm text-[var(--text-primary)]">{s.topic}</span>
                <span className="text-[var(--pink)] text-xs">{Math.round(s.acc)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pixel-box bg-[var(--bg-card)] p-4">
          <LiveLeaderboard testId={test?.id} currentUserId={user.id} />
        </div>

        <div className="pixel-box bg-[var(--bg-card)] p-4 flex items-start gap-4">
          <PixelCharacter characterId={user.character_id} size={60} animation={charAnim} />
          <SpeechBubble context={scoreCtx as any} score={pct} streakDays={user.streak_days} />
        </div>

        <div className="flex gap-4 flex-wrap justify-center pb-8">
          <button className="pixel-btn" onClick={()=>router.push(`/review/${attemptId}`)}>REVIEW MISTAKES 🔍</button>
          <button className="pixel-btn pixel-btn-dark" onClick={()=>router.push('/dashboard')}>NEW BATTLE ⚔️</button>
          <button className="pixel-btn pixel-btn-dark" onClick={()=>router.push('/dashboard')}>HOME 🏠</button>
        </div>
      </motion.div>
    </div>
  )
}
