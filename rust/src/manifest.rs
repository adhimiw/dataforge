use crate::{DataForgeError, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Dataset {
    pub label: String,
    pub classification: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Metric {
    pub label: String,
    pub value: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Charts {
    #[serde(default)]
    pub line: Vec<Metric>,
    #[serde(default)]
    pub bars: Vec<Metric>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ColumnProfile {
    pub name: String,
    #[serde(rename = "type")]
    pub column_type: String,
    pub null_percent: f64,
    pub unique_count: usize,
    #[serde(default)]
    pub sparkline: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct StreamEvent {
    pub phase: String,
    pub message: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PixelCell {
    pub foreground: String,
    pub background: String,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RasterFigure {
    pub id: String,
    pub title: String,
    pub artifact: String,
    #[serde(default)]
    pub raster: Vec<String>,
    #[serde(default)]
    pub pixels: Vec<Vec<PixelCell>>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalysisManifest {
    #[serde(default)]
    pub dataset: Option<Dataset>,
    #[serde(default)]
    pub charts: Charts,
    #[serde(default)]
    pub columns: Vec<ColumnProfile>,
    #[serde(default)]
    pub stream: Vec<StreamEvent>,
    #[serde(default)]
    pub safe_rows: Vec<BTreeMap<String, Value>>,
    #[serde(default)]
    pub figures: Vec<RasterFigure>,
}

impl AnalysisManifest {
    pub fn load(path: &Path) -> Result<Self> {
        let source = fs::read_to_string(path)?;
        let manifest = serde_json::from_str(&source)?;
        Ok(manifest)
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)?;
        }
        let output = serde_json::to_string_pretty(self)? + "\n";
        fs::write(path, output)?;
        Ok(())
    }

    pub fn load_or_default(path: &Path) -> Result<Self> {
        match Self::load(path) {
            Ok(manifest) => Ok(manifest),
            Err(DataForgeError::Io(error)) if error.kind() == std::io::ErrorKind::NotFound => {
                Ok(Self::default())
            }
            Err(error) => Err(error),
        }
    }
}
