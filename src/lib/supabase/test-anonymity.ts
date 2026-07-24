/**
 * REGRESSION TEST SUITE FOR ANONYMOUS BURIAL PRIVACY & BIDIRECTIONAL ADOPTION FLOW
 * 
 * Verifies that:
 * 1. Projects with `is_anonymous = true` have all owner-identifying fields (user_id, user, users)
 *    completely scrubbed when viewed by an ADOPTER or PUBLIC caller.
 * 2. An ADOPTER fetching an adoption request for an anonymous project receives ZERO owner details.
 * 3. An OWNER fetching an incoming adoption request receives FULL applicant contact info.
 */

import { sanitizeProject, sanitizeProjects } from "../utils";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export function runAnonymityTests() {
  console.log("==================================================");
  console.log("STARTING ANONYMOUS BURIAL PRIVACY REGRESSION TESTS");
  console.log("==================================================");

  const ownerId = "owner-uuid-999";
  const ownerUsername = "secret_author_dev";
  const adopterId = "adopter-uuid-555";
  const adopterUsername = "eager_applicant_dev";

  const anonymousProjectInput = {
    id: "anon-proj-123",
    title: "Anonymous Secret Project",
    tagline: "Shh...",
    is_anonymous: true,
    user_id: ownerId,
    user: {
      id: ownerId,
      username: ownerUsername,
      full_name: "Secret Author",
      avatar_url: "https://example.com/avatar.png",
      github_username: ownerUsername,
    },
    users: {
      id: ownerId,
      username: ownerUsername,
      full_name: "Secret Author",
      avatar_url: "https://example.com/avatar.png",
    },
  };

  // --------------------------------------------------------------------------
  // TEST 1: sanitizeProject nulls user_id and user on anonymous project (default/adopter)
  // --------------------------------------------------------------------------
  const sanitizedAnon = sanitizeProject(anonymousProjectInput, { viewerRole: "adopter" });

  assert(sanitizedAnon.user_id === null, "Anonymous project user_id must be null for adopter");
  assert(sanitizedAnon.user === null, "Anonymous project user must be null for adopter");
  assert(sanitizedAnon.users === null, "Anonymous project users must be null for adopter");
  assert(JSON.stringify(sanitizedAnon).indexOf(ownerUsername) === -1, "Response payload must not contain owner username");
  assert(JSON.stringify(sanitizedAnon).indexOf(ownerId) === -1, "Response payload must not contain owner user_id");

  console.log("PASS [Test 1]: sanitizeProject cleanly scrubs owner_id and user object for adopters.");

  // --------------------------------------------------------------------------
  // TEST 2: sanitizeProject preserves public attribution for non-anonymous project
  // --------------------------------------------------------------------------
  const publicProjectInput = {
    id: "public-proj-456",
    title: "Public Open Project",
    tagline: "Public",
    is_anonymous: false,
    user_id: "public-user-uuid-111",
    user: {
      id: "public-user-uuid-111",
      username: "public_author",
      full_name: "Public Author",
    },
  };

  const sanitizedPublic = sanitizeProject(publicProjectInput, { viewerRole: "adopter" });

  assert(sanitizedPublic.user_id === "public-user-uuid-111", "Public project user_id must be preserved");
  assert(sanitizedPublic.user?.username === "public_author", "Public project user object must be preserved");

  console.log("PASS [Test 2]: sanitizeProject preserves owner attribution for non-anonymous projects.");

  // --------------------------------------------------------------------------
  // TEST 3: Role-aware sanitizeProject retains metadata for OWNER
  // --------------------------------------------------------------------------
  const sanitizedForOwner = sanitizeProject(anonymousProjectInput, { viewerRole: "owner" });

  assert(sanitizedForOwner.user_id === ownerId, "Owner viewing their own project must retain user_id");
  assert(sanitizedForOwner.user?.username === ownerUsername, "Owner viewing their own project must retain user metadata");

  console.log("PASS [Test 3]: Role-aware sanitizeProject preserves metadata when viewerRole is 'owner'.");

  // --------------------------------------------------------------------------
  // TEST 4: sanitizeProjects handles mixed lists correctly for public/adopter
  // --------------------------------------------------------------------------
  const mixedProjects = [anonymousProjectInput, publicProjectInput];
  const sanitizedList = sanitizeProjects(mixedProjects, { viewerRole: "adopter" });

  assert(sanitizedList[0].user === null, "First item (anonymous) must have null user");
  assert(sanitizedList[1].user !== null, "Second item (public) must retain user");

  console.log("PASS [Test 4]: sanitizeProjects correctly processes lists of mixed projects for adopters.");

  // --------------------------------------------------------------------------
  // TEST 5: ADOPTER impersonation fetching adoption request -> 0 owner fields
  // --------------------------------------------------------------------------
  const rawAdoptionRow = {
    id: "adopt-777",
    project_id: "anon-proj-123",
    adopter_id: adopterId,
    message: "I would love to build on this!",
    status: "pending",
    created_at: "2026-07-25T00:00:00Z",
    project: anonymousProjectInput,
    adopter: {
      id: adopterId,
      username: adopterUsername,
      avatar_url: "https://example.com/adopter.png",
      full_name: "Eager Applicant",
    },
  };

  // Simulate GET /api/adoptions logic for ADOPTER
  const adopterResponse = {
    ...rawAdoptionRow,
    project: sanitizeProject(
      {
        ...rawAdoptionRow.project,
        user: rawAdoptionRow.project.users ?? null,
      },
      { viewerRole: "adopter" }
    ),
  };

  assert(adopterResponse.project.user_id === null, "Adopter response project user_id must be null");
  assert(adopterResponse.project.user === null, "Adopter response project user must be null");
  assert(JSON.stringify(adopterResponse).indexOf(ownerId) === -1, "Adopter payload must contain ZERO owner IDs");
  assert(JSON.stringify(adopterResponse).indexOf(ownerUsername) === -1, "Adopter payload must contain ZERO owner usernames");
  assert(adopterResponse.adopter.username === adopterUsername, "Adopter payload retains adopter's own info");

  console.log("PASS [Test 5]: ADOPTER fetching adoption request receives ZERO owner-identifying fields.");

  // --------------------------------------------------------------------------
  // TEST 6: OWNER impersonation fetching adoption request -> FULL applicant details
  // --------------------------------------------------------------------------
  // Simulate GET /api/adoptions logic for OWNER
  const ownerResponse = {
    ...rawAdoptionRow,
    project: sanitizeProject(
      {
        ...rawAdoptionRow.project,
        user: rawAdoptionRow.project.users ?? null,
      },
      { viewerRole: "owner" }
    ),
  };

  assert(ownerResponse.adopter.username === adopterUsername, "Owner receives applicant's username");
  assert(ownerResponse.adopter.avatar_url === "https://example.com/adopter.png", "Owner receives applicant's avatar");
  assert(ownerResponse.message === "I would love to build on this!", "Owner receives applicant's message");
  assert(ownerResponse.project.user_id === ownerId, "Owner retains project ownership reference in dashboard");

  console.log("PASS [Test 6]: OWNER fetching incoming request receives FULL applicant contact info.");

  console.log("==================================================");
  console.log("ALL BIDIRECTIONAL ANONYMITY TESTS PASSED!");
  console.log("==================================================");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runAnonymityTests();
}
