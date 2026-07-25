/**
 * CONTENT MODERATION SYSTEM REGRESSION TEST SUITE
 * 
 * Verifies:
 * 1. A user can report a target once but NOT twice (unique constraint enforcement).
 * 2. Non-admin users are denied access (403 Forbidden) to administrative reports queue.
 * 3. Actioning a report updates report status, attributes reviewing admin, sets is_hidden = true
 *    on the target, and excludes the target from public queries.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export type SimulatedUser = {
  id: string;
  username: string;
  is_admin: boolean;
};

export type SimulatedProject = {
  id: string;
  user_id: string;
  title: string;
  tagline: string;
  is_hidden: boolean;
};

export type SimulatedSnippet = {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  code: string;
  is_hidden: boolean;
};

export type SimulatedReport = {
  id: string;
  reporter_id: string;
  target_type: "project" | "snippet";
  target_id: string;
  reason: "spam" | "harassment" | "plagiarism" | "inappropriate" | "other";
  details: string | null;
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export class ModerationSystemSimulator {
  users: Map<string, SimulatedUser> = new Map();
  projects: Map<string, SimulatedProject> = new Map();
  snippets: Map<string, SimulatedSnippet> = new Map();
  reports: Map<string, SimulatedReport> = new Map();

  // Index for unique constraint on (reporter_id, target_type, target_id)
  reportUniqueIndex: Set<string> = new Set();

  createUser(id: string, username: string, isAdmin = false): SimulatedUser {
    const user: SimulatedUser = { id, username, is_admin: isAdmin };
    this.users.set(id, user);
    return user;
  }

  createProject(id: string, userId: string, title: string): SimulatedProject {
    const project: SimulatedProject = {
      id,
      user_id: userId,
      title,
      tagline: `Tagline for ${title}`,
      is_hidden: false,
    };
    this.projects.set(id, project);
    return project;
  }

  createSnippet(id: string, projectId: string, userId: string, title: string): SimulatedSnippet {
    const snippet: SimulatedSnippet = {
      id,
      project_id: projectId,
      user_id: userId,
      title,
      code: 'console.log("hello world");',
      is_hidden: false,
    };
    this.snippets.set(id, snippet);
    return snippet;
  }

  // Submit report with rate limit and unique constraint simulation
  submitReport(
    reporterId: string,
    targetType: "project" | "snippet",
    targetId: string,
    reason: "spam" | "harassment" | "plagiarism" | "inappropriate" | "other",
    details: string | null = null
  ): { status: number; report?: SimulatedReport; error?: string } {
    // Check reporter existence
    if (!this.users.has(reporterId)) {
      return { status: 401, error: "You must be logged in to submit a report." };
    }

    // Rate Limit Check (max 5 reports per hour per user)
    const now = Date.now();
    const oneHourAgo = now - 3600 * 1000;
    const userReportCount = Array.from(this.reports.values()).filter(
      (r) => r.reporter_id === reporterId && new Date(r.created_at).getTime() >= oneHourAgo
    ).length;

    if (userReportCount >= 5) {
      return { status: 429, error: "Rate limit exceeded. Maximum 5 reports per hour." };
    }

    // Unique constraint check: (reporter_id, target_type, target_id)
    const dedupKey = `${reporterId}_${targetType}_${targetId}`;
    if (this.reportUniqueIndex.has(dedupKey)) {
      return { status: 409, error: "You have already reported this item." };
    }

    const reportId = `report-${this.reports.size + 1}`;
    const report: SimulatedReport = {
      id: reportId,
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    this.reports.set(reportId, report);
    this.reportUniqueIndex.add(dedupKey);

    return { status: 201, report };
  }

  // Admin access guard simulation
  getAdminReportsQueue(adminUserId: string): { status: number; reports?: SimulatedReport[]; error?: string } {
    const user = this.users.get(adminUserId);
    if (!user || !user.is_admin) {
      return { status: 403, error: "Forbidden: Admin privileges required." };
    }

    return { status: 200, reports: Array.from(this.reports.values()) };
  }

  // Admin review action simulation
  takeAdminAction(
    adminUserId: string,
    reportId: string,
    action: "action" | "dismiss"
  ): { status: number; report?: SimulatedReport; error?: string } {
    const admin = this.users.get(adminUserId);
    if (!admin || !admin.is_admin) {
      return { status: 403, error: "Forbidden: Admin privileges required." };
    }

    const report = this.reports.get(reportId);
    if (!report) {
      return { status: 404, error: "Report not found." };
    }

    report.status = action === "action" ? "actioned" : "dismissed";
    report.reviewed_at = new Date().toISOString();
    report.reviewed_by = adminUserId;

    if (action === "action") {
      if (report.target_type === "project") {
        const proj = this.projects.get(report.target_id);
        if (proj) proj.is_hidden = true;
      } else if (report.target_type === "snippet") {
        const snip = this.snippets.get(report.target_id);
        if (snip) snip.is_hidden = true;
      }
    }

    return { status: 200, report };
  }

  // Public Query Simulation (filters is_hidden = true)
  getPublicProjects(): SimulatedProject[] {
    return Array.from(this.projects.values()).filter((p) => !p.is_hidden);
  }

  getPublicSnippets(): SimulatedSnippet[] {
    return Array.from(this.snippets.values()).filter((s) => !s.is_hidden);
  }
}

export function runModerationTests() {
  console.log("==================================================");
  console.log("STARTING CONTENT MODERATION SYSTEM TESTS");
  console.log("==================================================");

  const db = new ModerationSystemSimulator();

  // Create Users
  const userA = db.createUser("user-uuid-1", "alice_dev", false);
  const userB = db.createUser("user-uuid-2", "bob_coder", false);
  const admin = db.createUser("admin-uuid-9", "super_admin", true);

  // Create Sample Project & Snippet
  const proj1 = db.createProject("proj-uuid-101", userB.id, "Malicious Spam App");
  const snip1 = db.createSnippet("snip-uuid-201", proj1.id, userB.id, "Bad Snippet");

  // --------------------------------------------------------------------------
  // TEST 1: User can report target once but NOT twice
  // --------------------------------------------------------------------------
  console.log("\n[Test 1] Testing single vs duplicate report submission...");

  const res1 = db.submitReport(userA.id, "project", proj1.id, "spam", "Contains spam links");
  assert(res1.status === 201, `First report from User A should return 201, got ${res1.status}`);
  assert(res1.report !== undefined, "First report object must be created");
  console.log("  PASS: First report successfully created.");

  const res2 = db.submitReport(userA.id, "project", proj1.id, "spam", "Duplicate attempt");
  assert(res2.status === 409, `Second report from User A on same target should return 409 Conflict, got ${res2.status}`);
  assert(res2.error === "You have already reported this item.", `Expected duplicate error msg, got '${res2.error}'`);
  console.log("  PASS: Duplicate report correctly blocked with 409 Conflict.");

  const res3 = db.submitReport(userB.id, "project", proj1.id, "harassment", "Distinct user report");
  assert(res3.status === 201, `Report from distinct User B should succeed with 201, got ${res3.status}`);
  console.log("  PASS: Distinct user can report the same target.");

  // --------------------------------------------------------------------------
  // TEST 2: Non-admins get 403 Forbidden on /admin/reports
  // --------------------------------------------------------------------------
  console.log("\n[Test 2] Testing admin queue access control (403 guard)...");

  const nonAdminAccess = db.getAdminReportsQueue(userA.id);
  assert(nonAdminAccess.status === 403, `Non-admin user A should get 403 Forbidden, got ${nonAdminAccess.status}`);
  assert(nonAdminAccess.error === "Forbidden: Admin privileges required.", "Must return admin required error");
  console.log("  PASS: Non-admin user access correctly denied with 403.");

  const adminAccess = db.getAdminReportsQueue(admin.id);
  assert(adminAccess.status === 200, `Admin user should get 200 OK, got ${adminAccess.status}`);
  assert(adminAccess.reports?.length === 2, `Admin queue should contain 2 pending reports, got ${adminAccess.reports?.length}`);
  console.log("  PASS: Admin user successfully retrieves moderation queue.");

  // --------------------------------------------------------------------------
  // TEST 3: Actioning a report sets is_hidden = true & excludes from public query
  // --------------------------------------------------------------------------
  console.log("\n[Test 3] Testing actioning a report & public query exclusion...");

  // Verify project is visible publicly before moderation action
  const publicProjectsBefore = db.getPublicProjects();
  assert(
    publicProjectsBefore.some((p) => p.id === proj1.id),
    "Project proj1 must be visible in public listing before action"
  );

  // Admin takes action on report 1
  const report1Id = res1.report!.id;
  const actionRes = db.takeAdminAction(admin.id, report1Id, "action");

  assert(actionRes.status === 200, `Admin action should return 200 OK, got ${actionRes.status}`);
  assert(actionRes.report?.status === "actioned", `Report status must be updated to 'actioned', got '${actionRes.report?.status}'`);
  assert(actionRes.report?.reviewed_by === admin.id, `Report reviewed_by must equal admin ID ${admin.id}`);
  assert(actionRes.report?.reviewed_at !== undefined, "Report reviewed_at must be timestamped");

  // Verify target project is now hidden
  const updatedProj = db.projects.get(proj1.id);
  assert(updatedProj?.is_hidden === true, "Target project is_hidden must be set to true");
  console.log("  PASS: Report marked as 'actioned', reviewed_by timestamped, target project is_hidden set to true.");

  // Verify target project is excluded from public queries
  const publicProjectsAfter = db.getPublicProjects();
  assert(
    !publicProjectsAfter.some((p) => p.id === proj1.id),
    "Actioned project proj1 must be EXCLUDED from public listing queries"
  );
  console.log("  PASS: Hidden project is excluded from public listing query results.");

  // --------------------------------------------------------------------------
  // TEST 4: Rate limit test (5 reports per hour max)
  // --------------------------------------------------------------------------
  console.log("\n[Test 4] Testing report rate limiting (max 5/hour)...");

  const rateLimitUser = db.createUser("user-uuid-3", "spammer_test", false);
  const dummyTarget = db.createProject("proj-dummy", userB.id, "Dummy");

  for (let i = 1; i <= 5; i++) {
    const targetId = `proj-test-${i}`;
    db.createProject(targetId, userB.id, `Test Project ${i}`);
    const r = db.submitReport(rateLimitUser.id, "project", targetId, "spam");
    assert(r.status === 201, `Report ${i} should succeed under rate limit`);
  }

  // 6th report within 1 hour should return 429
  const overflowTarget = db.createProject("proj-test-6", userB.id, "Test Project 6");
  const overflowRes = db.submitReport(rateLimitUser.id, "project", overflowTarget.id, "spam");
  assert(overflowRes.status === 429, `6th report within 1 hour should return 429 Rate Limit, got ${overflowRes.status}`);
  console.log("  PASS: 6th report within 1 hour correctly rate-limited with 429 status.");

  console.log("\n==================================================");
  console.log("ALL CONTENT MODERATION SYSTEM TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runModerationTests();
}
