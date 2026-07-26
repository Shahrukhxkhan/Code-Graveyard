export type ProjectStage = "idea" | "prototype" | "mvp" | "launched" | "unknown";

export type AbandonmentReason =
  | "lost_interest"
  | "technical_debt"
  | "scope_creep"
  | "no_time"
  | "market_timing"
  | "team_issues"
  | "financial"
  | "technical_blocker"
  | "pivoted"
  | "other";

export type AdoptionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "abandoned"
  | "completed"
  | "abandoned_by_adopter"
  | "superseded";

export type User = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_username: string | null;
  website_url: string | null;
  is_admin?: boolean | null;
  email_notifications_enabled?: boolean | null;
  digest_opted_in?: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Project = {
  id: string;
  user_id: string;
  title: string;
  tagline: string;
  what_it_was: string;
  why_abandoned: string;
  what_worked: string;
  what_failed: string;
  lessons_learned: string;
  what_id_do_differently: string;
  the_moment_i_knew: string;
  stage_of_death: ProjectStage | null;
  primary_reason: AbandonmentReason | null;
  time_invested_hours: number | null;
  date_started: string | null;
  date_abandoned: string | null;
  github_url: string | null;
  demo_url: string | null;
  is_adoptable: boolean | null;
  is_anonymous: boolean | null;
  is_hidden?: boolean | null;
  summary?: string | null;
  summary_generated_at?: string | null;
  embedding?: number[] | null;
  view_count: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Tag = {
  id: string;
  name: string;
  category: string;
  color: string | null;
};

export type ProjectTag = {
  project_id: string;
  tag_id: string;
};

export type Snippet = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string;
  code: string;
  language: string;
  is_standalone: boolean | null;
  is_hidden?: boolean | null;
  save_count: number | null;
  created_at: string | null;
};

export type Adoption = {
  id: string;
  project_id: string;
  adopter_id: string;
  message: string;
  status: AdoptionStatus | null;
  responded_by_deadline?: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Save = {
  id: string;
  user_id: string;
  project_id: string | null;
  snippet_id: string | null;
  created_at: string | null;
};

export type ProjectWithRelations = Project & {
  user: User;
  tags: Tag[];
  snippet_count: number;
};

export type AdoptionWithRelations = Adoption & {
  project: Project & { user?: User | null };
  adopter: User;
};

export type ReportTargetType = "project" | "snippet";
export type ReportReason = "spam" | "harassment" | "plagiarism" | "inappropriate" | "other";
export type ReportStatus = "pending" | "reviewed" | "dismissed" | "actioned";

export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type ReportWithTarget = Report & {
  reporter?: User | null;
  project_target?: Project | null;
  snippet_target?: Snippet | null;
};

