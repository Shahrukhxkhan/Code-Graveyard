# Code-Graveyard 🪦

[![CI/CD Pipeline](https://github.com/OWNER/Code-Graveyard/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/Code-Graveyard/actions/workflows/ci.yml)

A developer platform for publishing abandoned side projects, distilling post-mortems, facilitating project adoptions, and discovering failed projects through natural language meaning or cause-of-death filters.

---

## 🌟 Key Features & Capabilities

- **🪦 Post-Mortem Burial Wizard**: Capture 7 structured post-mortem fields (`what_it_was`, `why_abandoned`, `what_worked`, `what_failed`, `lessons_learned`, `what_id_do_differently`, `the_moment_i_knew`) with anonymous burial privacy options.
- **✨ AI Post-Mortem Summaries**: Asynchronous non-blocking generation of punchy, single-sentence failure takeaways using Anthropic API (`claude-sonnet-4-6`), with owner-only 1-hour rate-limited regeneration controls and tagline fallback.
- **🔍 Dual-Mode Search (pg_trgm + pgvector)**:
  - **Trigram Keyword Search**: Fast keyword matching on title/tagline for short queries.
  - **Semantic Meaning Search**: Natural language phrase querying powered by OpenAI embeddings (`text-embedding-3-small` 1536-d vectors) indexed with PostgreSQL HNSW (`vector_cosine_ops`), pre-filtered by active criteria (`stage_of_death`, `primary_reason`, `is_adoptable`).
- **💡 "Similar Projects" Recommendation Engine**: Hybrid recommendation algorithm blending inverse-document-frequency (IDF) weighted tag overlap with vector embedding similarity, cached with 1-hour HTTP headers (`s-maxage=3600`) and cold-start fallback.
- **🤝 Dispute Handling & Multi-Adopter Resolution**: End-to-end adoption management flow with 14-day handoff deadlines (`responded_by_deadline`), automatic candidate superseding on accept, non-responsive adopter abandonment reopening (`is_adoptable = true`), applicant re-application, and real-time dashboard state management.
- **🛡️ Content Moderation & RLS Security**: Moderation queue (`/admin/reports`) guarded by server-side `is_admin` checks, rate-limited user reporting (5 reports/hr), multi-level Row Level Security policies, and hidden content (`is_hidden = true`) filtering.
- **👁️ Anti-Inflation View Counter**: Atomic deduplication RPC (`increment_project_views`) combining client debouncing with persistent session fingerprints.
- **⚙️ Automated CI/CD & Error Monitoring**: Multi-job GitHub Actions workflow (`lint-and-typecheck`, `test-ts`, `test-sql` via `pgvector` Postgres container, `build`) plus `@sentry/nextjs` production error tracking with PII scrubbing.

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database & Auth**: Supabase (PostgreSQL, RLS Policies, Service Role Triggers)
- **Vector Search**: Supabase `pgvector` with HNSW Cosine Index
- **AI Models**: Anthropic API (`claude-sonnet-4-6`) & OpenAI API (`text-embedding-3-small`)
- **Monitoring**: `@sentry/nextjs`
- **CI/CD**: GitHub Actions
- **Styling**: Tailwind CSS + Shadcn UI + Lucide Icons

---

## ⚙️ Setup & Local Development

1. **Clone repository & install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and set your credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Run database migrations**:
   Apply SQL migration files in `src/lib/supabase/` to your Supabase instance:
   - `schema.sql` (Master Schema & Tables)
   - `migration_moderation.sql` (Content Moderation & Admin System)
   - `migration_adoptions_resolution.sql` (Adoption Resolution & Deadlines)
   - `migration_ai_summary.sql` (AI Summaries Column & Index)
   - `migration_pgvector_semantic_search.sql` (pgvector Extension & Similarity RPC)
   - `migration_similar_projects.sql` (IDF & Blended Similarity RPC)
   - `migration_discovery_indexes.sql` (Trigram & Filter Indexes)

4. **Start local development server**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing & Validation

Execute local verification scripts:

- **Run linter**: `npm run lint`
- **Run TypeScript type-check**: `npm run type-check`
- **Run all TypeScript test suites**: `npm test`
  - `test-anonymity.ts` (Bidirectional Anonymity & Role Privacy)
  - `test-view-count.ts` (Anti-Inflation View Deduplication)
  - `test-moderation.ts` (Moderation Queue & Rate Limiting)
  - `test-adoptions-resolution.ts` (Dispute Handling & Multi-Adopter State Machine)
  - `test-ai-summary.ts` (AI Summary Persistence & Fallback)
  - `test-semantic-search.ts` (pgvector Cosine Search & Pre-filtering)
  - `test-similar-projects.ts` (IDF Tag Overlap & Vector Blending)
- **Run production build**: `npm run build`

---

## 🛡️ Production Error Monitoring & Sentry Alert Rules

Error tracking and performance monitoring are integrated via `@sentry/nextjs`.

### Recommended Sentry Dashboard Alert Rules
1. **Error Rate Spike Alert**:
   - **Condition**: Count of unhandled exceptions > 10 in 5 minutes.
   - **Target**: PagerDuty / Slack `#dev-alerts`.
   - **Purpose**: Detect immediate system-wide outages or deployment regressions.
2. **Adoption Flow Error Alert**:
   - **Condition**: Any error with tag `feature: adoptions_resolve`.
   - **Target**: High-priority notification.
   - **Purpose**: Immediate alert on dispute resolution, handoff, or status transition failures.
3. **Auth & Privacy Safeguard Alert**:
   - **Condition**: Any captured exception containing unauthorized Supabase mutation errors.
   - **Target**: Security team notification.
