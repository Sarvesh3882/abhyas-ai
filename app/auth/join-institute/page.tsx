'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import StarField from '@/components/StarField'

export default function JoinInstitutePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { data: institute } = await supabase.from('institutes').select('id').eq('invite_code', code.toUpperCase()).single()
    if (!institute) { setError('Invalid invite code'); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('institute_students').insert({ institute_id: institute.id, student_id: user.id })
    await supabase.from('users').update({ institute_id: institute.id }).eq('id', user.id)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <StarField />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="pixel-box bg-[var(--bg-card)] p-8 w-[400px]">
        <h1 className="pixel-glow text-center text-sm mb-6" style={{ fontFamily: "'Press Start 2P', monospace" }}>
          JOIN YOUR INSTITUTE
        </h1>
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <input
            type="text" placeholder="INVITE CODE (6 chars)" value={code}
            onChange={e => setCode(e.target.value.toUpperCase())} maxLength={6} required
            className="bg-[var(--bg-primary)] text-[var(--text-primary)] p-3 text-sm pixel-box outline-none focus:border-[var(--cyan)] w-full text-center tracking-widest"
          />
          {error && <div className="text-[var(--pink)] text-xs pixel-box-red p-2">{error}</div>}
          <button type="submit" className="pixel-btn w-full" disabled={loading}>
            {loading ? 'JOINING...' : 'JOIN INSTITUTE 🏫'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
