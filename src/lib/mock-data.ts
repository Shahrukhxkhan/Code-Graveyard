export type MockUser = {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  github_username?: string;
  website_url?: string;
};

export type MockTag = {
  name: string;
  color: string;
};

export type MockProject = {
  id: string;
  title: string;
  tagline: string;
  what_it_was: string;
  why_abandoned: string;
  what_worked: string;
  what_failed: string;
  the_moment_i_knew: string;
  lessons_learned: string;
  what_id_do_differently: string;
  stage_of_death: "idea" | "prototype" | "mvp" | "launched";
  primary_reason:
    | "lost_interest"
    | "scope_creep"
    | "technical_debt"
    | "no_time"
    | "market_timing";
  time_invested_hours: number;
  date_started: string;
  date_abandoned: string;
  github_url: string;
  is_adoptable: boolean;
  is_anonymous: boolean;
  view_count: number;
  tags: MockTag[];
  user: MockUser;
  snippet_count: number;
  adoption_count: number;
};

export type MockSnippet = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  language: string;
  code: string;
  is_standalone: boolean;
  save_count: number;
};

export const MOCK_USERS: MockUser[] = [
  {
    id: "u1",
    username: "alex_codes",
    full_name: "Alex Rivera",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Full stack dev. I build things until I don't.",
    github_username: "alex_codes",
    website_url: "https://alexcodes.dev",
  },
  {
    id: "u2",
    username: "sarah_builds",
    full_name: "Sarah Chen",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=sarah",
    bio: "Indie hacker. Professional project abandoner.",
    github_username: "sarahbuilds",
    website_url: "https://sarahbuilds.io",
  },
  {
    id: "u3",
    username: "mike_dev",
    full_name: "Mike Torres",
    avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=mike",
    bio: "I have 47 unfinished projects and zero regrets.",
    github_username: "mikedev",
    website_url: "https://mike.dev",
  },
];

export const MOCK_PROJECTS: MockProject[] = [
  {
    id: "1",
    title: "NomadDesk",
    tagline: "Remote work space finder SaaS for digital nomads.",
    what_it_was:
      "NomadDesk was a subscription SaaS that ranked cafes, coworking spots, and hotel lounges by Wi-Fi quality, noise levels, and seating comfort. I built a scraping pipeline, community review flow, and booking integrations. The goal was to become the default workspace finder for remote teams.",
    why_abandoned:
      "The data maintenance burden exploded faster than customer growth. Every city required constant moderation and stale reviews killed trust. I was spending more time cleaning data than shipping product improvements.",
    what_worked:
      "The onboarding flow converted well and users loved the map filters for power outlets, standing desks, and call-friendly zones. A weekly digest email drove strong return traffic. Early users even submitted location updates without incentives.",
    what_failed:
      "Marketplace dynamics were brutal because supply quality varied city by city. Partnerships with coworking spaces moved slower than expected. My pricing strategy also overestimated willingness to pay for a discovery-only product.",
    the_moment_i_knew:
      "When support tickets about outdated listings outnumbered feature requests for two straight months, I knew the core model was broken.",
    lessons_learned:
      "Products dependent on high-churn local data need operational leverage from day one. User-generated data requires strong trust and verification loops. I also learned to validate retention before investing in expensive integrations.",
    what_id_do_differently:
      "I would launch in one city first with a strict quality bar and concierge operations. I would focus on B2B team workspace credits instead of direct subscriptions. I would also build better incentives for verified community contributions.",
    stage_of_death: "mvp",
    primary_reason: "technical_debt",
    time_invested_hours: 640,
    date_started: "2022-08-04",
    date_abandoned: "2024-01-18",
    github_url: "https://github.com/example/project",
    is_adoptable: true,
    is_anonymous: false,
    view_count: 1823,
    tags: [
      { name: "Next.js", color: "#000000" },
      { name: "SaaS", color: "#6366F1" },
      { name: "API", color: "#F59E0B" },
      { name: "PostgreSQL", color: "#336791" },
    ],
    user: MOCK_USERS[0],
    snippet_count: 3,
    adoption_count: 2,
  },
  {
    id: "2",
    title: "GitMood",
    tagline: "Track developer mood by analyzing commit language over time.",
    what_it_was:
      "GitMood parsed commit messages, PR comments, and issue updates to estimate mood trends across teams. It generated weekly morale reports and burnout alerts for engineering managers. I wanted to create a lightweight emotional telemetry tool for dev teams.",
    why_abandoned:
      "The ethical and privacy concerns became a constant blocker in pilot conversations. Teams feared it could become surveillance instead of support. Without clear trust guarantees, adoption stalled.",
    what_worked:
      "The sentiment timeline visualization was genuinely useful and easy to read. Team leads appreciated seeing trends around releases and incidents. The alerting threshold configuration was flexible and practical.",
    what_failed:
      "Language-based mood inference produced false positives in sarcastic or multilingual teams. Collecting enough contextual signals without storing sensitive text was difficult. The core value proposition felt risky in practice.",
    the_moment_i_knew:
      "A pilot customer asked if they could hide the dashboard from developers, and that was my signal to stop.",
    lessons_learned:
      "Just because something can be measured does not mean it should be productized. Sensitive analytics need explicit consent design, not retrofitted policies. Trust architecture should come before dashboard polish.",
    what_id_do_differently:
      "I would pivot toward self-reported pulse checks instead of inferred sentiment. I would make all processing local-first with transparent models. I would also target individual coaching use cases rather than manager oversight.",
    stage_of_death: "prototype",
    primary_reason: "market_timing",
    time_invested_hours: 210,
    date_started: "2023-01-12",
    date_abandoned: "2023-10-02",
    github_url: "https://github.com/example/project",
    is_adoptable: false,
    is_anonymous: false,
    view_count: 972,
    tags: [
      { name: "TypeScript", color: "#3178C6" },
      { name: "AI/ML", color: "#8B5CF6" },
      { name: "Developer Tool", color: "#14B8A6" },
    ],
    user: MOCK_USERS[1],
    snippet_count: 1,
    adoption_count: 0,
  },
  {
    id: "3",
    title: "SnackStats",
    tagline: "Nutrition tracking CLI for terminal-first developers.",
    what_it_was:
      "SnackStats was a CLI that let users log meals with natural language and instantly view macro breakdowns. It supported aliases, daily goals, and CSV export for spreadsheets. The intent was to make food tracking as fast as committing code.",
    why_abandoned:
      "I underestimated how hard long-term nutrition logging is, even with good UX. Daily active usage dropped sharply after two weeks for most testers. The niche was too small to justify continued investment.",
    what_worked:
      "Power users loved keyboard-first logging and shell autocompletion. The fuzzy parser handled messy input surprisingly well. Weekly summary reports were concise and actionable.",
    what_failed:
      "The food database licensing constraints limited data quality and coverage. Syncing custom foods across machines introduced complexity that broke reliability. I also never found a monetization model that felt fair.",
    the_moment_i_knew:
      "When I realized I had stopped using it myself for a full month, the project effectively ended.",
    lessons_learned:
      "Founder behavior is often the clearest product signal. Great interface alone cannot fix habit-based churn. Choosing domains with open data can save months of friction.",
    what_id_do_differently:
      "I would position it as a paid plugin for existing health ecosystems instead of a standalone app. I would reduce scope to meal logging plus streak mechanics. I would also validate with diet coaches early.",
    stage_of_death: "mvp",
    primary_reason: "lost_interest",
    time_invested_hours: 140,
    date_started: "2022-11-09",
    date_abandoned: "2023-06-15",
    github_url: "https://github.com/example/project",
    is_adoptable: true,
    is_anonymous: false,
    view_count: 456,
    tags: [
      { name: "CLI Tool", color: "#10B981" },
      { name: "Node.js", color: "#339933" },
      { name: "TypeScript", color: "#3178C6" },
    ],
    user: MOCK_USERS[2],
    snippet_count: 2,
    adoption_count: 1,
  },
  {
    id: "4",
    title: "CoFounderMatch",
    tagline: "A swipe-style matching app for startup cofounders.",
    what_it_was:
      "CoFounderMatch paired builders based on skills, industry preferences, and commitment levels. It included profile prompts, intro templates, and async matching rounds. The vision was to reduce bad cofounder fits early.",
    why_abandoned:
      "Marketplace cold start was severe and required heavy manual curation. Users wanted high-quality matches immediately, but supply was fragmented by geography and domain. Growth loops never reached escape velocity.",
    what_worked:
      "The structured profile flow generated rich context and reduced awkward first messages. Match quality in curated cohorts was excellent. Users praised the commitment and expectation alignment questions.",
    what_failed:
      "Scaling beyond curated cohorts degraded match relevance quickly. Moderation workload grew with no clear path to automation. Paid acquisition costs were too high for uncertain LTV.",
    the_moment_i_knew:
      "After a launch campaign brought signups but only a handful of meaningful matches, I recognized the marketplace gap.",
    lessons_learned:
      "Marketplaces need either concentrated supply or exceptional demand pull. Curation can prove value but not necessarily scale economics. Segment focus beats broad audience ambition at the start.",
    what_id_do_differently:
      "I would start with a niche like technical cofounders for climate startups. I would run paid cohort programs instead of free matching. I would also design stronger referral incentives from day one.",
    stage_of_death: "launched",
    primary_reason: "scope_creep",
    time_invested_hours: 800,
    date_started: "2022-05-20",
    date_abandoned: "2024-02-28",
    github_url: "https://github.com/example/project",
    is_adoptable: true,
    is_anonymous: false,
    view_count: 1994,
    tags: [
      { name: "Social Platform", color: "#3B82F6" },
      { name: "SaaS", color: "#6366F1" },
      { name: "Next.js", color: "#000000" },
      { name: "API", color: "#F59E0B" },
    ],
    user: MOCK_USERS[1],
    snippet_count: 0,
    adoption_count: 3,
  },
  {
    id: "5",
    title: "SleepAPI",
    tagline: "Sleep schedule optimization API for apps and wearables.",
    what_it_was:
      "SleepAPI generated personalized sleep windows based on timezone, chronotype, and calendar load. It exposed endpoints for bedtime recommendations, recovery scores, and shift adjustments. I aimed to provide infrastructure for wellness apps.",
    why_abandoned:
      "The science-backed expectations from potential customers were higher than my available research depth. Integrating wearable data sources also created constant vendor API churn. The maintenance cost outpaced revenue opportunity.",
    what_worked:
      "The API docs and sandbox onboarding were smooth and developer-friendly. Simulation endpoints helped teams test scenarios quickly. Early feedback praised consistency and response speed.",
    what_failed:
      "Recommendation quality varied too much without continuous personal feedback loops. B2B deals moved slowly due to liability concerns around health guidance. Keeping integrations stable became an endless task.",
    the_moment_i_knew:
      "When two pilots paused citing regulatory risk, I stopped pretending traction was around the corner.",
    lessons_learned:
      "Health-adjacent products need stronger domain partnerships than pure engineering products. API products require clear wedge value beyond generic analytics. Validation cycles in regulated-ish spaces are longer than expected.",
    what_id_do_differently:
      "I would focus on a narrow use case like shift-worker fatigue alerts. I would partner with one data provider deeply before supporting many. I would also avoid broad wellness positioning.",
    stage_of_death: "prototype",
    primary_reason: "no_time",
    time_invested_hours: 320,
    date_started: "2023-03-10",
    date_abandoned: "2023-12-11",
    github_url: "https://github.com/example/project",
    is_adoptable: false,
    is_anonymous: true,
    view_count: 713,
    tags: [
      { name: "API", color: "#F59E0B" },
      { name: "Python", color: "#3776AB" },
      { name: "AI/ML", color: "#8B5CF6" },
    ],
    user: MOCK_USERS[0],
    snippet_count: 1,
    adoption_count: 0,
  },
  {
    id: "6",
    title: "LocalLens",
    tagline: "Hyperlocal news aggregator for neighborhoods and communities.",
    what_it_was:
      "LocalLens pulled stories from municipal feeds, independent blogs, and local newsletters into one digest. It ranked updates by relevance to your postcode and interests. The aim was to make local news discovery effortless.",
    why_abandoned:
      "Content licensing discussions were inconsistent and risky for long-term growth. Many sources changed feed structures without notice, breaking ingestion frequently. I could not build enough distribution to justify legal overhead.",
    what_worked:
      "The neighborhood personalization algorithm produced genuinely relevant digests. Push notifications during weather and transit disruptions had strong engagement. Users liked seeing local events alongside headlines.",
    what_failed:
      "Source reliability was poor and required constant parser fixes. Licensing uncertainty blocked partnerships with larger publishers. Monetization through local ads never reached meaningful scale.",
    the_moment_i_knew:
      "When a core source revoked syndication rights, my weekly digest quality dropped overnight and never recovered.",
    lessons_learned:
      "Content businesses live or die on durable supply agreements. Infrastructure resilience matters when upstream data is fragile. Distribution strategy should be validated before broad source ingestion.",
    what_id_do_differently:
      "I would start as a B2B civic information widget instead of a consumer app. I would prioritize official public data over publisher feeds. I would also design for fewer but higher-trust sources.",
    stage_of_death: "mvp",
    primary_reason: "market_timing",
    time_invested_hours: 420,
    date_started: "2022-09-01",
    date_abandoned: "2023-11-22",
    github_url: "https://github.com/example/project",
    is_adoptable: true,
    is_anonymous: false,
    view_count: 1284,
    tags: [
      { name: "SaaS", color: "#6366F1" },
      { name: "API", color: "#F59E0B" },
      { name: "Social Platform", color: "#3B82F6" },
    ],
    user: MOCK_USERS[2],
    snippet_count: 2,
    adoption_count: 1,
  },
  {
    id: "7",
    title: "CodeReview.ai",
    tagline: "AI-powered code review assistant for pull requests.",
    what_it_was:
      "CodeReview.ai analyzed pull requests and generated review comments focused on maintainability and risk. It integrated with GitHub checks and Slack summaries. The goal was to speed up team reviews without losing quality.",
    why_abandoned:
      "Model costs and latency made the experience inconsistent for larger repositories. Teams expected near-human review quality immediately, which was unrealistic without expensive context windows. Profitability looked distant.",
    what_worked:
      "The security and edge-case prompts surfaced useful issues in many PRs. Developers liked having a pre-review checklist before requesting human feedback. Setup was quick and docs were highly rated.",
    what_failed:
      "Noise in generated comments reduced trust over time. Repository indexing pipelines struggled with monorepo scale. Keeping up with model changes created operational instability.",
    the_moment_i_knew:
      "After seeing customers disable comments and keep only summary mode, I realized the core promise was not landing.",
    lessons_learned:
      "AI products need clear success metrics beyond novelty. Cost structure should be validated with worst-case usage early. Human-in-the-loop workflows often outperform full automation claims.",
    what_id_do_differently:
      "I would focus on one review niche like test quality coverage first. I would design an explicit confidence score for every suggestion. I would also constrain model calls with smarter file-level heuristics.",
    stage_of_death: "launched",
    primary_reason: "technical_debt",
    time_invested_hours: 760,
    date_started: "2022-07-14",
    date_abandoned: "2024-03-07",
    github_url: "https://github.com/example/project",
    is_adoptable: true,
    is_anonymous: false,
    view_count: 1672,
    tags: [
      { name: "AI/ML", color: "#8B5CF6" },
      { name: "Developer Tool", color: "#14B8A6" },
      { name: "TypeScript", color: "#3178C6" },
      { name: "GitHub", color: "#6e5494" },
    ],
    user: MOCK_USERS[0],
    snippet_count: 4,
    adoption_count: 2,
  },
  {
    id: "8",
    title: "PetDiary",
    tagline: "Social network for pet owners with care timelines.",
    what_it_was:
      "PetDiary let pet owners track meals, meds, walks, and milestones while sharing updates with friends and vets. It included community groups and reminders for recurring care tasks. The aim was to combine pet health journaling with social engagement.",
    why_abandoned:
      "Feature scope ballooned as users requested marketplace, tele-vet, and breeder tools. The social feed required moderation capabilities I was not ready to operate. Engagement remained shallow outside onboarding.",
    what_worked:
      "The timeline UI was delightful and easy for daily logging. Reminder completion rates were excellent for active users. Vet export PDFs solved a real practical need.",
    what_failed:
      "Community features were under-moderated and became noisy. Push notification tuning was difficult and caused opt-outs. Building both social and health utilities diluted focus.",
    the_moment_i_knew:
      "When active users used only reminders and ignored the social feed, I knew I had built two products badly.",
    lessons_learned:
      "Combining social and utility products multiplies complexity quickly. User interviews should decide which value prop leads roadmap priority. Moderation is a product function, not an afterthought.",
    what_id_do_differently:
      "I would launch as a focused pet care companion without social features. I would test paid premium reminders before adding community layers. I would also integrate directly with vet clinics earlier.",
    stage_of_death: "mvp",
    primary_reason: "scope_creep",
    time_invested_hours: 510,
    date_started: "2023-02-02",
    date_abandoned: "2024-02-10",
    github_url: "https://github.com/example/project",
    is_adoptable: false,
    is_anonymous: false,
    view_count: 1109,
    tags: [
      { name: "Mobile App", color: "#8B5CF6" },
      { name: "Social Platform", color: "#3B82F6" },
      { name: "React Native", color: "#61DAFB" },
    ],
    user: MOCK_USERS[1],
    snippet_count: 1,
    adoption_count: 1,
  },
];

export const MOCK_SNIPPETS: MockSnippet[] = [
  {
    id: "s1",
    project_id: "1",
    title: "Token Bucket Rate Limiter",
    description: "A lightweight in-memory limiter for API routes.",
    language: "TypeScript",
    is_standalone: true,
    save_count: 189,
    code: `type Bucket = { tokens: number; lastRefill: number };

const buckets = new Map<string, Bucket>();

export function createRateLimiter(maxTokens = 20, refillMs = 60_000) {
  return function allowRequest(key: string): boolean {
    const now = Date.now();
    const existing = buckets.get(key) ?? { tokens: maxTokens, lastRefill: now };

    const elapsed = now - existing.lastRefill;
    const refillCount = Math.floor(elapsed / refillMs);

    if (refillCount > 0) {
      existing.tokens = Math.min(maxTokens, existing.tokens + refillCount);
      existing.lastRefill = now;
    }

    if (existing.tokens <= 0) {
      buckets.set(key, existing);
      return false;
    }

    existing.tokens -= 1;
    buckets.set(key, existing);
    return true;
  };
}`,
  },
  {
    id: "s2",
    project_id: "2",
    title: "useDebounce Hook",
    description: "Delay expensive operations until input settles.",
    language: "TypeScript",
    is_standalone: true,
    save_count: 242,
    code: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  delay = 300,
) {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(() => callback(...args), delay));
  };
}`,
  },
  {
    id: "s3",
    project_id: "3",
    title: "Retry With Exponential Backoff",
    description: "Retry unstable async operations with jitter.",
    language: "TypeScript",
    is_standalone: true,
    save_count: 317,
    code: `type RetryOptions = {
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { retries = 5, baseDelayMs = 200, maxDelayMs = 5_000 } = options;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries) throw error;
      const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 150);
      await new Promise((resolve) => setTimeout(resolve, exp + jitter));
      attempt += 1;
    }
  }
}`,
  },
  {
    id: "s4",
    project_id: "5",
    title: "JWT Decode Helper",
    description: "Safely decode JWT payloads without verification.",
    language: "TypeScript",
    is_standalone: false,
    save_count: 146,
    code: `type JwtPayload = Record<string, unknown> & {
  exp?: number;
  iat?: number;
  sub?: string;
};

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = base64UrlDecode(parts[1]);
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}`,
  },
  {
    id: "s5",
    project_id: "6",
    title: "Pagination Helper",
    description: "Compute pagination metadata for API responses.",
    language: "TypeScript",
    is_standalone: true,
    save_count: 221,
    code: `type PaginationInput = {
  page: number;
  perPage: number;
  totalItems: number;
};

export function buildPaginationMeta({
  page,
  perPage,
  totalItems,
}: PaginationInput) {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / safePerPage));
  const offset = (safePage - 1) * safePerPage;

  return {
    page: safePage,
    perPage: safePerPage,
    totalItems,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    offset,
    limit: safePerPage,
  };
}`,
  },
  {
    id: "s6",
    project_id: "7",
    title: "Slug Generator",
    description: "Create stable slugs from arbitrary titles.",
    language: "TypeScript",
    is_standalone: true,
    save_count: 402,
    code: `export function toSlug(value: string, maxLength = 80) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\\u0300-\\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\\s-]/g, "")
    .replace(/[\\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength);
  const safeCut = sliced.lastIndexOf("-");
  return safeCut > 0 ? sliced.slice(0, safeCut) : sliced;
}

export function uniqueSlug(title: string, suffix?: string) {
  const base = toSlug(title);
  return suffix ? \`\${base}-\${toSlug(suffix, 24)}\` : base;
}`,
  },
];

export const MOCK_STATS = {
  total_projects: 847,
  total_snippets: 2341,
  total_adoptions: 156,
};
