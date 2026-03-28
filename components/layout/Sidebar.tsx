'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, User, LogOut, Building2, Users, ClipboardList, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { UserProfile } from '@/lib/supabase'
import PixelCharacter from '../character/PixelCharacter'
import { getLevelInfo } from '@/lib/gamification'

const studentNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
]
const instituteNav = [
  { href: '/institute/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/institute/students', label: 'Students', icon: Users },
  { href: '/institute/assign', label: 'Assign Tests', icon: ClipboardList },
]

export default function Sidebar({ user }: { user: UserProfile }) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = user.role === 'institute' ? instituteNav : studentNav
  const lvl = getLevelInfo(user.xp_points)
  const xpPct = lvl.neededXP > 0 ? Math.min(100, (lvl.currentXP / lvl.neededXP) * 100) : 100

  return (
    <aside className="w-64 min-h-screen flex flex-col shrink-0 relative"
      style={{ background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)' }}>

      {/* Top glow */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="px-5 py-5 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #06b6d4)' }}>
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-sm font-sora">Abhyas AI</div>
            <div className="text-[var(--text-muted)] text-xs">JEE · NEET Prep</div>
          </div>
        </div>
      </div>

      <div className="divider mx-4 my-0" />

      {/* Player card */}
      <div className="p-4 mx-3 my-3 rounded-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.06) 100%)', border: '1px solid rgba(124,58,237,0.2)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(124,58,237,0.2)' }}>
              <PixelCharacter characterId={user.character_id} size={40} animation="idle" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #06b6d4)', fontSize: 8, color: 'white', fontFamily: "'Press Start 2P', monospace" }}>
              {lvl.level}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm truncate">{user.name}</div>
            <div className="text-[var(--text-muted)] text-xs">{lvl.title}</div>
          </div>
        </div>

        {/* XP bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-[var(--text-muted)]">XP Progress</span>
            <span className="text-purple-400 font-medium">{lvl.currentXP}/{lvl.neededXP || '∞'}</span>
          </div>
          <div className="xp-bar-track">
            <motion.div className="xp-bar-fill" initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 1, delay: 0.3 }} />
          </div>
        </div>

        {/* Streak */}
        {user.streak_days > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-base">🔥</span>
            <span className="text-xs text-orange-400 font-medium">{user.streak_days} day streak</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-2">
        <p className="text-[var(--text-muted)] text-xs uppercase tracking-widest px-3 mb-2">Menu</p>
        {nav.map((item, i) => {
          const isActive = pathname === item.href
          return (
            <motion.div key={item.href} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
                    animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                )}
              </Link>
            </motion.div>
          )
        })}
        {!user.institute_id && user.role === 'student' && (
          <Link href="/auth/join-institute" className="nav-item">
            <Building2 size={18} />
            <span>Join Institute</span>
          </Link>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3">
        <button onClick={async () => { await supabase.auth.signOut(); router.push('/auth/login') }}
          className="nav-item w-full text-left hover:text-red-400 hover:bg-red-500/10">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
