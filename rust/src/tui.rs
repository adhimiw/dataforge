use crate::manifest::{AnalysisManifest, PixelCell};
use crate::{DataForgeError, Result, PRODUCT};
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout, Rect},
    style::{Color, Style},
    text::{Line, Span},
    widgets::{Block, Borders, Paragraph, Row, Table, Tabs, Wrap},
    Terminal,
};
use serde_json::Value;
use std::io::{self, Stdout};
use std::path::Path;
use std::time::Duration;

#[derive(Default)]
struct App {
    manifest: AnalysisManifest,
    active: usize,
    figure: usize,
    row_offset: usize,
    status: String,
}

pub fn run(manifest_path: &Path) -> Result<()> {
    let manifest = AnalysisManifest::load(manifest_path)?;
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;
    let outcome = run_loop(
        &mut terminal,
        App {
            manifest,
            status: "Evidence is local and approval-gated.".to_string(),
            ..App::default()
        },
    );
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;
    outcome
}

fn run_loop(terminal: &mut Terminal<CrosstermBackend<Stdout>>, mut app: App) -> Result<()> {
    loop {
        terminal.draw(|frame| draw(frame, &app))?;
        if !event::poll(Duration::from_millis(120))? {
            continue;
        }
        if let Event::Key(key) = event::read()? {
            match key.code {
                KeyCode::Char('q') | KeyCode::Esc => return Ok(()),
                KeyCode::Char('1') => app.active = 0,
                KeyCode::Char('2') => app.active = 1,
                KeyCode::Char('3') => app.active = 2,
                KeyCode::Char('4') => app.active = 3,
                KeyCode::Char('5') => app.active = 4,
                KeyCode::Tab | KeyCode::Char(' ')
                    if app.active == 1 && !app.manifest.figures.is_empty() =>
                {
                    app.figure = (app.figure + 1) % app.manifest.figures.len();
                }
                KeyCode::Up if app.active == 4 => app.row_offset = app.row_offset.saturating_sub(1),
                KeyCode::Down if app.active == 4 => {
                    app.row_offset =
                        (app.row_offset + 1).min(app.manifest.safe_rows.len().saturating_sub(1));
                }
                KeyCode::Enter => {
                    app.status = "Ask DataForge: review current evidence and retain governance approval gates.".to_string();
                }
                _ => {}
            }
        }
    }
}

fn draw(frame: &mut ratatui::Frame, app: &App) {
    let area = frame.size();
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Length(2),
            Constraint::Length(2),
            Constraint::Min(4),
            Constraint::Length(2),
        ])
        .split(area);
    let classification = app
        .manifest
        .dataset
        .as_ref()
        .map(|dataset| dataset.classification.as_str())
        .unwrap_or("unknown");
    let dataset = app
        .manifest
        .dataset
        .as_ref()
        .map(|dataset| dataset.label.as_str())
        .unwrap_or("NO MANIFEST");
    frame.render_widget(
        Paragraph::new(format!(
            "◢◆◣ {PRODUCT}  ANALYSIS CONSOLE  [{}] {}",
            classification.to_uppercase(),
            dataset
        ))
        .style(Style::default().fg(Color::Cyan)),
        chunks[0],
    );
    let titles = [
        "[1] CHARTS",
        "[2] PLOT RASTER",
        "[3] PROFILER",
        "[4] STREAM",
        "[5] SAFE RECORDS",
    ]
    .iter()
    .map(|title| Line::from(*title))
    .collect::<Vec<_>>();
    frame.render_widget(
        Tabs::new(titles)
            .select(app.active)
            .highlight_style(Style::default().fg(Color::Cyan)),
        chunks[1],
    );
    match app.active {
        0 => draw_charts(frame, chunks[2], app),
        1 => draw_plot(frame, chunks[2], app),
        2 => draw_profiler(frame, chunks[2], app),
        3 => draw_stream(frame, chunks[2], app),
        _ => draw_records(frame, chunks[2], app),
    }
    frame.render_widget(
        Paragraph::new(format!("{} · esc/q exit · enter ask", app.status))
            .style(Style::default().fg(Color::DarkGray)),
        chunks[3],
    );
}

fn draw_charts(frame: &mut ratatui::Frame, area: Rect, app: &App) {
    let panels = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
        .split(area);
    let line = app
        .manifest
        .charts
        .line
        .iter()
        .map(|metric| metric.value)
        .collect::<Vec<_>>();
    let left = format!(
        "GLOBAL TREND\n{}\n\n{}",
        sparkline(&line),
        app.manifest
            .charts
            .line
            .iter()
            .map(|item| format!("{}  {}", item.label, item.value))
            .collect::<Vec<_>>()
            .join("\n")
    );
    let maximum = app
        .manifest
        .charts
        .bars
        .iter()
        .map(|metric| metric.value)
        .fold(1.0, f64::max);
    let right = app
        .manifest
        .charts
        .bars
        .iter()
        .map(|item| {
            format!(
                "{:<18} {} {:.2}",
                item.label,
                "█".repeat(((item.value / maximum) * 18.0).round().max(1.0) as usize),
                item.value
            )
        })
        .collect::<Vec<_>>()
        .join("\n");
    frame.render_widget(
        Paragraph::new(left)
            .block(
                Block::default()
                    .title("TERMINAL CHARTS")
                    .borders(Borders::ALL),
            )
            .wrap(Wrap { trim: true }),
        panels[0],
    );
    frame.render_widget(
        Paragraph::new(format!("TOP SEGMENTS\n{}", right))
            .block(Block::default().borders(Borders::ALL))
            .wrap(Wrap { trim: true }),
        panels[1],
    );
}

fn draw_plot(frame: &mut ratatui::Frame, area: Rect, app: &App) {
    let Some(figure) = app.manifest.figures.get(app.figure) else {
        frame.render_widget(Paragraph::new("No terminal raster is available. Run a local analysis and rasterize a verified PNG artifact.").block(Block::default().title("PLOT RASTER").borders(Borders::ALL)), area);
        return;
    };
    let mut lines = vec![Line::from(Span::styled(
        format!("{} · {}", figure.title, figure.artifact),
        Style::default().fg(Color::Cyan),
    ))];
    for row in &figure.pixels {
        lines.push(Line::from(row.iter().map(pixel_span).collect::<Vec<_>>()));
    }
    lines.push(Line::from(
        "tab / space switches verified local plot artifacts",
    ));
    frame.render_widget(
        Paragraph::new(lines).block(Block::default().title("PLOT RASTER").borders(Borders::ALL)),
        area,
    );
}

fn draw_profiler(frame: &mut ratatui::Frame, area: Rect, app: &App) {
    let header = Row::new(vec!["COLUMN", "TYPE", "NULL%", "DISTINCT", "DISTRIBUTION"])
        .style(Style::default().fg(Color::Cyan));
    let rows = app.manifest.columns.iter().map(|column| {
        Row::new(vec![
            column.name.clone(),
            column.column_type.clone(),
            format!("{:.2}", column.null_percent),
            column.unique_count.to_string(),
            column.sparkline.clone(),
        ])
    });
    let table = Table::new(
        rows,
        [
            Constraint::Percentage(34),
            Constraint::Percentage(14),
            Constraint::Percentage(12),
            Constraint::Percentage(16),
            Constraint::Percentage(24),
        ],
    )
    .header(header)
    .block(
        Block::default()
            .title("DATA PROFILER")
            .borders(Borders::ALL),
    );
    frame.render_widget(table, area);
}

fn draw_stream(frame: &mut ratatui::Frame, area: Rect, app: &App) {
    let text = app
        .manifest
        .stream
        .iter()
        .map(|event| format!("{:<15} {}", event.phase.to_uppercase(), event.message))
        .collect::<Vec<_>>()
        .join("\n");
    frame.render_widget(
        Paragraph::new(text)
            .block(
                Block::default()
                    .title("ANALYSIS STREAM")
                    .borders(Borders::ALL),
            )
            .wrap(Wrap { trim: true }),
        area,
    );
}

fn draw_records(frame: &mut ratatui::Frame, area: Rect, app: &App) {
    let rows = app
        .manifest
        .safe_rows
        .iter()
        .skip(app.row_offset)
        .take(12)
        .map(record_text)
        .collect::<Vec<_>>()
        .join("\n");
    let text = format!(
        "SAFE LOCAL PREVIEW · ROW {} OF {}\n{}\n\nup / down scrolls approved rows only",
        app.row_offset + 1,
        app.manifest.safe_rows.len(),
        rows
    );
    frame.render_widget(
        Paragraph::new(text)
            .block(Block::default().title("SAFE RECORDS").borders(Borders::ALL))
            .wrap(Wrap { trim: true }),
        area,
    );
}

fn record_text(record: &std::collections::BTreeMap<String, Value>) -> String {
    record
        .iter()
        .map(|(key, value)| format!("{}={}", key, value))
        .collect::<Vec<_>>()
        .join("  ")
}

fn sparkline(values: &[f64]) -> String {
    let levels = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
    let maximum = values.iter().copied().fold(1.0, f64::max);
    values
        .iter()
        .map(|value| levels[((value / maximum) * 7.0).round().clamp(0.0, 7.0) as usize])
        .collect()
}

fn pixel_span(cell: &PixelCell) -> Span<'static> {
    let foreground = parse_color(&cell.foreground).unwrap_or(Color::White);
    let background = parse_color(&cell.background).unwrap_or(Color::Black);
    Span::styled("▀", Style::default().fg(foreground).bg(background))
}

fn parse_color(value: &str) -> Option<Color> {
    let hex = value.strip_prefix('#')?;
    if hex.len() != 6 {
        return None;
    }
    let red = u8::from_str_radix(&hex[0..2], 16).ok()?;
    let green = u8::from_str_radix(&hex[2..4], 16).ok()?;
    let blue = u8::from_str_radix(&hex[4..6], 16).ok()?;
    Some(Color::Rgb(red, green, blue))
}

impl From<DataForgeError> for io::Error {
    fn from(error: DataForgeError) -> Self {
        io::Error::other(error.to_string())
    }
}
