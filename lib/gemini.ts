import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function getAIMentorFeedback(params: {
  question_text: string
  correct_answer: string
  student_answer: string
  subject: string
  topic: string
  time_taken_seconds: number
  response_pattern: string
}): Promise<{ explanation: string; mindMap: object }> {
  const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' })

  // Single combined prompt to save quota
  const prompt = `You are Abhyas, a warm IIT/NEET senior mentor.
A student got this question wrong.
QUESTION: ${params.question_text}
CORRECT ANSWER: ${params.correct_answer}
STUDENT ANSWER: ${params.student_answer}
TOPIC: ${params.topic}
SUBJECT: ${params.subject}
TIME TAKEN: ${params.time_taken_seconds} seconds
BEHAVIOR: ${params.response_pattern}

Reply in EXACTLY this JSON format, nothing else, no markdown:
{
  "explanation": "Your explanation here (under 150 words). Include: 1) what the brain missed, 2) correct approach in 3 steps, 3) one memory hook, 4) one trap alert. Tone: friendly IIT senior, simple English.",
  "mindMap": {
    "central_node": "core concept name",
    "branches": [
      {"id":"1","label":"related concept","connection":"why connected","is_weak_point":true,"children":[{"id":"1a","label":"sub concept","memory_hook":"one line analogy"}]},
      {"id":"2","label":"related concept","connection":"why connected","is_weak_point":false,"children":[{"id":"2a","label":"sub concept","memory_hook":"one line analogy"}]},
      {"id":"3","label":"related concept","connection":"why connected","is_weak_point":false,"children":[{"id":"3a","label":"sub concept","memory_hook":"one line analogy"}]}
    ]
  }
}`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(text)
    return { explanation: parsed.explanation, mindMap: parsed.mindMap }
  } catch {
    return { explanation: fallbackExplanation(params), mindMap: fallbackMindMap(params.topic) }
  }
}

function fallbackExplanation(params: { topic: string; response_pattern: string }) {
  const tips: Record<string, string> = {
    guessing: "You didn't read this carefully. Take time to understand each option.",
    overthinking: "You knew this — trust yourself more next time.",
    rushed: "Slow down on this topic specifically.",
  }
  return `This question tests your understanding of ${params.topic}. ${tips[params.response_pattern] ?? 'Review the core concept and try again.'} Focus on first principles and work step by step.`
}

function fallbackMindMap(topic: string) {
  return {
    central_node: topic,
    branches: [
      { id: '1', label: 'Core Concept', connection: 'Foundation', is_weak_point: true, children: [{ id: '1a', label: 'Basic Principle', memory_hook: 'Think of it as building blocks' }] },
      { id: '2', label: 'Application', connection: 'How it is used', is_weak_point: false, children: [{ id: '2a', label: 'Problem Solving', memory_hook: 'Step by step approach' }] },
      { id: '3', label: 'Common Traps', connection: 'Mistakes to avoid', is_weak_point: false, children: [{ id: '3a', label: 'Exam Tricks', memory_hook: 'Read carefully always' }] },
    ],
  }
}
