import { ZenClient } from "./src/llm/zen";

const z = new ZenClient();
console.log("Streaming from ZenClient...");
await z.streamAnalysis("Spotify Dataset (1,200 tracks)", "Analyze top danceability patterns", {
  onThinking: (t) => process.stdout.write(`\x1b[33m${t}\x1b[0m`),
  onToken: (tok) => process.stdout.write(`\x1b[36m${tok}\x1b[0m`),
  onError: (e) => console.error("ERR:", e),
  onComplete: () => console.log("\n=== STREAM COMPLETED ==="),
});
