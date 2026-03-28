'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'

interface Message {
  role: 'user' | 'model'
  text: string
}

interface Props {
  examType?: string
  userName?: string
}

const MOCK: Record<string, string> = {
  newton: "Newton's Laws — super important! ⚡\n\n**1st Law (Inertia):** Object stays at rest/motion unless a force acts.\n\n**2nd Law:** F = ma. Your most used formula!\n\n**3rd Law:** Every action has equal & opposite reaction.\n\n💡 Trick: 'Lazy objects stay lazy, pushed objects accelerate, everything pushes back!'\n\nComes 3-4 times every JEE Mains! 🎯",
  mitosis: "Mitosis vs Meiosis — classic NEET! 🧬\n\n**Mitosis:** 1 division → 2 identical cells. Growth & repair.\n\n**Meiosis:** 2 divisions → 4 haploid cells. Reproduction.\n\n💡 Trick: 'Mitosis = Makes identical, Meiosis = Makes gametes'\n\nThis appears every year in NEET! 🏥",
  integration: "Integration for JEE! 📐\n\n**Key formulas:**\n• ∫xⁿ dx = xⁿ⁺¹/(n+1) + C\n• ∫eˣ dx = eˣ + C\n• ∫sin x dx = -cos x + C\n\n**Strategy:** Substitution → By parts (ILATE) → Partial fractions\n\n💡 ILATE: Inverse trig, Log, Algebraic, Trig, Exponential\n\nPractice 10 daily! 🔥",
  time: "Time management — the real game changer! ⏰\n\n**Daily plan:**\n• Morning 6-9am: Tough subjects\n• Afternoon 2-5pm: Practice problems\n• Evening 7-10pm: Revision + mocks\n\n**During exam:** Don't spend >3 min on any question. Easy ones first!\n\n💡 Pomodoro: 25 min study + 5 min break\n\nConsistency beats intensity! 🏆",
}

const GENERIC = [
  "Great question yaar! 🎯\n\nHere's how to approach this:\n1. Start with the basic formula/concept\n2. Identify what's given and what's asked\n3. Apply step by step\n4. Always check units!\n\nThis type comes frequently in exams. Practice 5-10 similar problems and you'll nail it! 💪",
  "Dekh, this is simpler than it looks! 😊\n\nKey approach:\n• Break the problem into smaller parts\n• Apply first principles\n• Eliminate wrong options in MCQs\n\nThis topic has good weightage. Keep at it — every topper started exactly where you are! 👑",
  "Bilkul sahi pooch raha hai! 🔥\n\nRemember:\n1. Understand the concept fundamentally\n2. Memorize key formulas\n3. Solve previous year questions\n\nPYQs are gold — 60% of JEE/NEET repeats from past papers. Start there! 📚",
]

function getMock(msg: string): string {
  const l = msg.toLowerCase()
  if (l.includes('newton') || l.includes('law of motion')) return MOCK.newton
  if (l.includes('mitosis') || l.includes('meiosis') || l.includes('cell div')) return MOCK.mitosis
  if (l.includes('integrat')) return MOCK.integration
  if (l.includes('time') || l.includes('schedule') || l.includes('manage')) return MOCK.time
  return GENERIC[Math.floor(Math.random() * GENERIC.length)]
}

export default function ChatBot({ examType = 'JEE', userName = 'Student' }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hey ${userName}! 👋 I'm Abhyas, your ${examType} tutor. Ask me any doubt — Physics, Chemistry, ${examType === 'NEET' ? 'Biology' : 'Maths'}, anything!` }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100) }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, history: messages.slice(-6), examType })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'model', text: data.reply }])
    } catch {
      await new Promise(r => setTimeout(r, 900))
      setMessages(prev => [...prev, { role: 'model', text: getMock(userMsg) }])
    }
    setLoading(false)
    if (!open) setUnread(u => u + 1)
  }

  return (
    <>
      <motion.button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #7C3AED, #06b6d4)', boxShadow: '0 8px 32px rgba(124,58,237,0.5)' }}
        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
        animate={open ? { scale: 0, opacity: 0, pointerEvents: 'none' } : { scale: 1, opacity: 1 }}>
        <MessageCircle size={24} className="text-white" />
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-xs text-white font-bold">
            {unread}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl overflow-hidden"
            style={{ width: 380, height: 560, background: 'var(--bg-card)', border: '1px solid rgba(124,58,237,0.3)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }}>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(6,182,212,0.15))', borderBottom: '1px solid rgba(124,58,237,0.2)' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06b6d4)' }}>
                  <Bot size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">Abhyas AI Tutor</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400">{examType} Expert · Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-white/10 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-purple-600' : 'bg-cyan-600'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={{
                      background: msg.role === 'user' ? 'linear-gradient(135deg, #7C3AED, #6d28d9)' : 'rgba(255,255,255,0.05)',
                      border: msg.role === 'model' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                      color: 'var(--text-primary)',
                      borderRadius: msg.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px'
                    }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center"><Bot size={14} /></div>
                  <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Loader2 size={14} className="animate-spin text-purple-400" />
                    <span className="text-xs text-[var(--text-muted)]">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 flex gap-2 flex-wrap shrink-0">
                {[examType === 'NEET' ? 'Explain mitosis vs meiosis' : "Explain Newton's laws", 'Integration tips?', 'Time management tips'].map(q => (
                  <button key={q} onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="text-xs px-3 py-1.5 rounded-full transition-all"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex gap-2">
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask any JEE/NEET doubt..."
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-primary)' }} />
                <motion.button onClick={send} disabled={!input.trim() || loading}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #06b6d4)' }}>
                  <Send size={16} className="text-white" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
