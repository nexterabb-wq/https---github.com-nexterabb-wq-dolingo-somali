# Duolingo Somali — Work Log

---
Task ID: 1
Agent: Super Z (main)
Task: Fix SettingsView `mounted` ReferenceError + Fix "No courses available" on Learn page

Work Log:
- Fixed `SettingsView.tsx`: added missing `mounted` state variable (`useState(false)`) and `useEffect` to set it true after hydration
- Checked database: SQLite (PostgreSQL unavailable — no sudo/Docker in sandbox)
- Found database completely empty — seed script had never been successfully run
- Root cause #1: `scripts/seed-content.ts` didn't force `published` status on sections/vocabulary/exercises (they defaulted to `draft`)
- Rewrote seed script to explicitly set `status: 'published'` on ALL content (course, unit, lesson, section, vocabulary, exercise)
- Ran seed successfully: 45 records (1 course, 2 units, 3 lessons, 6 sections, 20 vocab, 13 exercises)
- Verified via direct DB query: all records have `published` status
- Verified `/api/courses` returns full course tree with 3 lessons under Unit 1
- Verified `/api/lessons?lessonId=lesson-01-01` returns sections with nested vocabulary + exercises
- Root cause #2: `/api/auth/login` route was missing — both LoginView and RegisterView called it but it didn't exist, causing silent auth failure
- Created `/api/auth/login/route.ts` — direct credential verification (bcrypt) returning user data, bypassing NextAuth cookie dance since the SPA uses Zustand for auth state
- Root cause #3: `LessonView.tsx` expected `data.lesson`, `data.sections`, `data.exercises`, `data.vocabulary` but API returns flat `{ id, title, ..., sections: [{ vocabulary: [...], exercises: [...] }] }`
- Fixed data extraction in LessonView to flatten exercises and vocabulary from nested sections
- Root cause #4: After lesson completion, `progressMap` wasn't updated locally, so Learn page showed 0/3 completed
- Added `updateProgress()` call in `finishLesson` to immediately update local state
- Full browser E2E verified: register → dashboard → Learn tab → expand unit → open lesson → 6 vocab cards → 5 exercises (multiple_choice, fill_blank, translation, match_word) → Lesson Complete screen (Score 80%, +30 XP, +3 Coins, 0 Hearts Lost)

Stage Summary:
- 4 bugs fixed: missing mounted state, missing login route, wrong API response parsing, missing local progress update
- Seed script now forces `published` on all foundational content
- Full learn flow verified working in browser (mobile viewport 390x844)
- Database: 45 records seeded, all published
- Note: PostgreSQL could not be installed (no sudo/Docker). SQLite works identically via Prisma — migration to PostgreSQL is a config-only change when a PG instance is available.
