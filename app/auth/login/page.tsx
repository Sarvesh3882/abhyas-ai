'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import StarField from '@/components/StarField'
import { Eye, EyeOff, Zap, Trophy, Brain, Target } from 'lucide-react'

const features = [
  { icon: Brain, label: 'AI Mentor', desc: 'Personalized explanations for every mistake' },
  { icon: Target, label: 'Adaptive Tests', desc: 'Questions tailored to your weak areas' },
  { icon: Trophy, label: 'Leaderboards', desc: 'Compete with students across India' },
  { icon: Zap, label: 'Smart Analytics', desc: 'Track your progress with deep insights' },
]

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data: profile } = await supabase.from('users').select('character_id, role').eq('id', user.id).single()
    if (!profile?.character_id) router.push('/auth/character-select')
    else if (profile.role === 'institute') router.push('/institute/dashboard')
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-mesh flex overflow-hidden">
      <StarField />

      {/* Left panel — branding */}
      <motion.div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative"
        initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>

        {/* Glow orb */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />

        {/* Logo */}
        <div>
          <div className="pixel-glow text-2xl mb-2" style={{ fontFamily: "'Press Start 2P', monospace", fontSize: 18 }}>
            ABHYAS AI
          </div>
          <p className="text-[var(--text-secondary)] text-sm mt-2">India's smartest JEE/NEET prep platform</p>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <h1 className="text-5xl font-bold leading-tight font-sora">
            <span className="text-white">Crack </span>
            <span className="gradient-text">JEE & NEET</span>
            <br />
            <span className="text-white">with AI</span>
          </h1>
          <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-md">
            Adaptive mock tests, AI-powered explanations, and real-time analytics — everything you need to get into your dream IIT or AIIMS.
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {features.map((f, i) => (
              <motion.div key={f.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div className="p-2 rounded-lg" style={{ background: 'rgba(124,58,237,0.2)' }}>
                  <f.icon size={16} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-white text-sm font-semibold">{f.label}</div>
                  <div className="text-[var(--text-muted)] text-xs mt-0.5">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* IIT logos strip */}
        <div>
          <p className="text-[var(--text-muted)] text-xs mb-3 uppercase tracking-widest">Trusted by students aiming for</p>
          <div className="flex items-center gap-6 flex-wrap">
            {['IIT Bombay', 'IIT Delhi', 'IIT Madras', 'AIIMS Delhi', 'NIT Trichy'].map(inst => (
              <div key={inst} className="badge badge-purple text-xs">{inst}</div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.05) 0%, transparent 50%)' }} />

        <motion.div className="w-full max-w-md z-10"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>

          <div className="glass-bright rounded-2xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white font-sora mb-2">Welcome back</h2>
              <p className="text-[var(--text-secondary)] text-sm">Sign in to continue your preparation</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email address</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required className="input-modern" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
                <div className="relative">
                  <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                    onChange={e => setPassword(e.target.value)} required className="input-modern pr-12" />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-4 rounded-xl text-sm"
                  style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6' }}>
                  <span>⚠️</span> {error}
                </motion.div>
              )}

              <motion.button type="submit" className="btn-primary w-full text-base py-4" disabled={loading}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In →'}
              </motion.button>
            </form>

            <div className="divider" />

            <p className="text-center text-sm text-[var(--text-secondary)]">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
                Create one free →
              </Link>
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[['50K+', 'Students'], ['2M+', 'Questions'], ['95%', 'Success Rate']].map(([val, label]) => (
              <div key={label} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-white font-bold text-lg font-sora">{val}</div>
                <div className="text-[var(--text-muted)] text-xs">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
