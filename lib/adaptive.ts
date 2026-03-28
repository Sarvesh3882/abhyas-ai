import { supabase } from './supabase'

export async function generateSmartTest(userId: string): Promise<string | null> {
  // Fetch user exam type
  const { data: userProfile } = await supabase.from('users').select('exam_type').eq('id', userId).single()
  const examType = userProfile?.exam_type ?? 'JEE'
  const examSubjects = examType === 'NEET' ? ['Physics', 'Chemistry', 'Biology'] : ['Physics', 'Chemistry', 'Maths']
  // Fetch topic performance
  const { data: perf } = await supabase
    .from('topic_performance')
    .select('*')
    .eq('user_id', userId)
    .order('total_correct', { ascending: true })

  // Get last 3 attempt question ids to avoid repeats
  const { data: recentAttempts } = await supabase
    .from('attempts')
    .select('id')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(3)

  const recentIds = recentAttempts?.map(a => a.id) ?? []
  let excludedQIds: string[] = []
  if (recentIds.length > 0) {
    const { data: recentResponses } = await supabase
      .from('question_responses')
      .select('question_id')
      .in('attempt_id', recentIds)
    excludedQIds = recentResponses?.map(r => r.question_id) ?? []
  }

  const totalQ = 10
  const questionIds: string[] = []

  if (!perf || perf.length === 0) {
    // New student — random medium from their exam subjects
    const { data: qs } = await supabase
      .from('questions')
      .select('id')
      .eq('difficulty', 'medium')
      .in('subject', examSubjects)
      .not('id', 'in', `(${excludedQIds.join(',') || 'null'})`)
      .limit(totalQ)
    qs?.forEach(q => questionIds.push(q.id))
  } else {
    const weak   = perf.filter(p => (p.total_correct / Math.max(p.total_attempted, 1)) < 0.4)
    const medium = perf.filter(p => { const acc = p.total_correct / Math.max(p.total_attempted, 1); return acc >= 0.4 && acc < 0.7 })
    const strong = perf.filter(p => (p.total_correct / Math.max(p.total_attempted, 1)) >= 0.7)

    const fetchForTopics = async (topics: typeof perf, difficulty: string, limit: number) => {
      if (topics.length === 0 || limit <= 0) return
      const topicNames = topics.slice(0, 2).map(t => t.topic)
      const { data: qs } = await supabase
        .from('questions')
        .select('id')
        .in('topic', topicNames)
        .in('subject', examSubjects)
        .eq('difficulty', difficulty)
        .not('id', 'in', `(${excludedQIds.join(',') || 'null'})`)
        .limit(limit)
      qs?.forEach(q => questionIds.push(q.id))
    }

    await fetchForTopics(weak,   'easy',   Math.ceil(totalQ * 0.4))
    await fetchForTopics(medium, 'medium', Math.ceil(totalQ * 0.3))
    await fetchForTopics(strong, 'hard',   Math.ceil(totalQ * 0.3))

    // Fill remaining with random if needed
    if (questionIds.length < totalQ) {
      const { data: fill } = await supabase
        .from('questions')
        .select('id')
        .in('subject', examSubjects)
        .not('id', 'in', `(${[...excludedQIds, ...questionIds].join(',') || 'null'})`)
        .limit(totalQ - questionIds.length)
      fill?.forEach(q => questionIds.push(q.id))
    }
  }

  if (questionIds.length === 0) return null

  // Create test record
  const { data: test } = await supabase
    .from('tests')
    .insert({
      created_by: userId,
      title: 'SMART BATTLE 🧠',
      subject: 'Mixed',
      total_questions: questionIds.length,
      duration_minutes: 30,
      is_smart_test: true,
    })
    .select()
    .single()

  if (!test) return null

  // Insert test_questions
  const tqs = questionIds.map((qid, i) => ({
    test_id: test.id,
    question_id: qid,
    order_number: i + 1,
  }))
  await supabase.from('test_questions').insert(tqs)

  return test.id
}
