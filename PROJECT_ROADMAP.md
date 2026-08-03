# Duolingo Somali — Project Roadmap

## Phase 0: Foundation (Current)

- [x] Project scaffolding (Next.js 16, TypeScript, Tailwind, shadcn/ui, Prisma, SQLite, Zustand)
- [x] SPA-in-Next.js architecture (single `/` route, Zustand client-side routing)
- [x] Auth system (direct fetch to NextAuth API, no `next-auth/react` client SDK)
- [x] 17 Prisma models with content status workflow (`draft` → `pending_review` → `published`)
- [x] JSON content pipeline with seed script (`scripts/seed-content.ts`)
- [x] Unit 1 content seeded (Greetings, Introductions, Numbers — 3 lessons, 20 vocab, 13 exercises)
- [x] Exercise renderer with 6 types (multiple_choice, fill_blank, translation, match_word, sentence_ordering, typing)
- [x] Lesson flow with vocab cards + exercises + completion screen
- [x] Gamification basics (XP, hearts, coins, streak, levels)
- [x] E2E verified: register → dashboard → learn → lesson → exercises → completion

## Phase 1: Core Learning Experience

- [ ] Browser TTS fallback for pronunciation (`speechSynthesis`, `provider: "browser-tts"`)
- [ ] Unit 2 content (Family & People) — 3 lessons as `pending_review`/`ai`
- [ ] Content review workflow (ReviewView approve/reject)
- [ ] Remaining exercise types (Listening, Speaking, ImageSelection)
- [ ] Gamification polish (achievements, leaderboard, streak tracking)
- [ ] Stats visualization (progress charts, accuracy trends)
- [ ] Dark/light mode testing and responsive polish
- [ ] **PostgreSQL migration** — **BLOCKED**: sandbox environment has no sudo/Docker access. Must migrate from SQLite to PostgreSQL before Phase 1 is considered complete. Prisma abstracts the DB layer so migration is config-only (`DATABASE_URL` + `provider`), but requires a running PostgreSQL instance.

## Phase 2: Content & Quality

- [ ] AI-assisted content generation pipeline
- [ ] Linguist review tools
- [ ] Content versioning and rollback
- [ ] Expanded curriculum (Units 3–10+)
- [ ] Audio recording pipeline (native speaker audio replacing browser TTS)

## Phase 3: Engagement & Retention

- [ ] Push notifications / reminders
- [ ] Social features (friends, study groups)
- [ ] Spaced repetition system (SRS)
- [ ] Offline support (PWA)
- [ ] Performance analytics dashboard

## Technical Debt

- [ ] PostgreSQL migration (blocked on environment)
- [ ] Add comprehensive error boundaries
- [ ] Add E2E tests (Playwright)
- [ ] API rate limiting
- [ ] Content CDN for media assets
