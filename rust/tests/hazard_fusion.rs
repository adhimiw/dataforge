use dataforge_rs::live::{
    FusionEngine, IngestOutcome, Observation, Relation, Source, SourceHealth,
};
use serde_json::json;

fn observation(
    source: Source,
    id: &str,
    observed_at_ms: i64,
    updated_at_ms: i64,
    metric: Option<f64>,
    unit: Option<&str>,
) -> Observation {
    Observation {
        source,
        source_id: id.to_string(),
        observed_at_ms: Some(observed_at_ms),
        updated_at_ms: Some(updated_at_ms),
        latitude: Some(35.0),
        longitude: Some(-120.0),
        semantic: "fixture_observation".to_string(),
        metric,
        unit: unit.map(ToString::to_string),
        status: "observed".to_string(),
        context: json!({"fixture": true}),
    }
}

#[test]
fn hf_01_schema_drift_rejects_missing_identity() {
    let mut engine = FusionEngine::default();
    let mut invalid = observation(Source::Usgs, "", 1_000, 1_000, Some(1.0), Some("magnitude"));
    invalid.semantic = "".to_string();
    assert_eq!(engine.ingest(invalid), IngestOutcome::Rejected);
    assert_eq!(engine.health(Source::Usgs), Some(&SourceHealth::Degraded));
}

#[test]
fn hf_02_late_data_does_not_move_watermark_backward() {
    let mut engine = FusionEngine::default();
    assert_eq!(
        engine.ingest(observation(
            Source::Usgs,
            "new",
            100_000,
            100_000,
            Some(1.0),
            Some("magnitude")
        )),
        IngestOutcome::Accepted
    );
    assert_eq!(
        engine.ingest(observation(
            Source::Usgs,
            "late",
            10_000,
            10_000,
            Some(1.0),
            Some("magnitude")
        )),
        IngestOutcome::Late
    );
}

#[test]
fn hf_03_newer_source_revision_replaces_current_observation() {
    let mut engine = FusionEngine::default();
    assert_eq!(
        engine.ingest(observation(
            Source::Usgs,
            "event-1",
            100_000,
            100_000,
            Some(2.0),
            Some("magnitude")
        )),
        IngestOutcome::Accepted
    );
    assert_eq!(
        engine.ingest(observation(
            Source::Usgs,
            "event-1",
            100_000,
            120_000,
            Some(2.5),
            Some("magnitude")
        )),
        IngestOutcome::Revised
    );
}

#[test]
fn hf_04_rate_limit_marks_source_degraded_without_retry_loop() {
    let mut engine = FusionEngine::default();
    engine.mark_http_failure(Source::Nws);
    assert_eq!(engine.health(Source::Nws), Some(&SourceHealth::Degraded));
}

#[test]
fn hf_05_missing_interval_marks_source_stale_without_synthetic_clear() {
    let mut engine = FusionEngine::default();
    assert_eq!(
        engine.mark_stale(Source::Eonet, 1_000, 20_000, 5_000),
        SourceHealth::Stale
    );
    assert_eq!(engine.health(Source::Eonet), Some(&SourceHealth::Stale));
}

#[test]
fn hf_06_semantic_unit_mismatch_prohibits_composite_score() {
    let earthquake = observation(
        Source::Usgs,
        "quake",
        100_000,
        100_000,
        Some(4.2),
        Some("magnitude"),
    );
    let wildfire = observation(
        Source::Eonet,
        "fire",
        100_500,
        100_500,
        Some(800.0),
        Some("acres"),
    );
    let link = FusionEngine::relation(&earthquake, &wildfire);
    assert_eq!(link.relation, Relation::Incompatible);
    assert!(link.reason.contains("incomparable"));
}
