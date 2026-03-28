import { NextRequest, NextResponse } from 'next/server'
import { getAIMentorFeedback } from '@/lib/gemini'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { response_id, ...params } = body

    // Check cache
    if (response_id) {
      const { data: cached } = await supabase
        .from('question_responses')
        .select('ai_feedback, mind_map_json')
        .eq('id', response_id)
        .single()

      if (cached?.ai_feedback) {
        return NextResponse.json({ explanation: cached.ai_feedback, mindMap: cached.mind_map_json })
      }
    }

    const { explanation, mindMap } = await getAIMentorFeedback(params)

    // Cache result
    if (response_id) {
      await supabase.from('question_responses').update({
        ai_feedback: explanation,
        mind_map_json: mindMap,
      }).eq('id', response_id)
    }

    return NextResponse.json({ explanation, mindMap })
  } catch (err: any) {
    console.error('Mentor API error full:', JSON.stringify(err, Object.getOwnPropertyNames(err)))
    return NextResponse.json({ error: err?.message ?? 'Failed to get AI feedback' }, { status: 500 })
  }
}
