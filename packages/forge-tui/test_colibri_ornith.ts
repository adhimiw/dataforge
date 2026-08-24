import { ColibriEngine, COLIBRI_REGISTRY } from "./src/llm/colibri";
import { CSVProfiler } from "./src/data/csv";
import fs from "fs";

console.log("================================================================================");
console.log("🦅 COLIBRI INFERENCE ENGINE & ORNITH-1.5:9B MULTI-DATASET TEST");
console.log("================================================================================");

console.log("\n[1] Active Colibri & Local Model Registry:");
for (const m of COLIBRI_REGISTRY) {
  console.log(`   • ${m.name.padEnd(28)} | ${m.parameterSize.padEnd(10)} | ${m.ramRequirement.padEnd(30)} | ${m.tier}`);
}

const engine = new ColibriEngine("ornith-1.5:9b", "http://127.0.0.1:11434");
const activeProfile = engine.getActiveModelProfile();
console.log(`\n[2] Selected Active Engine Profile: ${activeProfile?.name}`);
console.log(`    Context Window: ${activeProfile?.contextWindow.toLocaleString()} tokens`);
console.log(`    Quantization  : ${activeProfile?.quantization}`);
console.log(`    Family        : ${activeProfile?.family}`);

// Load Spotify Tracks profile
const spotifyPath = fs.existsSync("/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify/spotify_tracks.csv")
  ? "/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify/spotify_tracks.csv"
  : "C:\\Users\\Admin\\dataforge\\.dataforge\\datasets\\spotify\\spotify_tracks.csv";

const profile = CSVProfiler.profile(spotifyPath, 2000);
const datasetContext = `
Dataset: Spotify Tracks Dataset (1,200 sampled records, 20 audio features)
Columns: ${profile.columns.map((c) => c.name).join(", ")}
Top Artists by Track Count: The Weeknd, Taylor Swift, Bad Bunny, Drake, Ed Sheeran, Billie Eilish
Key Audio Features: danceability (0.35-0.95), energy (0.30-0.98), valence (0.15-0.92), loudness (-14dB to -3dB)
`;

console.log("\n[3] Streaming Live Autonomous Analysis from Ornith-1.5:9B on Spotify Tracks...");
console.log("--------------------------------------------------------------------------------");

await engine.streamAnalysis(
  datasetContext,
  "Identify the top 2 hidden mathematical relationships between danceability, energy, and popularity in this Spotify dataset.",
  {
    onThinking: (thought) => {
      process.stdout.write(`\x1b[33m${thought}\x1b[0m`);
    },
    onToken: (token) => {
      process.stdout.write(`\x1b[36m${token}\x1b[0m`);
    },
    onError: (err) => {
      console.error("\n❌ Streaming Error:", err);
    },
    onComplete: () => {
      console.log("\n--------------------------------------------------------------------------------");
      console.log("✅ ORNITH-1.5:9B COLIBRI INFERENCE TEST COMPLETE!");
    },
  }
);
