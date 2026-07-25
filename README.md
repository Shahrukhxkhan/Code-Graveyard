# Code-Graveyard 🪦

[![CI/CD Pipeline](https://github.com/OWNER/Code-Graveyard/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/Code-Graveyard/actions/workflows/ci.yml)

A developer platform for sharing abandoned side projects, distilling post-mortems, enabling project adoptions, and discovering failed projects by cause of death or semantic meaning.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database & Auth**: Supabase (PostgreSQL, RLS Policies)
- **Vector Search**: `pgvector` with HNSW cosine similarity index
- **AI Integration**: Anthropic API (`claude-sonnet-4-6`) & OpenAI API (`text-embedding-3-small`)
- **Styling**: Tailwind CSS + Shadcn UI + Lucide Icons

## ⚙️ Setup & Local Development

1. **Clone repository and install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and set required keys:
   ```bash
   cp .env.example .env.local
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

## 🧪 Testing & CI/CD Pipeline

- **Run linter**: `npm run lint`
- **Run type-check**: `npm run type-check`
- **Run TypeScript test suites**: `npm test`
- **Run production build**: `npm run build`

Automated CI/CD runs on every pull request and push to `main` via GitHub Actions (`.github/workflows/ci.yml`).

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
3. **Auth & Privacy Leak Safeguard Alert**:
   - **Condition**: Any captured exception containing unauthorized Supabase mutation errors.
   - **Target**: Security team notification.

