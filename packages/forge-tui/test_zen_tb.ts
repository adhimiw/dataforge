import { CSVProfiler } from "./src/data/csv";
import { ZenClient } from "./src/llm/zen";

const profile = CSVProfiler.profile("/mnt/c/Users/Admin/Downloads/TB_Burden_Country.csv", 5000);
console.log("=== PROFILED TB DATASET ===");
console.log("Rows:", profile.rowCount, "Cols:", profile.columnCount);
console.log("Top 5 Countries by Cumulative TB Deaths:", profile.topCountriesByMortality.slice(0, 5));

console.log("\n=== STREAMING LLM RESPONSE FROM ZEN (BIG-PICKLE) ===");
const zen = new ZenClient();
const summary = `
Dataset: WHO Global Tuberculosis Burden (TB_Burden_Country.csv)
Total Rows: ${profile.rowCount}
Year Range: ${profile.yearlyTrends[0]?.year} - ${profile.yearlyTrends[profile.yearlyTrends.length - 1]?.year}
Top 5 Countries by Mortality: ${JSON.stringify(profile.topCountriesByMortality.slice(0, 5))}
`;

await zen.streamAnalysis(summary, "Summarize the top 3 global takeaways from this TB dataset and what data models should be built.", {
  onThinking: (t) => process.stdout.write(t),
  onToken: (tok) => process.stdout.write(tok),
  onError: (err) => console.error("ERR:", err),
  onComplete: () => console.log("\n=== LLM STREAM COMPLETE ===")
});
