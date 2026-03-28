'use client'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import CharacterSelect from '@/components/character/CharacterSelect'
import { useState } from 'react'

export default function CharacterSelectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSelect = async (id: number) => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').update({ character_id: id }).eq('id', user.id)
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    router.push(profile?.role === 'institute' ? '/institute/dashboard' : '/dashboard')
  }

  return <CharacterSelect onSelect={handleSelect} loading={loading} />
}
