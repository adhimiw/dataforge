pub mod analysis;
pub mod governance;
pub mod manifest;
pub mod raster;
pub mod tui;
pub mod workspace;

use std::io;

#[derive(thiserror::Error, Debug)]
pub enum DataForgeError {
    #[error("I/O error: {0}")]
    Io(#[from] io::Error),
    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("CSV error: {0}")]
    Csv(#[from] csv::Error),
    #[error("Image error: {0}")]
    Image(#[from] image::ImageError),
    #[error("governance stop: {0}")]
    Governance(String),
    #[error("invalid analysis manifest: {0}")]
    Manifest(String),
}

pub type Result<T> = std::result::Result<T, DataForgeError>;

pub const PRODUCT: &str = "DataForge";
pub const RUNTIME_LABEL: &str = "DataForge Runtime";
pub const MODEL_LABEL: &str = "Big Pickle";
pub const PROVIDER_LABEL: &str = "DataForge Zen";
