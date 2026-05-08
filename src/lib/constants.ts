import type { AbandonmentReason, ProjectStage } from "@/types"

export const APP_NAME = "Code Graveyard"

export const ABANDONMENT_REASONS: Array<{ value: AbandonmentReason; label: string }> = [
  { value: "lost_interest", label: "Lost Interest" },
  { value: "technical_debt", label: "Technical Debt" },
  { value: "scope_creep", label: "Scope Creep" },
  { value: "no_time", label: "No Time" },
  { value: "market_timing", label: "Market Timing" },
  { value: "team_issues", label: "Team Issues" },
  { value: "financial", label: "Financial" },
  { value: "technical_blocker", label: "Technical Blocker" },
  { value: "pivoted", label: "Pivoted" },
  { value: "other", label: "Other" },
]

export const PROJECT_STAGES: Array<{ value: ProjectStage; label: string }> = [
  { value: "idea", label: "Idea" },
  { value: "prototype", label: "Prototype" },
  { value: "mvp", label: "MVP" },
  { value: "launched", label: "Launched" },
  { value: "unknown", label: "Unknown" },
]

export const SUPPORTED_LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "TSX",
  "JSX",
  "Python",
  "Go",
  "Rust",
  "Java",
  "Kotlin",
  "Swift",
  "C",
  "C++",
  "C#",
  "PHP",
  "Ruby",
  "SQL",
  "Bash",
  "PowerShell",
  "HTML",
  "CSS",
  "JSON",
  "YAML",
  "Markdown",
] as const

export const ITEMS_PER_PAGE = 12
