use crate::manifest::{AnalysisManifest, PixelCell, RasterFigure};
use crate::{DataForgeError, Result};
use image::{imageops, Rgba, RgbaImage};
use std::path::Path;

pub fn rasterize_png(
    input: &Path,
    manifest_path: &Path,
    id: &str,
    title: &str,
    width: u32,
    height: u32,
) -> Result<()> {
    if !input.is_file() {
        return Err(DataForgeError::Manifest(format!(
            "PNG artifact does not exist: {}",
            input.display()
        )));
    }
    let source = image::open(input)?.to_rgba8();
    let target_height = height.saturating_mul(2).max(2);
    let resized = imageops::thumbnail(&source, width.max(1), target_height);
    let mut canvas = RgbaImage::from_pixel(width.max(1), target_height, Rgba([9, 11, 16, 255]));
    let x = ((canvas.width() - resized.width()) / 2) as i64;
    let y = ((canvas.height() - resized.height()) / 2) as i64;
    imageops::overlay(&mut canvas, &resized, x, y);
    let mut pixels = Vec::new();
    for y in (0..canvas.height()).step_by(2) {
        let mut row = Vec::new();
        for x in 0..canvas.width() {
            let foreground = canvas.get_pixel(x, y).0;
            let background = canvas.get_pixel(x, (y + 1).min(canvas.height() - 1)).0;
            row.push(PixelCell {
                foreground: hex(foreground),
                background: hex(background),
            });
        }
        pixels.push(row);
    }
    let mut manifest = AnalysisManifest::load_or_default(manifest_path)?;
    manifest.figures.retain(|figure| figure.id != id);
    manifest.figures.push(RasterFigure {
        id: id.to_string(),
        title: title.to_string(),
        artifact: input.canonicalize()?.display().to_string(),
        raster: Vec::new(),
        pixels,
    });
    manifest.save(manifest_path)
}

fn hex(pixel: [u8; 4]) -> String {
    format!("#{:02x}{:02x}{:02x}", pixel[0], pixel[1], pixel[2])
}
