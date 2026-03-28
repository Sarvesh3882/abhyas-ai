'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, GraduationCap, Building2, CheckCircle2, FlaskConical, Calculator } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StarField from '@/components/StarField'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [role, setRole] = useState<'student' | 'institute' | null>(null)
  const [examType, setExamType] = useState<'JEE' | 'NEET' | null>(null)
  const [step, setStep] = useState<'form' | 'role' | 'exam'>('form')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    if (data.user?.id) await supabase.from('users').insert({ id: data.user.id, email, name })
    setLoading(false); setStep('role')
  }

  const handleRoleSelect = async (r: 'student' | 'institute') => {
    setRole(r)
    if (r === 'institute') {
      await finishSignup(r, null)
    } else {
      setStep('exam')
    }
  }

  const handleExamSelect = async (exam: 'JEE' | 'NEET') => {
    setExamType(exam)
    await finishSignup('student', exam)
  }

  const finishSignup = async (r: 'student' | 'institute', exam: 'JEE' | 'NEET' | null) => {
    setLoading(true); setError('')
    try {
      let { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { data: s, error: sErr } = await supabase.auth.signInWithPassword({ email, password })
        if (sErr) { setError('Please try logging in manually.'); setLoading(false); return }
        user = s.user
      }
      if (!user) { setError('Could not get user.'); setLoading(false); return }
      await supabase.from('users').update({ role: r, exam_type: exam ?? 'JEE' }).eq('id', user.id)
      if (r === 'institute') {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase()
        await supabase.from('institutes').insert({ name: `${name}'s Institute`, owner_id: user.id, invite_code: code })
      }
      router.push('/auth/character-select')
    } catch { setError('Something went wrong.'); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4 relative overflow-hidden">
      <StarField />
      <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)' }} />

      <motion.div className="w-full max-w-md z-10"
        initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        <div className="text-center mb-8">
          <div className="pixel-glow text-lg mb-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 14 }}>ABHYAS AI</div>
          <p className="text-[var(--text-secondary)] text-sm">Start your JEE/NEET journey today</p>
        </div>

        <div className="glass-bright rounded-2xl p-8">
          <AnimatePresence mode="wait">

            {/* Step 1 — Form */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white font-sora mb-1">Create account</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Free forever · No credit card needed</p>
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
                    <input type="text" placeholder="Arjun Sharma" value={name} onChange={e => setName(e.target.value)} required className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email</label>
                    <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required className="input-modern" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} placeholder="Min 6 characters" value={password}
                        onChange={e => setPassword(e.target.value)} required minLength={6} className="input-modern pr-12" />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  {error && (
                    <div className="p-3 rounded-xl text-sm flex items-center gap-2"
                      style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6' }}>
                      ⚠️ {error}
                    </div>
                  )}
                  <motion.button type="submit" className="btn-primary w-full py-4 text-base" disabled={loading}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    {loading ? 'Creating...' : 'Continue →'}
                  </motion.button>
                </form>
                <div className="mt-4 space-y-2">
                  {['Adaptive AI-powered tests', 'Detailed performance analytics', 'Live leaderboards'].map(b => (
                    <div key={b} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <CheckCircle2 size={14} className="text-green-400 shrink-0" /> {b}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 — Role */}
            {step === 'role' && (
              <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-3">👋</div>
                  <h2 className="text-2xl font-bold text-white font-sora mb-2">I am a...</h2>
                  <p className="text-[var(--text-secondary)] text-sm">Choose your role</p>
                </div>
                {error && (
                  <div className="p-3 rounded-xl text-sm mb-4 flex items-center gap-2"
                    style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6' }}>
                    ⚠️ {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { r: 'student' as const, icon: GraduationCap, label: 'Student', desc: 'Preparing for JEE or NEET', color: '#a78bfa' },
                    { r: 'institute' as const, icon: Building2, label: 'Institute', desc: 'Coaching center or school', color: '#22d3ee' },
                  ].map(opt => (
                    <motion.button key={opt.r} onClick={() => handleRoleSelect(opt.r)} disabled={loading}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      className="p-5 rounded-xl text-center transition-all"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="flex justify-center mb-3">
                        <div className="p-3 rounded-xl" style={{ background: `${opt.color}20` }}>
                          <opt.icon size={24} style={{ color: opt.color }} />
                        </div>
                      </div>
                      <div className="text-white font-semibold mb-1">{opt.label}</div>
                      <div className="text-[var(--text-muted)] text-xs">{opt.desc}</div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3 — Exam type */}
            {step === 'exam' && (
              <motion.div key="exam" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="text-4xl mb-3">🎯</div>
                  <h2 className="text-2xl font-bold text-white font-sora mb-2">Which exam?</h2>
                  <p className="text-[var(--text-secondary)] text-sm">We'll personalize your experience</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    {
                      exam: 'JEE' as const,
                      icon: Calculator,
                      label: 'JEE',
                      full: 'Joint Entrance Exam',
                      subjects: 'Physics · Chemistry · Maths',
                      color: '#a78bfa',
                      emoji: '🔢'
                    },
                    {
                      exam: 'NEET' as const,
                      icon: FlaskConical,
                      label: 'NEET',
                      full: 'National Eligibility Test',
                      subjects: 'Physics · Chemistry · Biology',
                      color: '#34d399',
                      emoji: '🧬'
                    },
                  ].map(opt => (
                    <motion.button key={opt.exam} onClick={() => handleExamSelect(opt.exam)} disabled={loading}
                      whileHover={{ scale: 1.03, y: -4 }} whileTap={{ scale: 0.97 }}
                      className="p-5 rounded-xl text-center transition-all relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${opt.color}15 0%, rgba(14,14,42,0.8) 100%)`, border: `1px solid ${opt.color}30` }}>
                      <div className="text-4xl mb-3">{opt.emoji}</div>
                      <div className="text-white font-bold text-xl font-sora mb-1">{opt.label}</div>
                      <div className="text-xs mb-2" style={{ color: opt.color }}>{opt.full}</div>
                      <div className="text-[var(--text-muted)] text-xs">{opt.subjects}</div>
                      {loading && examType === opt.exam && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                          style={{ background: `${opt.color}20` }}>
                          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        </div>
                      )}
                    </motion.button>
                  ))}
                </div>
                <button onClick={() => setStep('role')} className="w-full mt-4 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  ← Back
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          <div className="divider" />
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Sign in →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
