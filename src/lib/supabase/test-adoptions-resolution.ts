/**
 * ADOPTION DISPUTE HANDLING & MULTI-ADOPTER RESOLUTION TEST SUITE
 * 
 * Verifies:
 * 1. Three adopters request the same project -> all start as 'pending'.
 * 2. Owner accepts Adopter A -> Adopter A becomes 'accepted' with responded_by_deadline set.
 * 3. Adopters B & C automatically transition to 'superseded' with notifications fired.
 * 4. Accepted adopter misses deadline / marked 'abandoned_by_adopter' -> project reopens (is_adoptable = true).
 * 5. Previously superseded adopters B & C are notified that project is open again.
 * 6. Superseded adopter B successfully re-requests adoption.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export type TestUser = {
  id: string;
  username: string;
};

export type TestProject = {
  id: string;
  user_id: string;
  title: string;
  is_adoptable: boolean;
};

export type TestAdoptionStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "abandoned"
  | "completed"
  | "abandoned_by_adopter"
  | "superseded";

export type TestAdoption = {
  id: string;
  project_id: string;
  adopter_id: string;
  message: string;
  status: TestAdoptionStatus;
  responded_by_deadline?: string | null;
  created_at: string;
};

export type TestNotification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  related_project_id: string;
  related_adoption_id?: string;
};

export class AdoptionResolutionSimulator {
  users: Map<string, TestUser> = new Map();
  projects: Map<string, TestProject> = new Map();
  adoptions: Map<string, TestAdoption> = new Map();
  notifications: TestNotification[] = [];

  createUser(id: string, username: string): TestUser {
    const u = { id, username };
    this.users.set(id, u);
    return u;
  }

  createProject(id: string, userId: string, title: string): TestProject {
    const p = { id, user_id: userId, title, is_adoptable: true };
    this.projects.set(id, p);
    return p;
  }

  // 1. Submit adoption request
  submitAdoption(projectId: string, adopterId: string, message: string): TestAdoption {
    const p = this.projects.get(projectId);
    if (!p || !p.is_adoptable) {
      throw new Error("Project is not open for adoption");
    }

    const id = `adopt-${this.adoptions.size + 1}`;
    const adoption: TestAdoption = {
      id,
      project_id: projectId,
      adopter_id: adopterId,
      message,
      status: "pending",
      created_at: new Date().toISOString(),
    };
    this.adoptions.set(id, adoption);

    // Notify owner
    this.notifications.push({
      id: `notif-${this.notifications.length + 1}`,
      user_id: p.user_id,
      type: "adoption_request",
      title: "New Adoption Request",
      body: `A developer requested to adopt "${p.title}".`,
      related_project_id: projectId,
      related_adoption_id: id,
    });

    return adoption;
  }

  // 2. Resolve adoption (accept, reject, complete, abandon_by_adopter, re_request)
  resolveAdoption(
    action: "accept" | "reject" | "complete" | "abandon_by_adopter" | "re_request",
    adoptionId?: string,
    projectId?: string,
    requesterUserId?: string
  ) {
    if (action === "re_request") {
      if (!projectId || !requesterUserId) throw new Error("Missing parameters for re_request");
      const p = this.projects.get(projectId);
      if (!p || !p.is_adoptable) throw new Error("Project not open for adoption");

      // Find existing adoption
      let existing = Array.from(this.adoptions.values()).find(
        (a) => a.project_id === projectId && a.adopter_id === requesterUserId
      );

      if (existing) {
        existing.status = "pending";
      } else {
        existing = this.submitAdoption(projectId, requesterUserId, "Re-requested adoption");
      }

      this.notifications.push({
        id: `notif-${this.notifications.length + 1}`,
        user_id: p.user_id,
        type: "adoption_request",
        title: "New Adoption Re-application",
        body: `A developer re-requested to adopt "${p.title}".`,
        related_project_id: projectId,
        related_adoption_id: existing.id,
      });

      return { status: 200, adoption: existing };
    }

    const targetAdoption = this.adoptions.get(adoptionId!);
    if (!targetAdoption) throw new Error("Adoption not found");
    const proj = this.projects.get(targetAdoption.project_id);
    if (!proj) throw new Error("Project not found");

    const now = Date.now();

    if (action === "accept") {
      const deadline = new Date(now + 14 * 86400 * 1000).toISOString();
      targetAdoption.status = "accepted";
      targetAdoption.responded_by_deadline = deadline;

      // Automatically transition all other pending requests for this project to 'superseded'
      for (const a of this.adoptions.values()) {
        if (a.project_id === proj.id && a.id !== targetAdoption.id && a.status === "pending") {
          a.status = "superseded";

          // Notify superseded adopter
          this.notifications.push({
            id: `notif-${this.notifications.length + 1}`,
            user_id: a.adopter_id,
            type: "adoption_superseded",
            title: "Adoption Request Superseded",
            body: `Another developer was selected to adopt "${proj.title}".`,
            related_project_id: proj.id,
            related_adoption_id: a.id,
          });
        }
      }

      // Notify accepted adopter
      this.notifications.push({
        id: `notif-${this.notifications.length + 1}`,
        user_id: targetAdoption.adopter_id,
        type: "adoption_status",
        title: "Adoption Request Accepted!",
        body: `Your request to adopt "${proj.title}" was accepted.`,
        related_project_id: proj.id,
        related_adoption_id: targetAdoption.id,
      });
    } else if (action === "complete") {
      targetAdoption.status = "completed";
      proj.is_adoptable = false;
    } else if (action === "abandon_by_adopter") {
      targetAdoption.status = "abandoned_by_adopter";
      proj.is_adoptable = true; // Reopen project

      // Notify all previously superseded adopters that project is open again
      for (const a of this.adoptions.values()) {
        if (a.project_id === proj.id && a.status === "superseded") {
          this.notifications.push({
            id: `notif-${this.notifications.length + 1}`,
            user_id: a.adopter_id,
            type: "adoption_reopened",
            title: "Project Open Again for Adoption",
            body: `"${proj.title}" is open for adoption again.`,
            related_project_id: proj.id,
            related_adoption_id: a.id,
          });
        }
      }
    }

    return { status: 200, adoption: targetAdoption };
  }
}

export function runAdoptionResolutionTests() {
  console.log("==================================================");
  console.log("STARTING ADOPTION RESOLUTION & DISPUTE TESTS");
  console.log("==================================================");

  const db = new AdoptionResolutionSimulator();

  // Create Users & Project
  const owner = db.createUser("user-owner", "project_owner");
  const adopterA = db.createUser("user-a", "alice_adopter");
  const adopterB = db.createUser("user-b", "bob_adopter");
  const adopterC = db.createUser("user-c", "charlie_adopter");

  const project = db.createProject("proj-100", owner.id, "Abandoned OS Framework");

  // --------------------------------------------------------------------------
  // STEP 1: Three adopters apply for the same project
  // --------------------------------------------------------------------------
  console.log("\n[Step 1] 3 adopters submit requests for the project...");

  const reqA = db.submitAdoption(project.id, adopterA.id, "I want to maintain this!");
  const reqB = db.submitAdoption(project.id, adopterB.id, "I have experience with this tech stack.");
  const reqC = db.submitAdoption(project.id, adopterC.id, "Will add full documentation!");

  assert(reqA.status === "pending", "Adoption A should start as pending");
  assert(reqB.status === "pending", "Adoption B should start as pending");
  assert(reqC.status === "pending", "Adoption C should start as pending");
  console.log("  PASS: All 3 initial requests are 'pending'.");

  // --------------------------------------------------------------------------
  // STEP 2: Owner accepts Adopter A -> B & C become 'superseded' with notifications
  // --------------------------------------------------------------------------
  console.log("\n[Step 2] Owner accepts Adopter A...");

  db.resolveAdoption("accept", reqA.id);

  assert(reqA.status === "accepted", "Adopter A status must be 'accepted'");
  assert(reqA.responded_by_deadline !== null, "Adopter A must have responded_by_deadline set");
  console.log(`  PASS: Adopter A accepted with deadline: ${reqA.responded_by_deadline}`);

  assert(reqB.status === "superseded", "Adopter B status must automatically become 'superseded'");
  assert(reqC.status === "superseded", "Adopter C status must automatically become 'superseded'");
  console.log("  PASS: Adopters B & C automatically transitioned to 'superseded'.");

  // Verify notifications for B and C
  const bNotif = db.notifications.find((n) => n.user_id === adopterB.id && n.type === "adoption_superseded");
  const cNotif = db.notifications.find((n) => n.user_id === adopterC.id && n.type === "adoption_superseded");

  assert(bNotif !== undefined, "Adopter B must receive an adoption_superseded notification");
  assert(cNotif !== undefined, "Adopter C must receive an adoption_superseded notification");
  console.log("  PASS: 'adoption_superseded' notifications delivered to Adopters B & C.");

  // --------------------------------------------------------------------------
  // STEP 3: Adopter A misses deadline / owner marks 'abandoned_by_adopter'
  // --------------------------------------------------------------------------
  console.log("\n[Step 3] Handoff times out -> Owner marks 'abandoned_by_adopter'...");

  db.resolveAdoption("abandon_by_adopter", reqA.id);

  assert(reqA.status === "abandoned_by_adopter", "Adopter A status must be 'abandoned_by_adopter'");
  assert(project.is_adoptable === true, "Project must be reopened for adoption (is_adoptable = true)");
  console.log("  PASS: Adoption status set to 'abandoned_by_adopter' and project reopened.");

  // Verify re-open notifications sent to B & C
  const bReopenNotif = db.notifications.find((n) => n.user_id === adopterB.id && n.type === "adoption_reopened");
  const cReopenNotif = db.notifications.find((n) => n.user_id === adopterC.id && n.type === "adoption_reopened");

  assert(bReopenNotif !== undefined, "Adopter B must receive an adoption_reopened notification");
  assert(cReopenNotif !== undefined, "Adopter C must receive an adoption_reopened notification");
  console.log("  PASS: Previously superseded Adopters B & C notified that project is open again.");

  // --------------------------------------------------------------------------
  // STEP 4: Previously superseded Adopter B re-requests adoption
  // --------------------------------------------------------------------------
  console.log("\n[Step 4] Superseded Adopter B re-requests adoption...");

  const reReqResult = db.resolveAdoption("re_request", undefined, project.id, adopterB.id);

  assert(reReqResult.status === 200, "Re-request should succeed with 200");
  assert(reqB.status === "pending", "Adopter B status should transition back to 'pending'");

  const ownerNotif = db.notifications.find((n) => n.user_id === owner.id && n.title.includes("Re-application"));
  assert(ownerNotif !== undefined, "Project owner must receive notification about re-application");
  console.log("  PASS: Adopter B successfully re-requested adoption and owner was notified.");

  console.log("\n==================================================");
  console.log("ALL ADOPTION RESOLUTION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runAdoptionResolutionTests();
}
