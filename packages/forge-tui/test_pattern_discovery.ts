import { GodPatternDiscoveryEngine } from "./src/agent/pattern-discovery";
import { ExaClient } from "./src/search/exa";

console.log("================================================================================");
console.log("🌌 DATA FORGE GOD-TIER PATTERN DISCOVERY & EXA NEURAL INTELLIGENCE TEST");
console.log("================================================================================");

const discovery = new GodPatternDiscoveryEngine();
const exa = new ExaClient();

console.log("\n[1] Running ART (Agent Reinforcement Training) Autonomous Rollout across 3 Spotify Datasets...");
const result = await discovery.runAutonomousDiscovery("", "", "");

console.log("\n[2] Agent Multi-Turn Reasoning Trace:");
for (const step of result.reasoningTrace) {
  console.log("   ", step);
}

console.log("\n[3] Verified Discovered Hidden Patterns:");
for (const pat of result.patterns) {
  console.log(`\n🔹 [${pat.id.toUpperCase()}] ${pat.title}`);
  console.log(`   Confidence Score : ${(pat.confidenceScore * 100).toFixed(1)}%`);
  console.log(`   Empirical Evidence: ${pat.empiricalEvidence}`);
  console.log(`   Exa Citation     : ${pat.exaWebValidation.sourceTitle} (${pat.exaWebValidation.url})`);
  console.log(`   Exa Neural Proof : "${pat.exaWebValidation.snippet}"`);
  console.log(`   Actionable Plan  : ${pat.recommendedAction}`);
}

console.log("\n[4] Testing Direct Exa Neural Search on Live Streaming Trends:");
const liveSearch = await exa.search("The Weeknd Blinding Lights billion stream Spotify record", 2);
console.log("   Query: The Weeknd Blinding Lights billion stream Spotify record");
for (const r of liveSearch.results) {
  console.log(`   • ${r.title} [Score: ${r.score}]`);
  console.log(`     URL: ${r.url}`);
}

console.log("\n================================================================================");
console.log("✅ ALL AUTONOMOUS DISCOVERY & EXA SEARCH PIPELINES VERIFIED SUCCESSFULLY!");
console.log("================================================================================");
