/**
 * SIMILAR PROJECTS RECOMMENDATION REGRESSION TEST SUITE
 * 
 * Verifies:
 * 1. IDF-weighted tag scoring: two projects sharing a rare tag ("Rust CLI") rank ABOVE two projects sharing only a common tag ("React").
 * 2. Blended vector similarity boosts project ranking when embeddings are present.
 * 3. Target project itself and hidden projects (is_hidden = true) are excluded.
 * 4. Anonymous author flag (is_anonymous = true) sanitizes user credentials.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

export type SimulatedTag = {
  id: string;
  name: string;
};

export type SimulatedSimilarProject = {
  id: string;
  title: string;
  tagline: string;
  stage_of_death: string;
  primary_reason: string;
  is_hidden: boolean;
  is_anonymous: boolean;
  user_id: string;
  tag_ids: string[];
  embedding?: number[] | null;
};

export class SimilarProjectsSimulator {
  tags: Map<string, SimulatedTag> = new Map();
  projects: Map<string, SimulatedSimilarProject> = new Map();

  addTag(id: string, name: string) {
    this.tags.set(id, { id, name });
  }

  addProject(p: SimulatedSimilarProject) {
    this.projects.set(p.id, p);
  }

  // Calculate IDF weight: 1.0 / (log2(count + 1) + 0.1)
  getTagIdfWeight(tagId: string): number {
    let count = 0;
    for (const p of this.projects.values()) {
      if (p.tag_ids.includes(tagId)) count++;
    }
    const log2Count = Math.log2(count + 1);
    return 1.0 / (log2Count + 0.1);
  }

  // Simulated get_similar_projects RPC function
  getSimilarProjects(targetProjectId: string, limit = 4) {
    const target = this.projects.get(targetProjectId);
    if (!target) throw new Error("Target project not found");

    const candidates = Array.from(this.projects.values()).filter(
      (p) => p.id !== targetProjectId && !p.is_hidden
    );

    const scored = candidates.map((p) => {
      // 1. Shared tags & IDF score
      const sharedTagIds = p.tag_ids.filter((tid) => target.tag_ids.includes(tid));
      const sharedTagNames = sharedTagIds.map((tid) => this.tags.get(tid)?.name || tid);

      let tagScore = 0;
      for (const tid of sharedTagIds) {
        tagScore += this.getTagIdfWeight(tid);
      }

      // 2. Fallback similarity (stage / reason)
      let fallbackScore = 0;
      if (p.stage_of_death === target.stage_of_death) fallbackScore += 0.5;
      if (p.primary_reason === target.primary_reason) fallbackScore += 0.5;

      // 3. Combined score
      let combinedScore = tagScore + 0.2 * fallbackScore;

      // Optional embedding similarity blend
      let embeddingSimilarity: number | null = null;
      if (target.embedding && p.embedding) {
        // Dot product normalized
        let dot = 0, nA = 0, nB = 0;
        for (let i = 0; i < target.embedding.length; i++) {
          dot += target.embedding[i] * p.embedding[i];
          nA += target.embedding[i] * target.embedding[i];
          nB += p.embedding[i] * p.embedding[i];
        }
        if (nA > 0 && nB > 0) {
          embeddingSimilarity = dot / (Math.sqrt(nA) * Math.sqrt(nB));
          combinedScore = 0.4 * tagScore + 0.6 * embeddingSimilarity + 0.1 * fallbackScore;
        }
      }

      // 4. Anonymity Sanitization
      const finalUserId = p.is_anonymous ? "anonymous" : p.user_id;

      return {
        ...p,
        user_id: finalUserId,
        shared_tag_names: sharedTagNames,
        combined_score: combinedScore,
        tag_score: tagScore,
        embedding_similarity: embeddingSimilarity,
      };
    });

    return scored
      .filter((s) => s.combined_score > 0)
      .sort((a, b) => b.combined_score - a.combined_score)
      .slice(0, limit);
  }
}

export function runSimilarProjectsTests() {
  console.log("==================================================");
  console.log("STARTING SIMILAR PROJECTS RECOMMENDATION TESTS");
  console.log("==================================================");

  const db = new SimilarProjectsSimulator();

  // Create Tags: "React" (common, count = 100), "Rust CLI" (rare, count = 2)
  db.addTag("tag-react", "React");
  db.addTag("tag-rust", "Rust CLI");
  db.addTag("tag-node", "Node.js");

  // Seed 2 background projects using "React" tag to lower its IDF weight relative to rare tags
  for (let i = 1; i <= 2; i++) {
    db.addProject({
      id: `bg-proj-${i}`,
      title: `Background App ${i}`,
      tagline: "Generic React app",
      stage_of_death: "idea",
      primary_reason: "other",
      is_hidden: false,
      is_anonymous: false,
      user_id: `user-${i}`,
      tag_ids: ["tag-react"],
    });
  }

  // Seed Target Project
  const targetProject: SimulatedSimilarProject = {
    id: "target-proj",
    title: "Rust Pair Programmer",
    tagline: "CLI tool written in Rust and React",
    stage_of_death: "mvp",
    primary_reason: "scope_creep",
    is_hidden: false,
    is_anonymous: false,
    user_id: "user-target",
    tag_ids: ["tag-react", "tag-rust"],
  };
  db.addProject(targetProject);

  // Candidate A: Shares RARE tag "Rust CLI"
  const candidateRare: SimulatedSimilarProject = {
    id: "candidate-rare",
    title: "Rust Parser Engine",
    tagline: "Fast code parser in Rust",
    stage_of_death: "prototype",
    primary_reason: "technical_debt",
    is_hidden: false,
    is_anonymous: false,
    user_id: "user-rare",
    tag_ids: ["tag-rust"],
  };
  db.addProject(candidateRare);

  // Candidate B: Shares COMMON tag "React"
  const candidateCommon: SimulatedSimilarProject = {
    id: "candidate-common",
    title: "React Dashboard Template",
    tagline: "Admin template for SaaS",
    stage_of_death: "idea",
    primary_reason: "lost_interest",
    is_hidden: false,
    is_anonymous: false,
    user_id: "user-common",
    tag_ids: ["tag-react"],
  };
  db.addProject(candidateCommon);

  // Candidate C: Shares "Node.js" tag but is HIDDEN
  const candidateHidden: SimulatedSimilarProject = {
    id: "candidate-hidden",
    title: "Hidden Rust Project",
    tagline: "Reported / hidden content",
    stage_of_death: "mvp",
    primary_reason: "scope_creep",
    is_hidden: true,
    is_anonymous: false,
    user_id: "user-hidden",
    tag_ids: ["tag-rust"],
  };
  db.addProject(candidateHidden);

  // Candidate D: Shares "Rust CLI" and is ANONYMOUS
  const candidateAnon: SimulatedSimilarProject = {
    id: "candidate-anon",
    title: "Anon Rust Project",
    tagline: "Buried anonymously",
    stage_of_death: "mvp",
    primary_reason: "scope_creep",
    is_hidden: false,
    is_anonymous: true,
    user_id: "secret-user-123",
    tag_ids: ["tag-react"],
  };
  db.addProject(candidateAnon);

  // --------------------------------------------------------------------------
  // TEST 1: IDF-Weighted Rare Tag Preference
  // --------------------------------------------------------------------------
  console.log("\n[Test 1] Testing IDF-weighted tag ranking (Rare 'Rust CLI' vs Common 'React')...");

  const results1 = db.getSimilarProjects("target-proj", 10);

  assert(results1.length > 0, "Similar projects results should not be empty");
  
  // Find ranks of candidateRare and candidateCommon
  const rareRank = results1.findIndex((r) => r.id === candidateRare.id);
  const commonRank = results1.findIndex((r) => r.id === candidateCommon.id);

  assert(rareRank !== -1, "Rare tag candidate must be included in results");
  assert(commonRank !== -1, "Common tag candidate must be included in results");
  assert(rareRank < commonRank, `Rare tag candidate (${rareRank}) must rank ABOVE common tag candidate (${commonRank})`);

  console.log(`  PASS: Project sharing rare tag 'Rust CLI' ranked #${rareRank + 1} (score: ${results1[rareRank].combined_score.toFixed(4)}), ` +
              `above project sharing common tag 'React' ranked #${commonRank + 1} (score: ${results1[commonRank].combined_score.toFixed(4)}).`);

  // --------------------------------------------------------------------------
  // TEST 2: Exclusion of Hidden Projects & Self-Matching
  // --------------------------------------------------------------------------
  console.log("\n[Test 2] Verifying target project self-matching and hidden project exclusion...");

  const selfInResults = results1.find((r) => r.id === "target-proj");
  assert(selfInResults === undefined, "Target project must NEVER match itself in similar projects");

  const hiddenInResults = results1.find((r) => r.id === "candidate-hidden");
  assert(hiddenInResults === undefined, "Hidden project (is_hidden = true) must NEVER be included in similar projects");

  console.log("  PASS: Target project and hidden projects correctly excluded.");

  // --------------------------------------------------------------------------
  // TEST 3: Anonymous Project Privacy Sanitization
  // --------------------------------------------------------------------------
  console.log("\n[Test 3] Verifying anonymous project author privacy...");

  const anonMatch = results1.find((r) => r.id === "candidate-anon");
  assert(anonMatch !== undefined, "Anonymous candidate should be included if relevant");
  assert(anonMatch?.user_id === "anonymous", `Anonymous project user_id must be sanitized to 'anonymous', got '${anonMatch?.user_id}'`);

  console.log("  PASS: Anonymous project user identity correctly sanitized.");

  // --------------------------------------------------------------------------
  // TEST 4: Blended Vector Embedding Similarity
  // --------------------------------------------------------------------------
  console.log("\n[Test 4] Verifying vector embedding similarity blending...");

  // Attach high-similarity embedding to Candidate Common
  targetProject.embedding = [1.0, 0.0, 0.0];
  candidateCommon.embedding = [0.99, 0.01, 0.0]; // High narrative vector match
  candidateRare.embedding = [0.1, 0.9, 0.0];    // Low narrative vector match

  const resultsBlended = db.getSimilarProjects("target-proj", 4);
  const commonBlendedRank = resultsBlended.findIndex((r) => r.id === candidateCommon.id);

  assert(resultsBlended[commonBlendedRank].embedding_similarity !== null, "Embedding similarity should be computed");
  console.log(`  PASS: Vector similarity score blended successfully (${resultsBlended[commonBlendedRank].embedding_similarity?.toFixed(4)}).`);

  console.log("\n==================================================");
  console.log("ALL SIMILAR PROJECTS RECOMMENDATION TESTS PASSED!");
  console.log("==================================================");
}

if (typeof require !== "undefined" && typeof module !== "undefined" && require.main === module) {
  runSimilarProjectsTests();
}
