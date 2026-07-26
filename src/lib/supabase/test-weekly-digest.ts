/**
 * WEEKLY DIGEST EMAIL SYSTEM REGRESSION TEST SUITE
 * 
 * Verifies:
 * 1. Digest query correctly filters to last-7-days + is_adoptable = true + is_hidden = false + anonymous sanitization.
 * 2. "Skip if empty" logic correctly skips sending when 0 new adoptable projects exist.
 * 3. HMAC signed unsubscribe token correctly flips digest_opted_in to false without requiring user authentication.
 */

import { generateUnsubscribeToken, verifyUnsubscribeToken } from "../digest-helper";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export type DigestTestUser = {
  id: string;
  username: string;
  email_notifications_enabled: boolean;
  digest_opted_in: boolean;
};

export type DigestTestProject = {
  id: string;
  user_id: string;
  title: string;
  tagline: string;
  is_adoptable: boolean;
  is_anonymous: boolean;
  is_hidden: boolean;
  created_at: string;
};

export class WeeklyDigestSimulator {
  users: Map<string, DigestTestUser> = new Map();
  projects: Map<string, DigestTestProject> = new Map();

  addUser(u: DigestTestUser) {
    this.users.set(u.id, u);
  }

  addProject(p: DigestTestProject) {
    this.projects.set(p.id, p);
  }

  // Simulated 7-day query
  getAdoptableProjects7Days(nowMs: number): DigestTestProject[] {
    const sevenDaysAgo = nowMs - 7 * 86400 * 1000;

    return Array.from(this.projects.values())
      .filter((p) => new Date(p.created_at).getTime() >= sevenDaysAgo)
      .filter((p) => p.is_adoptable === true)
      .filter((p) => !p.is_hidden)
      .map((p) => {
        if (p.is_anonymous) {
          return { ...p, user_id: "anonymous" };
        }
        return p;
      });
  }

  // Simulated Digest Cron Job execution
  runDigestJob(nowMs: number): { status: "skipped" | "completed"; reason?: string; emails_sent?: number } {
    const adoptableProjects = this.getAdoptableProjects7Days(nowMs);

    // Rule: Skip sending if zero new adoptable projects
    if (adoptableProjects.length === 0) {
      return {
        status: "skipped",
        reason: "Zero new adoptable projects in the last 7 days",
      };
    }

    const recipientUsers = Array.from(this.users.values()).filter(
      (u) => u.digest_opted_in && u.email_notifications_enabled
    );

    if (recipientUsers.length === 0) {
      return {
        status: "skipped",
        reason: "No opted-in recipients found",
      };
    }

    return {
      status: "completed",
      emails_sent: recipientUsers.length,
    };
  }

  // Simulated Unauthenticated Unsubscribe Endpoint
  unsubscribeUser(userId: string, token: string): { success: boolean; message: string } {
    const user = this.users.get(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const isValid = verifyUnsubscribeToken(userId, token);
    if (!isValid) {
      return { success: false, message: "Invalid or tampered token" };
    }

    user.digest_opted_in = false;
    return { success: true, message: "Successfully unsubscribed" };
  }
}

export function runWeeklyDigestTests() {
  console.log("==================================================");
  console.log("STARTING WEEKLY DIGEST EMAIL SYSTEM TESTS");
  console.log("==================================================");

  const db = new WeeklyDigestSimulator();
  const nowMs = Date.now();

  const user1 = { id: "usr-1", username: "alice", email_notifications_enabled: true, digest_opted_in: true };
  const user2 = { id: "usr-2", username: "bob", email_notifications_enabled: true, digest_opted_in: false };
  db.addUser(user1);
  db.addUser(user2);

  // --------------------------------------------------------------------------
  // TEST 1: 7-Day Query Filtering & Anonymity Sanitization
  // --------------------------------------------------------------------------
  console.log("\n[Test 1] Testing 7-day query filtering and anonymous project sanitization...");

  const projRecentAdoptableAnon: DigestTestProject = {
    id: "proj-1",
    user_id: "usr-real-owner",
    title: "Anon React Native",
    tagline: "Abandoned cross-platform app",
    is_adoptable: true,
    is_anonymous: true,
    is_hidden: false,
    created_at: new Date(nowMs - 2 * 86400 * 1000).toISOString(), // 2 days ago
  };

  const projOldAdoptable: DigestTestProject = {
    id: "proj-2",
    user_id: "usr-real-owner",
    title: "Old Vue Dashboard",
    tagline: "Abandoned 10 days ago",
    is_adoptable: true,
    is_anonymous: false,
    is_hidden: false,
    created_at: new Date(nowMs - 10 * 86400 * 1000).toISOString(), // 10 days ago (older than 7 days)
  };

  const projRecentNotAdoptable: DigestTestProject = {
    id: "proj-3",
    user_id: "usr-real-owner",
    title: "Not Adoptable CLI",
    tagline: "Private project",
    is_adoptable: false,
    is_anonymous: false,
    is_hidden: false,
    created_at: new Date(nowMs - 1 * 86400 * 1000).toISOString(), // 1 day ago
  };

  const projRecentHidden: DigestTestProject = {
    id: "proj-4",
    user_id: "usr-real-owner",
    title: "Hidden Reported Project",
    tagline: "Moderated project",
    is_adoptable: true,
    is_anonymous: false,
    is_hidden: true,
    created_at: new Date(nowMs - 1 * 86400 * 1000).toISOString(), // 1 day ago
  };

  db.addProject(projRecentAdoptableAnon);
  db.addProject(projOldAdoptable);
  db.addProject(projRecentNotAdoptable);
  db.addProject(projRecentHidden);

  const digestProjects = db.getAdoptableProjects7Days(nowMs);

  assert(digestProjects.length === 1, `Expected exactly 1 adoptable project from last 7 days, got ${digestProjects.length}`);
  assert(digestProjects[0].id === projRecentAdoptableAnon.id, "Returned project must be projRecentAdoptableAnon");
  assert(digestProjects[0].user_id === "anonymous", `Anonymous project user_id must be sanitized to 'anonymous', got '${digestProjects[0].user_id}'`);

  console.log("  PASS: 7-day filtering correctly included only active adoptable projects and sanitized anonymous author info.");

  // --------------------------------------------------------------------------
  // TEST 2: "Skip Sending If Empty" Logic Verification
  // --------------------------------------------------------------------------
  console.log("\n[Test 2] Testing 'Skip sending if empty' logic...");

  // First run with 1 adoptable project -> should execute completed
  const runWithProjects = db.runDigestJob(nowMs);
  assert(runWithProjects.status === "completed", `Job should complete when adoptable projects exist, got ${runWithProjects.status}`);
  assert(runWithProjects.emails_sent === 1, `Should send to 1 opted-in user (User 1), got ${runWithProjects.emails_sent}`);
  console.log("  PASS: Digest job executed successfully when adoptable projects were present.");

  // Clear projects -> test skip execution
  db.projects.clear();
  const runEmpty = db.runDigestJob(nowMs);
  assert(runEmpty.status === "skipped", `Job should skip when 0 adoptable projects exist, got ${runEmpty.status}`);
  assert(runEmpty.reason === "Zero new adoptable projects in the last 7 days", `Expected empty reason, got '${runEmpty.reason}'`);
  console.log("  PASS: Digest job correctly skipped when 0 adoptable projects existed in the last 7 days.");

  // --------------------------------------------------------------------------
  // TEST 3: Signed Unsubscribe Token Execution (Unauthenticated)
  // --------------------------------------------------------------------------
  console.log("\n[Test 3] Testing single-click signed unsubscribe token execution...");

  assert(user1.digest_opted_in === true, "User 1 should initially be opted in");

  // Generate valid signed token
  const validToken = generateUnsubscribeToken(user1.id);
  const unsubResult = db.unsubscribeUser(user1.id, validToken);

  assert(unsubResult.success === true, "Unsubscribe call with valid token must succeed");
  assert(user1.digest_opted_in === false, "User 1 digest_opted_in must flip to false after unsubscribe");
  console.log("  PASS: Valid signed HMAC token successfully unsubscribed user without login.");

  // Test invalid token attempt
  const invalidToken = "tampered-token-1234567890abcdef";
  const invalidUnsubResult = db.unsubscribeUser(user2.id, invalidToken);

  assert(invalidUnsubResult.success === false, "Unsubscribe call with invalid token must fail");
  assert(invalidUnsubResult.message === "Invalid or tampered token", "Must report invalid token error");
  console.log("  PASS: Tampered/invalid token was correctly rejected.");

  console.log("\n==================================================");
  console.log("ALL WEEKLY DIGEST SYSTEM TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runWeeklyDigestTests();
}
