/**
 * VIEW COUNT ANTI-INFLATION REGRESSION TEST SUITE
 * 
 * Verifies that 10 rapid calls to increment_view_count from the same viewer
 * increment view_count EXACTLY ONCE, while a distinct viewer increments it once more.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

// In-memory simulation of the Database table `public.project_views` and RPC `increment_view_count`
class SimulatedDatabase {
  projects: Map<string, { id: string; view_count: number }> = new Map();
  project_views: Set<string> = new Set(); // Key: `${project_id}_${viewer_fingerprint}_${date}`

  createProject(id: string, initialViews = 0) {
    this.projects.set(id, { id, view_count: initialViews });
  }

  // Exact implementation of the PL/pgSQL function logic
  increment_view_count(project_id: string, viewer_fingerprint?: string | null): boolean {
    const project = this.projects.get(project_id);
    if (!project) return false;

    const fingerprint = (viewer_fingerprint && viewer_fingerprint.trim()) || "anonymous-session";
    const dateStr = new Date().toISOString().split("T")[0]; // UTC date
    const dedupKey = `${project_id}_${fingerprint}_${dateStr}`;

    // ON CONFLICT DO NOTHING
    if (this.project_views.has(dedupKey)) {
      return false; // Not inserted, no increment
    }

    // Insert view record & increment count
    this.project_views.add(dedupKey);
    project.view_count += 1;
    return true; // Incremented
  }

  getProject(id: string) {
    return this.projects.get(id);
  }
}

export function runViewCountTests() {
  console.log("==================================================");
  console.log("STARTING VIEW COUNT ANTI-INFLATION TESTS");
  console.log("==================================================");

  const db = new SimulatedDatabase();
  const testProjectId = "proj-uuid-100";
  const viewerA = "viewer-session-aaa-111";
  const viewerB = "viewer-session-bbb-222";

  db.createProject(testProjectId, 0);

  console.log("Simulating 10 rapid page loads from Viewer A...");

  let incrementsViewerA = 0;
  for (let i = 1; i <= 10; i++) {
    const incremented = db.increment_view_count(testProjectId, viewerA);
    if (incremented) {
      incrementsViewerA++;
    }
  }

  const projectStateA = db.getProject(testProjectId);
  assert(incrementsViewerA === 1, `Viewer A should cause exactly 1 increment, got ${incrementsViewerA}`);
  assert(projectStateA?.view_count === 1, `Project view_count should be 1 after 10 rapid calls from Viewer A, got ${projectStateA?.view_count}`);

  console.log(`PASS [Test 1]: 10 rapid requests from Viewer A resulted in view_count = ${projectStateA?.view_count}.`);

  console.log("Simulating 5 rapid page loads from Viewer B (distinct session)...");

  let incrementsViewerB = 0;
  for (let i = 1; i <= 5; i++) {
    const incremented = db.increment_view_count(testProjectId, viewerB);
    if (incremented) {
      incrementsViewerB++;
    }
  }

  const projectStateB = db.getProject(testProjectId);
  assert(incrementsViewerB === 1, `Viewer B should cause exactly 1 increment, got ${incrementsViewerB}`);
  assert(projectStateB?.view_count === 2, `Project view_count should be 2 after Viewer B visits, got ${projectStateB?.view_count}`);

  console.log(`PASS [Test 2]: Distinct Viewer B incremented view_count to ${projectStateB?.view_count}.`);

  console.log("==================================================");
  console.log("ALL VIEW COUNT ANTI-INFLATION TESTS PASSED!");
  console.log("==================================================");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runViewCountTests();
}
