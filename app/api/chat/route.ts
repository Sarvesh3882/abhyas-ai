import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { message, history, examType } = await req.json()
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' })

    const systemPrompt = `You are Abhyas, a friendly and expert JEE/NEET tutor AI. 
The student is preparing for ${examType ?? 'JEE'}.
- Answer questions about Physics, Chemistry, ${examType === 'NEET' ? 'Biology' : 'Mathematics'}
- Be concise but thorough — max 150 words per response
- Use simple language, occasional Hindi words (yaar, dekh, sahi hai) to feel friendly
- For numerical problems, show step-by-step working
- If asked non-academic questions, gently redirect to studies
- Format: use bullet points and numbered steps where helpful`

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Understood! I am Abhyas, your JEE/NEET tutor. Ask me anything!' }] },
        ...history.map((h: { role: string; text: string }) => ({
          role: h.role,
          parts: [{ text: h.text }]
        }))
      ]
    })

    const result = await chat.sendMessage(message)
    return NextResponse.json({ reply: result.response.text() })
  } catch (err: any) {
    const msg = err?.message ?? 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
