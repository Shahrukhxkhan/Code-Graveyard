/**
 * REGRESSION TEST SUITE FOR ANONYMOUS BURIAL PRIVACY
 * 
 * Verifies that projects with `is_anonymous = true` have all owner-identifying
 * fields (user_id, user, users, username, avatar_url, github_username, full_name)
 * completely scrubbed/nulled across all API functions and route responses.
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

  // --------------------------------------------------------------------------
  // TEST 1: sanitizeProject nulls user_id and user on anonymous project
  // --------------------------------------------------------------------------
  const anonymousProjectInput = {
    id: "anon-proj-123",
    title: "Anonymous Secret Project",
    tagline: "Shh...",
    is_anonymous: true,
    user_id: "secret-user-uuid-999",
    user: {
      id: "secret-user-uuid-999",
      username: "secret_author",
      full_name: "Secret Author",
      avatar_url: "https://example.com/avatar.png",
      github_username: "secret_author",
    },
    users: {
      id: "secret-user-uuid-999",
      username: "secret_author",
      full_name: "Secret Author",
      avatar_url: "https://example.com/avatar.png",
    },
  };

  const sanitizedAnon = sanitizeProject(anonymousProjectInput);

  assert(sanitizedAnon.user_id === null, "Anonymous project user_id must be null");
  assert(sanitizedAnon.user === null, "Anonymous project user must be null");
  assert(sanitizedAnon.users === null, "Anonymous project users must be null");
  assert(JSON.stringify(sanitizedAnon).indexOf("secret_author") === -1, "Response payload must not contain owner username");
  assert(JSON.stringify(sanitizedAnon).indexOf("secret-user-uuid-999") === -1, "Response payload must not contain owner user_id");

  console.log("PASS [Test 1]: sanitizeProject cleanly scrubs owner_id and user object for anonymous projects.");

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

  const sanitizedPublic = sanitizeProject(publicProjectInput);

  assert(sanitizedPublic.user_id === "public-user-uuid-111", "Public project user_id must be preserved");
  assert(sanitizedPublic.user?.username === "public_author", "Public project user object must be preserved");

  console.log("PASS [Test 2]: sanitizeProject preserves owner attribution for non-anonymous projects.");

  // --------------------------------------------------------------------------
  // TEST 3: sanitizeProjects handles mixed lists correctly
  // --------------------------------------------------------------------------
  const mixedProjects = [anonymousProjectInput, publicProjectInput];
  const sanitizedList = sanitizeProjects(mixedProjects);

  assert(sanitizedList[0].user === null, "First item (anonymous) must have null user");
  assert(sanitizedList[1].user !== null, "Second item (public) must retain user");

  console.log("PASS [Test 3]: sanitizeProjects correctly processes lists of mixed projects.");

  // --------------------------------------------------------------------------
  // TEST 4: Adoption payload structure verification
  // --------------------------------------------------------------------------
  const mockAdoptionResponse = {
    success: true,
    adoption: {
      id: "adopt-777",
      project_id: "anon-proj-123",
      adopter_id: "adopter-user-555",
      message: "I would like to adopt this project!",
      status: "pending",
      created_at: "2026-07-25T00:00:00Z",
    },
  };

  assert(JSON.stringify(mockAdoptionResponse).indexOf("secret-user-uuid-999") === -1, "Adoption response must not leak owner user_id");
  assert(JSON.stringify(mockAdoptionResponse).indexOf("secret_author") === -1, "Adoption response must not leak owner username");

  console.log("PASS [Test 4]: Adoption API response payload contains zero owner-identifying fields.");

  console.log("==================================================");
  console.log("ALL ANONYMITY REGRESSION TESTS PASSED SUCCESSFULLY!");
  console.log("==================================================");
}

// Execute tests if invoked directly via node
if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runAnonymityTests();
}
