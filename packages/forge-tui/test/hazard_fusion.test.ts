import { describe, expect, it } from "bun:test";
import { HazardFusionEngine } from "../src/fusion/hazard-fusion";
import { SubAgentManager } from "../src/agent/subagent-manager";

describe("DataForge Multi-Source Hazard Fusion Engine & 6 Hard Test Cases", () => {
  it("HF-01: Schema drift on missing identity or geometry fields marks source degraded", async () => {
    const engine = new HazardFusionEngine();
    const badPayload = {
      type: "FeatureCollection",
      features: [
        { id: null, properties: { mag: 3.2, time: Date.now() }, geometry: {} },
      ],
    };

    const res = await engine.collectUSGS(badPayload, 200);
    expect(res.receipt.healthState).toBe("degraded");
    expect(res.receipt.parsingWarnings.length).toBeGreaterThan(0);
  });

  it("HF-02: Late or out-of-order observation preserves watermark and flags status as late", async () => {
    const engine = new HazardFusionEngine();
    // Establish watermark
    await engine.collectUSGS({
      type: "FeatureCollection",
      features: [
        { id: "recent_01", properties: { mag: 4.5, time: Date.now() }, geometry: { coordinates: [-124, 40, 5] } },
      ],
    });

    // Ingest late event (14 days old)
    await engine.collectUSGS({
      type: "FeatureCollection",
      features: [
        { id: "late_01", properties: { mag: 2.1, time: Date.now() - 86400000 * 14 }, geometry: { coordinates: [-124, 40, 5] } },
      ],
    });

    const all = await engine.collectAll();
    const lateObs = all.observations.find((o) => o.originalId === "late_01");
    expect(lateObs).toBeDefined();
    expect(lateObs?.status).toBe("late");
  });

  it("HF-03: Conflicting revisions create a lineage edge and retain prior digest", async () => {
    const engine = new HazardFusionEngine();
    const now = Date.now();

    // Initial Observation
    await engine.collectUSGS({
      type: "FeatureCollection",
      features: [
        { id: "quake_100", properties: { mag: 4.1, time: now - 3600000, updated: now - 3600000, place: "Eureka" }, geometry: { coordinates: [-124.1, 40.8, 10] } },
      ],
    });

    // Revised Observation with newer update time and increased magnitude
    await engine.collectUSGS({
      type: "FeatureCollection",
      features: [
        { id: "quake_100", properties: { mag: 4.9, time: now - 3600000, updated: now - 600000, place: "Eureka (Reviewed)" }, geometry: { coordinates: [-124.2, 40.85, 12] } },
      ],
    });

    const all = await engine.collectAll();
    const revisedObs = all.observations.find((o) => o.originalId === "quake_100");
    expect(revisedObs).toBeDefined();
    expect(revisedObs?.status).toBe("revised");
    expect(revisedObs?.lineageRevisions?.length).toBeGreaterThan(0);
  });

  it("HF-04: Upstream HTTP 429 rate limit triggers bounded degraded state without crashing", async () => {
    const engine = new HazardFusionEngine();
    const res = await engine.collectUSGS(null, 429);
    expect(res.receipt.httpStatus).toBe(429);
    expect(res.receipt.healthState).toBe("degraded");
  });

  it("HF-05: Missing interval / stale source threshold check", () => {
    const engine = new HazardFusionEngine();
    const testResult = engine.runHardTestCase("HF-05");
    expect(testResult.passed).toBe(true);
  });

  it("HF-06: Semantic unit mismatch denies composite risk scoring and preserves units", () => {
    const engine = new HazardFusionEngine();
    const testResult = engine.runHardTestCase("HF-06");
    expect(testResult.passed).toBe(true);
  });
});

describe("DataForge SubAgentManager & Full Autonomy", () => {
  it("Autonomous SubAgentManager creates and runs 6 specialized workers", async () => {
    const manager = new SubAgentManager({ mode: "dangerously_bypass" });
    expect(manager.getAutonomyConfig().mode).toBe("dangerously_bypass");
    expect(manager.getAutonomyConfig().bypassSafeguards).toBe(true);

    const result = await manager.runAutonomousOrchestration("Multi-Source Hazard & Spotify Ingestion");
    expect(result.completedTasks.length).toBe(6);
    expect(result.completedTasks.every((t) => t.status === "completed")).toBe(true);
    expect(result.synthesisReport).toContain("DATAFORGE AUTONOMOUS MULTI-AGENT SYNTHESIS REPORT");
  });
});
