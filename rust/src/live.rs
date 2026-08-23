use crate::workspace::Workspace;
use crate::{DataForgeError, Result};
use chrono::{DateTime, Utc};
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::fs;
use std::time::Duration;
use tokio::time::sleep;

pub const USGS_URL: &str =
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
pub const NWS_URL: &str = "https://api.weather.gov/alerts/active?status=actual&message_type=alert";
pub const EONET_URL: &str = "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=100";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Source {
    Usgs,
    Nws,
    Eonet,
}

impl Source {
    pub fn label(self) -> &'static str {
        match self {
            Self::Usgs => "usgs",
            Self::Nws => "nws",
            Self::Eonet => "eonet",
        }
    }

    pub fn url(self) -> &'static str {
        match self {
            Self::Usgs => USGS_URL,
            Self::Nws => NWS_URL,
            Self::Eonet => EONET_URL,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceHealth {
    Healthy,
    Degraded,
    Stale,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SourceReceipt {
    pub source: Source,
    pub source_url: String,
    pub collected_at_ms: i64,
    pub http_status: Option<u16>,
    pub content_type: Option<String>,
    pub byte_count: usize,
    pub sha256: Option<String>,
    pub adapter_version: String,
    pub normalized_event_count: usize,
    pub health: SourceHealth,
    #[serde(default)]
    pub warnings: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Observation {
    pub source: Source,
    pub source_id: String,
    pub observed_at_ms: Option<i64>,
    pub updated_at_ms: Option<i64>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub semantic: String,
    pub metric: Option<f64>,
    pub unit: Option<String>,
    pub status: String,
    #[serde(default)]
    pub context: Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum IngestOutcome {
    Accepted,
    Late,
    Revised,
    Duplicate,
    Rejected,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Relation {
    PossibleContextMatch,
    Incompatible,
    NotLinked,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FusionLink {
    pub left: String,
    pub right: String,
    pub relation: Relation,
    pub reason: String,
}

#[derive(Debug, Default)]
pub struct FusionEngine {
    events: HashMap<(Source, String), Observation>,
    watermarks: HashMap<Source, i64>,
    health: HashMap<Source, SourceHealth>,
}

impl FusionEngine {
    pub fn ingest(&mut self, observation: Observation) -> IngestOutcome {
        if observation.source_id.trim().is_empty() || observation.semantic.trim().is_empty() {
            self.health
                .insert(observation.source, SourceHealth::Degraded);
            return IngestOutcome::Rejected;
        }
        if let Some(timestamp) = observation.observed_at_ms {
            if let Some(watermark) = self.watermarks.get(&observation.source) {
                if timestamp + 30_000 < *watermark {
                    return IngestOutcome::Late;
                }
            }
            self.watermarks
                .entry(observation.source)
                .and_modify(|current| *current = (*current).max(timestamp))
                .or_insert(timestamp);
        }
        self.health
            .insert(observation.source, SourceHealth::Healthy);
        let key = (observation.source, observation.source_id.clone());
        if let Some(previous) = self.events.get(&key) {
            if observation.updated_at_ms.unwrap_or_default()
                > previous.updated_at_ms.unwrap_or_default()
            {
                self.events.insert(key, observation);
                return IngestOutcome::Revised;
            }
            return IngestOutcome::Duplicate;
        }
        self.events.insert(key, observation);
        IngestOutcome::Accepted
    }

    pub fn mark_http_failure(&mut self, source: Source) {
        self.health.insert(source, SourceHealth::Degraded);
    }

    pub fn mark_stale(
        &mut self,
        source: Source,
        receipt_at_ms: i64,
        now_ms: i64,
        max_age_ms: i64,
    ) -> SourceHealth {
        let health = if now_ms.saturating_sub(receipt_at_ms) > max_age_ms {
            SourceHealth::Stale
        } else {
            SourceHealth::Healthy
        };
        self.health.insert(source, health.clone());
        health
    }

    pub fn health(&self, source: Source) -> Option<&SourceHealth> {
        self.health.get(&source)
    }

    pub fn relation(left: &Observation, right: &Observation) -> FusionLink {
        let pair = format!("{}:{}", left.source.label(), left.source_id);
        let other = format!("{}:{}", right.source.label(), right.source_id);
        if let (Some(left_unit), Some(right_unit)) = (&left.unit, &right.unit) {
            if left.metric.is_some() && right.metric.is_some() && left_unit != right_unit {
                return FusionLink {
                    left: pair,
                    right: other,
                    relation: Relation::Incompatible,
                    reason: format!("{} and {} use incomparable units.", left_unit, right_unit),
                };
            }
        }
        let (
            Some(left_lat),
            Some(left_lon),
            Some(right_lat),
            Some(right_lon),
            Some(left_time),
            Some(right_time),
        ) = (
            left.latitude,
            left.longitude,
            right.latitude,
            right.longitude,
            left.observed_at_ms,
            right.observed_at_ms,
        )
        else {
            return FusionLink { left: pair, right: other, relation: Relation::NotLinked, reason: "A required point or timestamp is unavailable; no location is inferred from text.".to_string() };
        };
        let distance = haversine_km(left_lat, left_lon, right_lat, right_lon);
        let time_gap = (left_time - right_time).unsigned_abs();
        if distance <= 100.0 && time_gap <= 3_600_000 {
            FusionLink { left: pair, right: other, relation: Relation::PossibleContextMatch, reason: format!("Observations are {:.1} km and {} seconds apart; this is context, not causation.", distance, time_gap / 1_000) }
        } else {
            FusionLink {
                left: pair,
                right: other,
                relation: Relation::NotLinked,
                reason: format!(
                    "No match: {:.1} km or {} seconds exceeds the configured envelope.",
                    distance,
                    time_gap / 1_000
                ),
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LiveRun {
    pub run_id: String,
    pub receipts: Vec<SourceReceipt>,
    pub observations: Vec<Observation>,
    pub links: Vec<FusionLink>,
    pub stored_at: String,
}

struct SourceFetch {
    receipt: SourceReceipt,
    payload: Option<Vec<u8>>,
    observations: Vec<Observation>,
}

pub async fn collect_live(workspace: &Workspace) -> Result<LiveRun> {
    workspace.initialize()?;
    let client = Client::builder()
        .timeout(Duration::from_secs(12))
        .user_agent("DataForge/0.1 public-data-fusion (local evidence collector)")
        .build()
        .map_err(|error| {
            DataForgeError::Governance(format!("Could not build public-data client: {error}"))
        })?;
    let (usgs, nws, eonet) = tokio::join!(
        fetch_source(&client, Source::Usgs),
        fetch_source(&client, Source::Nws),
        fetch_source(&client, Source::Eonet)
    );
    let fetched = vec![usgs, nws, eonet];
    let run_id = Utc::now().format("%Y%m%dT%H%M%SZ").to_string();
    let run_dir = workspace.dataforge_dir().join("live").join(&run_id);
    fs::create_dir_all(&run_dir)?;
    let mut receipts = Vec::new();
    let mut observations = Vec::new();
    for source in fetched {
        if let Some(payload) = source.payload {
            fs::write(
                run_dir.join(format!("{}.json", source.receipt.source.label())),
                payload,
            )?;
        }
        receipts.push(source.receipt);
        observations.extend(source.observations);
    }
    let mut engine = FusionEngine::default();
    for receipt in &receipts {
        if receipt.health == SourceHealth::Degraded {
            engine.mark_http_failure(receipt.source);
        }
    }
    for observation in &observations {
        engine.ingest(observation.clone());
    }
    let links = candidate_links(&observations);
    let run = LiveRun {
        run_id,
        receipts,
        observations,
        links,
        stored_at: run_dir.display().to_string(),
    };
    fs::write(
        run_dir.join("run.json"),
        serde_json::to_string_pretty(&run)? + "\n",
    )?;
    let mut state = workspace.read_state()?;
    state.artifacts.push(run_dir.display().to_string());
    state
        .checks
        .push("public_live_source_collection_completed".to_string());
    workspace.write_state(&state)?;
    Ok(run)
}

async fn fetch_source(client: &Client, source: Source) -> SourceFetch {
    let collected_at_ms = Utc::now().timestamp_millis();
    let mut attempt = 0u8;
    loop {
        let response = client.get(source.url()).send().await;
        match response {
            Ok(response) => {
                let status = response.status();
                let content_type = response
                    .headers()
                    .get(reqwest::header::CONTENT_TYPE)
                    .and_then(|value| value.to_str().ok())
                    .map(ToString::to_string);
                if (status == StatusCode::TOO_MANY_REQUESTS || status.is_server_error())
                    && attempt < 1
                {
                    attempt += 1;
                    sleep(Duration::from_millis(250)).await;
                    continue;
                }
                let payload = response.bytes().await;
                return match payload {
                    Ok(payload) if status.is_success() => {
                        let observations = parse_source(source, &payload)
                            .unwrap_or_else(|error| vec![parse_warning(source, error.to_string())]);
                        let parse_failed =
                            observations.len() == 1 && observations[0].semantic == "parse_warning";
                        SourceFetch {
                            receipt: SourceReceipt {
                                source,
                                source_url: source.url().to_string(),
                                collected_at_ms,
                                http_status: Some(status.as_u16()),
                                content_type,
                                byte_count: payload.len(),
                                sha256: Some(digest(&payload)),
                                adapter_version: "hazard-fusion-v1".to_string(),
                                normalized_event_count: if parse_failed {
                                    0
                                } else {
                                    observations.len()
                                },
                                health: if parse_failed {
                                    SourceHealth::Degraded
                                } else {
                                    SourceHealth::Healthy
                                },
                                warnings: if parse_failed {
                                    vec!["Payload could not satisfy the adapter contract."
                                        .to_string()]
                                } else {
                                    Vec::new()
                                },
                            },
                            payload: Some(payload.to_vec()),
                            observations: if parse_failed {
                                Vec::new()
                            } else {
                                observations
                            },
                        }
                    }
                    Ok(payload) => degraded_fetch(
                        source,
                        collected_at_ms,
                        Some(status.as_u16()),
                        content_type,
                        payload.len(),
                        Some(digest(&payload)),
                        format!(
                            "HTTP {} after {} bounded attempts.",
                            status.as_u16(),
                            attempt + 1
                        ),
                    ),
                    Err(error) => degraded_fetch(
                        source,
                        collected_at_ms,
                        Some(status.as_u16()),
                        content_type,
                        0,
                        None,
                        format!("Could not read HTTP response: {error}"),
                    ),
                };
            }
            Err(_) if attempt < 1 => {
                attempt += 1;
                sleep(Duration::from_millis(250)).await;
            }
            Err(error) => {
                return degraded_fetch(
                    source,
                    collected_at_ms,
                    None,
                    None,
                    0,
                    None,
                    format!(
                        "Network request failed after {} bounded attempts: {error}",
                        attempt + 1
                    ),
                )
            }
        }
    }
}

fn degraded_fetch(
    source: Source,
    collected_at_ms: i64,
    http_status: Option<u16>,
    content_type: Option<String>,
    byte_count: usize,
    sha256: Option<String>,
    warning: String,
) -> SourceFetch {
    SourceFetch {
        receipt: SourceReceipt {
            source,
            source_url: source.url().to_string(),
            collected_at_ms,
            http_status,
            content_type,
            byte_count,
            sha256,
            adapter_version: "hazard-fusion-v1".to_string(),
            normalized_event_count: 0,
            health: SourceHealth::Degraded,
            warnings: vec![warning],
        },
        payload: None,
        observations: Vec::new(),
    }
}

fn parse_source(source: Source, payload: &[u8]) -> Result<Vec<Observation>> {
    let value: Value = serde_json::from_slice(payload)?;
    match source {
        Source::Usgs => parse_usgs(&value),
        Source::Nws => parse_nws(&value),
        Source::Eonet => parse_eonet(&value),
    }
}

fn parse_usgs(value: &Value) -> Result<Vec<Observation>> {
    let features = value
        .get("features")
        .and_then(Value::as_array)
        .ok_or_else(|| DataForgeError::Manifest("USGS payload lacks features array".to_string()))?;
    Ok(features.iter().filter_map(|feature| {
        let properties = feature.get("properties")?;
        Some(Observation {
            source: Source::Usgs,
            source_id: feature.get("id")?.as_str()?.to_string(),
            observed_at_ms: properties.get("time").and_then(Value::as_i64),
            updated_at_ms: properties.get("updated").and_then(Value::as_i64),
            latitude: point(feature).map(|(_, latitude)| latitude),
            longitude: point(feature).map(|(longitude, _)| longitude),
            semantic: "earthquake_magnitude".to_string(),
            metric: properties.get("mag").and_then(Value::as_f64),
            unit: Some("magnitude".to_string()),
            status: properties.get("status").and_then(Value::as_str).unwrap_or("unknown").to_string(),
            context: serde_json::json!({"place": properties.get("place"), "network": properties.get("net")}),
        })
    }).collect())
}

fn parse_nws(value: &Value) -> Result<Vec<Observation>> {
    let features = value
        .get("features")
        .and_then(Value::as_array)
        .ok_or_else(|| DataForgeError::Manifest("NWS payload lacks features array".to_string()))?;
    Ok(features.iter().filter_map(|feature| {
        let properties = feature.get("properties")?;
        let id = properties.get("id").and_then(Value::as_str).or_else(|| feature.get("id").and_then(Value::as_str))?;
        Some(Observation {
            source: Source::Nws,
            source_id: id.to_string(),
            observed_at_ms: properties.get("sent").and_then(Value::as_str).and_then(parse_time),
            updated_at_ms: properties.get("effective").and_then(Value::as_str).and_then(parse_time),
            latitude: point(feature).map(|(_, latitude)| latitude),
            longitude: point(feature).map(|(longitude, _)| longitude),
            semantic: "weather_alert_severity".to_string(),
            metric: None,
            unit: Some("categorical_severity".to_string()),
            status: properties.get("status").and_then(Value::as_str).unwrap_or("unknown").to_string(),
            context: serde_json::json!({"event": properties.get("event"), "severity": properties.get("severity"), "certainty": properties.get("certainty"), "urgency": properties.get("urgency"), "area": properties.get("areaDesc")}),
        })
    }).collect())
}

fn parse_eonet(value: &Value) -> Result<Vec<Observation>> {
    let events = value
        .get("events")
        .and_then(Value::as_array)
        .ok_or_else(|| DataForgeError::Manifest("EONET payload lacks events array".to_string()))?;
    Ok(events.iter().filter_map(|event| {
        let geometry = event.get("geometry").and_then(Value::as_array)?.last()?;
        let coordinates = geometry.get("coordinates")?.as_array()?;
        let longitude = coordinates.first()?.as_f64()?;
        let latitude = coordinates.get(1)?.as_f64()?;
        let category = event.get("categories").and_then(Value::as_array).and_then(|items| items.first()).and_then(|item| item.get("title")).and_then(Value::as_str).unwrap_or("unknown");
        Some(Observation {
            source: Source::Eonet,
            source_id: event.get("id")?.as_str()?.to_string(),
            observed_at_ms: geometry.get("date").and_then(Value::as_str).and_then(parse_time),
            updated_at_ms: geometry.get("date").and_then(Value::as_str).and_then(parse_time),
            latitude: Some(latitude),
            longitude: Some(longitude),
            semantic: "curated_natural_event_magnitude".to_string(),
            metric: geometry.get("magnitudeValue").and_then(Value::as_f64),
            unit: geometry.get("magnitudeUnit").and_then(Value::as_str).map(ToString::to_string),
            status: if event.get("closed").is_some_and(|closed| closed.is_null()) { "open".to_string() } else { "closed_or_unknown".to_string() },
            context: serde_json::json!({"title": event.get("title"), "category": category, "sources": event.get("sources")}),
        })
    }).collect())
}

fn point(feature: &Value) -> Option<(f64, f64)> {
    let coordinates = feature.get("geometry")?.get("coordinates")?.as_array()?;
    Some((
        coordinates.first()?.as_f64()?,
        coordinates.get(1)?.as_f64()?,
    ))
}

fn parse_time(value: &str) -> Option<i64> {
    DateTime::parse_from_rfc3339(value)
        .ok()
        .map(|time| time.timestamp_millis())
}

fn parse_warning(source: Source, message: String) -> Observation {
    Observation {
        source,
        source_id: "parse-warning".to_string(),
        observed_at_ms: None,
        updated_at_ms: None,
        latitude: None,
        longitude: None,
        semantic: "parse_warning".to_string(),
        metric: None,
        unit: None,
        status: "degraded".to_string(),
        context: serde_json::json!({"warning": message}),
    }
}

fn candidate_links(observations: &[Observation]) -> Vec<FusionLink> {
    let mut links = Vec::new();
    for (index, left) in observations.iter().enumerate() {
        for right in observations.iter().skip(index + 1) {
            if left.source != right.source {
                let link = FusionEngine::relation(left, right);
                if link.relation != Relation::NotLinked {
                    links.push(link);
                }
            }
        }
    }
    links
}

fn digest(payload: &[u8]) -> String {
    format!("{:x}", Sha256::digest(payload))
}

fn haversine_km(lat_a: f64, lon_a: f64, lat_b: f64, lon_b: f64) -> f64 {
    let radians = std::f64::consts::PI / 180.0;
    let d_lat = (lat_b - lat_a) * radians;
    let d_lon = (lon_b - lon_a) * radians;
    let value = (d_lat / 2.0).sin().powi(2)
        + lat_a.to_radians().cos() * lat_b.to_radians().cos() * (d_lon / 2.0).sin().powi(2);
    6_371.0 * 2.0 * value.sqrt().asin()
}
