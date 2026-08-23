use crate::manifest::{AnalysisManifest, Charts, ColumnProfile, Dataset, Metric, StreamEvent};
use crate::workspace::Workspace;
use crate::{DataForgeError, Result};
use csv::StringRecord;
use serde::Serialize;
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet, HashSet};
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
pub struct AnalysisReport {
    pub source: String,
    pub records: usize,
    pub columns: usize,
    pub manifest: String,
    pub classification: String,
    pub external_research: String,
}

#[derive(Default)]
struct ColumnStats {
    missing: usize,
    present: usize,
    numeric: usize,
    unique: HashSet<String>,
}

impl ColumnStats {
    fn observe(&mut self, value: &str) {
        if value.trim().is_empty() {
            self.missing += 1;
            return;
        }
        self.present += 1;
        if value.parse::<f64>().is_ok() {
            self.numeric += 1;
        }
        if self.unique.len() < 50_001 {
            self.unique.insert(value.to_string());
        }
    }
}

pub fn profile_csv(
    input: &Path,
    workspace: &Workspace,
    classification: &str,
) -> Result<AnalysisReport> {
    if !input.is_file() {
        return Err(DataForgeError::Manifest(format!(
            "CSV file does not exist: {}",
            input.display()
        )));
    }
    let mut reader = csv::ReaderBuilder::new().flexible(true).from_path(input)?;
    let headers = reader.headers()?.clone();
    let mut stats = (0..headers.len())
        .map(|_| ColumnStats::default())
        .collect::<Vec<_>>();
    let year_index = headers
        .iter()
        .position(|name| name.to_ascii_lowercase().contains("year"));
    let metric_index = headers
        .iter()
        .position(|name| name.to_ascii_lowercase().contains("incidence"))
        .or_else(|| {
            headers
                .iter()
                .position(|name| name.to_ascii_lowercase().contains("value"))
        });
    let mut yearly = BTreeMap::<i32, (f64, usize)>::new();
    let mut safe_rows = Vec::<BTreeMap<String, Value>>::new();
    let mut records = 0usize;

    for result in reader.records() {
        let record = result?;
        records += 1;
        observe_record(&headers, &record, &mut stats);
        if classification == "public" && safe_rows.len() < 40 {
            safe_rows.push(redacted_row(&headers, &record));
        }
        if let (Some(year_index), Some(metric_index)) = (year_index, metric_index) {
            let year = record
                .get(year_index)
                .and_then(|value| value.parse::<i32>().ok());
            let metric = record
                .get(metric_index)
                .and_then(|value| value.parse::<f64>().ok());
            if let (Some(year), Some(metric)) = (year, metric) {
                let entry = yearly.entry(year).or_insert((0.0, 0));
                entry.0 += metric;
                entry.1 += 1;
            }
        }
    }

    let columns = headers
        .iter()
        .enumerate()
        .map(|(index, name)| {
            let stat = &stats[index];
            let total = stat.missing + stat.present;
            let null_percent = if total == 0 {
                0.0
            } else {
                (stat.missing as f64 / total as f64) * 100.0
            };
            let column_type = if stat.present > 0 && stat.numeric == stat.present {
                "number"
            } else {
                "string"
            };
            let fill = ((100.0 - null_percent) / 12.5).round().clamp(0.0, 8.0) as usize;
            ColumnProfile {
                name: name.to_string(),
                column_type: column_type.to_string(),
                null_percent: (null_percent * 100.0).round() / 100.0,
                unique_count: stat.unique.len(),
                sparkline: "▁▂▃▄▅▆▇█".chars().take(fill).collect(),
            }
        })
        .collect::<Vec<_>>();

    let line = yearly
        .iter()
        .map(|(year, (sum, count))| Metric {
            label: year.to_string(),
            value: (sum / *count as f64 * 100.0).round() / 100.0,
        })
        .collect::<Vec<_>>();
    let bars = columns
        .iter()
        .filter(|column| column.null_percent > 0.0)
        .take(8)
        .map(|column| Metric {
            label: column.name.clone(),
            value: column.null_percent,
        })
        .collect::<Vec<_>>();
    let label = input
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("local CSV")
        .to_string();
    let manifest = AnalysisManifest {
        dataset: Some(Dataset { label, classification: classification.to_string() }),
        charts: Charts { line, bars },
        columns,
        stream: vec![
            StreamEvent { phase: "plan".to_string(), message: "Classified and profiled the CSV locally before rendering analysis output.".to_string() },
            StreamEvent { phase: "tool".to_string(), message: format!("Streamed {} records locally; no web lookup or upload was used.", records) },
            StreamEvent { phase: "observation".to_string(), message: "Manifest contains aggregate column metrics and optional public safe rows only.".to_string() },
            StreamEvent { phase: "interpretation".to_string(), message: "Aggregate values are descriptive evidence and require validation before any decision use.".to_string() },
            StreamEvent { phase: "verification".to_string(), message: "Wrote a local analysis manifest without mutating the source CSV.".to_string() },
        ],
        safe_rows,
        figures: Vec::new(),
    };
    manifest.save(&workspace.manifest_path())?;
    let mut state = workspace.read_state()?;
    state
        .artifacts
        .push(workspace.manifest_path().display().to_string());
    state.checks.push("local_csv_profile_completed".to_string());
    workspace.write_state(&state)?;
    Ok(AnalysisReport {
        source: input.display().to_string(),
        records,
        columns: headers.len(),
        manifest: workspace.manifest_path().display().to_string(),
        classification: classification.to_string(),
        external_research: "not_run".to_string(),
    })
}

fn observe_record(headers: &StringRecord, record: &StringRecord, stats: &mut [ColumnStats]) {
    for (index, _) in headers.iter().enumerate() {
        stats[index].observe(record.get(index).unwrap_or_default());
    }
}

fn redacted_row(headers: &StringRecord, record: &StringRecord) -> BTreeMap<String, Value> {
    let mut output = BTreeMap::new();
    for (index, header) in headers.iter().enumerate() {
        let lower = header.to_ascii_lowercase();
        if lower.contains("email")
            || lower.contains("phone")
            || lower.contains("address")
            || lower.contains("identifier")
        {
            continue;
        }
        output.insert(
            header.to_string(),
            Value::String(record.get(index).unwrap_or_default().to_string()),
        );
    }
    output
}

pub fn protected_headers(headers: &StringRecord) -> BTreeSet<String> {
    headers
        .iter()
        .filter(|header| {
            let lower = header.to_ascii_lowercase();
            lower.contains("email")
                || lower.contains("phone")
                || lower.contains("address")
                || lower.contains("identifier")
        })
        .map(ToString::to_string)
        .collect()
}
