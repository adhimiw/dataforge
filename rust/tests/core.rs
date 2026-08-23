use dataforge_rs::analysis::profile_csv;
use dataforge_rs::governance::{authorize, Action, AutonomyBudget, Decision};
use dataforge_rs::manifest::AnalysisManifest;
use dataforge_rs::raster::rasterize_png;
use dataforge_rs::workspace::Workspace;
use image::{Rgba, RgbaImage};
use std::fs;

#[test]
fn initializes_governed_workspace_state() {
    let directory = tempfile::tempdir().unwrap();
    let workspace = Workspace::new(directory.path());
    workspace.initialize().unwrap();
    let state = workspace.read_state().unwrap();
    assert_eq!(state.autonomy.mode, "bounded");
    assert_eq!(state.governance.external_research, "approval_required");
    assert!(workspace.manifest_path().parent().unwrap().exists());
}

#[test]
fn governance_stops_bypass_and_external_research() {
    let budget = AutonomyBudget::default();
    assert!(matches!(
        authorize(Action::LocalInspect, false, &budget),
        Decision::Allowed { .. }
    ));
    assert!(matches!(
        authorize(Action::ExternalResearch, false, &budget),
        Decision::ApprovalRequired { .. }
    ));
    assert!(matches!(
        authorize(Action::LocalInspect, true, &budget),
        Decision::Denied { .. }
    ));
}

#[test]
fn profiles_public_csv_and_rasterizes_real_png() {
    let directory = tempfile::tempdir().unwrap();
    let workspace = Workspace::new(directory.path());
    workspace.initialize().unwrap();
    let csv_path = directory.path().join("metrics.csv");
    fs::write(
        &csv_path,
        "Year,Incidence,Region\n2020,10,North\n2021,12,South\n",
    )
    .unwrap();
    let report = profile_csv(&csv_path, &workspace, "public").unwrap();
    assert_eq!(report.records, 2);
    let manifest = AnalysisManifest::load(&workspace.manifest_path()).unwrap();
    assert_eq!(manifest.safe_rows.len(), 2);
    assert_eq!(manifest.charts.line.len(), 2);

    let png_path = directory.path().join("plot.png");
    let image = RgbaImage::from_pixel(4, 4, Rgba([0, 210, 255, 255]));
    image.save(&png_path).unwrap();
    rasterize_png(
        &png_path,
        &workspace.manifest_path(),
        "test-figure",
        "Test figure",
        8,
        3,
    )
    .unwrap();
    let updated = AnalysisManifest::load(&workspace.manifest_path()).unwrap();
    assert_eq!(updated.figures.len(), 1);
    assert!(!updated.figures[0].pixels.is_empty());
}
