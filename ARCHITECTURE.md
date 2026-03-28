# Abhyas AI — Architecture

## Frontend (Next.js 14 App Router)

```
Browser
  └── Next.js 14 (Vercel)
        ├── App Router (RSC + Client Components)
        ├── Framer Motion (animations)
        ├── React Flow (mind maps)
        ├── Recharts (radar chart)
        └── Lucide React (icons)
```

## Pages & Routing

```
/                          → redirects to /auth/login
/auth/login                → email/password auth
/auth/signup               → 3-step: form → role → JEE/NEET
/auth/character-select     → pick avatar
/auth/join-institute       → enter invite code
/dashboard                 → student home (filtered by exam type)
/test/[id]                 → live test engine
/results/[id]              → score + leaderboard
/review/[id]               → AI mentor + mind maps
/profile                   → stats + radar + badges
/institute/dashboard       → institute admin panel
```

## API Routes (Server-side)

```
/api/mentor   POST   → Gemini explanation + mind map JSON
/api/chat     POST   → Gemini chatbot (with mock fallback)
```

## Backend (Supabase)

```
Supabase
  ├── Auth          → email/password sessions
  ├── PostgreSQL
  │     ├── users              (profile, XP, streak, exam_type)
  │     ├── tests              (exam_type: JEE/NEET/Both)
  │     ├── test_questions     (links tests ↔ questions)
  │     ├── questions          (subject, topic, difficulty)
  │     ├── attempts           (ongoing/submitted)
  │     ├── question_responses (answers, patterns, AI cache)
  │     ├── topic_performance  (per-user accuracy per topic)
  │     ├── leaderboard        (scores per test)
  │     ├── institutes         (invite codes)
  │     └── institute_students (membership)
  └── Realtime      → leaderboard live updates
```

## AI Layer (Gemini 1.5 Flash)

```
Gemini API
  ├── Mentor feedback    → explanation + mind map (cached in DB)
  ├── Chat tutor         → JEE/NEET doubt solving
  └── Smart test logic   → adaptive question selection (lib/adaptive.ts)
```

## Data Flow

```
Student takes test
  → answers saved to question_responses
  → topic_performance updated
  → XP + badges calculated (lib/gamification.ts)
  → leaderboard inserted (triggers Realtime)
  → redirects to /results

Student reviews mistakes
  → /api/mentor called per wrong answer
  → Gemini returns explanation + mind map JSON
  → cached in question_responses.ai_feedback
  → React Flow renders mind map

Smart test
  → lib/adaptive.ts reads topic_performance
  → sorts by accuracy (weakest first)
  → filters by exam_type subjects
  → creates new test record + test_questions
  → redirects to /test/[new_id]
```

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | Next.js 14, React 18, TypeScript  |
| Styling     | Tailwind CSS, Framer Motion       |
| Database    | Supabase (PostgreSQL)             |
| Auth        | Supabase Auth                     |
| Realtime    | Supabase Realtime                 |
| AI          | Google Gemini 1.5 Flash           |
| Charts      | Recharts                          |
| Mind Maps   | React Flow                        |
| Icons       | Lucide React                      |
| Deployment  | Vercel                            |

## Deployment

```
Vercel (frontend + API routes)
  └── env vars:
        NEXT_PUBLIC_SUPABASE_URL
        NEXT_PUBLIC_SUPABASE_ANON_KEY
        GEMINI_API_KEY

Supabase (database + auth + realtime)
  └── Free tier (500MB DB, 50K MAU)
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

## Key Design Decisions

- **No separate backend server** — everything runs on Vercel edge functions + Supabase
- **AI responses cached** — Gemini output stored in `question_responses.ai_feedback` to avoid repeat API calls
- **Exam type filtering** — JEE students see Physics/Chemistry/Maths tests, NEET students see Physics/Chemistry/Biology
- **Adaptive testing** — weak topics get easier questions, strong topics get harder ones
- **Realtime leaderboard** — Supabase Realtime pushes score updates instantly to all connected clients
- **Mock AI fallback** — chatbot falls back to pre-written responses when Gemini quota is exceeded
