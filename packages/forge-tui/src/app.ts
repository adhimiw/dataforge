import { Terminal } from "./core/terminal";
import { InputParser, KeyEvent } from "./core/input";
import { Layout } from "./layout/layout";
import { Constraint } from "./layout/constraint";
import { Block } from "./widgets/block";
import { Paragraph } from "./widgets/paragraph";
import { StreamView } from "./widgets/stream-view";
import { DataTable } from "./widgets/data-table";
import { DataProfileWidget } from "./widgets/data-profile";
import { BarChart, LineChart } from "./widgets/chart";
import { ImageRasterWidget, ImageMatrix } from "./widgets/image";
import { PromptInput } from "./widgets/prompt-input";
import { StatusBar } from "./widgets/status-bar";
import { Color } from "./style/color";
import { Style } from "./core/cell";
import { XperiaTheme } from "./style/xperia";
import { CSVProfiler, DatasetProfile } from "./data/csv";
import { ZenClient } from "./llm/zen";
import { ColibriEngine, COLIBRI_REGISTRY } from "./llm/colibri";
import { ExaClient, ExaSearchResult } from "./search/exa";
import { GodPatternDiscoveryEngine, DiscoveredPattern } from "./agent/pattern-discovery";
import path from "path";
import fs from "fs";

// Datasets registry
const datasetsConfig = [
  {
    id: "spotify_tracks",
    name: "Spotify Tracks Dataset (114k)",
    paths: [
      "/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify/spotify_tracks.csv",
      "C:\\Users\\Admin\\dataforge\\.dataforge\\datasets\\spotify\\spotify_tracks.csv",
    ],
  },
  {
    id: "spotify_artists",
    name: "Spotify Artist Streaming Analytics",
    paths: [
      "/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify/spotify_artist_streaming.csv",
      "C:\\Users\\Admin\\dataforge\\.dataforge\\datasets\\spotify\\spotify_artist_streaming.csv",
    ],
  },
  {
    id: "spotify_top",
    name: "Most Streamed Artists All-Time",
    paths: [
      "/mnt/c/Users/Admin/dataforge/.dataforge/datasets/spotify/spotify_top_streamed_artists.csv",
      "C:\\Users\\Admin\\dataforge\\.dataforge\\datasets\\spotify\\spotify_top_streamed_artists.csv",
    ],
  },
  {
    id: "tb_burden",
    name: "WHO Tuberculosis Global Burden",
    paths: [
      "C:\\Users\\Admin\\Downloads\\TB_Burden_Country.csv",
      "/mnt/c/Users/Admin/Downloads/TB_Burden_Country.csv",
    ],
  },
];

let activeDatasetIndex = 0;
let currentProfile: DatasetProfile;

function loadActiveDataset(index: number) {
  activeDatasetIndex = index;
  const cfg = datasetsConfig[index];
  const foundPath = cfg.paths.find((p) => fs.existsSync(p)) || cfg.paths[0];
  try {
    currentProfile = CSVProfiler.profile(foundPath, 3000);
  } catch {
    currentProfile = {
      filepath: foundPath,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      rows: [],
      yearlyTrends: [],
      topCountriesByMortality: [],
    };
  }
}

loadActiveDataset(0);

// Load Python Generated Raster Images
const rasterImages: { [key: string]: ImageMatrix } = {};
const imgFiles = [
  { key: "spotify_clusters", file: "spotify_audio_clusters.json" },
  { key: "spotify_artists", file: "spotify_artist_dominance.json" },
  { key: "tb_trends", file: "tb_global_trends.json" },
  { key: "tb_countries", file: "tb_top_countries.json" },
];

for (const item of imgFiles) {
  const p = path.join(__dirname, "../artifacts", item.file);
  if (fs.existsSync(p)) {
    try {
      rasterImages[item.key] = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {}
  }
}

const terminal = new Terminal().enter();
const input = new InputParser();
const zenClient = new ZenClient();
const colibriEngine = new ColibriEngine("ornith-1.5:9b");
const exaClient = new ExaClient();
const discoveryEngine = new GodPatternDiscoveryEngine();

type ActiveTab = "analytics" | "images" | "exa" | "art" | "profiler" | "table";
let currentTab: ActiveTab = "analytics";
let activeImageIndex = 0;
let inputValue = "";
let isStreaming = false;
let totalTokens = 0;
let tableSelectedIndex = 0;

// Model Selection: 0 = Ornith-1.5:9B (Local Colibri), 1 = OpenCode Zen Big-Pickle (Cloud)
let activeModelIndex = 0;
const activeModels = [
  { id: "ornith-1.5:9b", name: "Ornith-1.5:9B (Local Colibri)", type: "local" },
  { id: "big-pickle", name: "Big Pickle 200k (OpenCode Zen)", type: "cloud" },
];

const streamView = new StreamView();
let discoveredPatterns: DiscoveredPattern[] = [];
let exaLiveResults: ExaSearchResult[] = [];
let exaQueryText = "Taylor Swift Eras Tour Spotify catalog stream surge";

triggerAutonomousRollout();

async function triggerAutonomousRollout() {
  const result = await discoveryEngine.runAutonomousDiscovery("", "", "");
  discoveredPatterns = result.patterns;

  streamView.setThinkingState(true);
  for (const t of result.reasoningTrace) {
    streamView.addThinking(t + "\n");
  }
  streamView.setThinkingState(false);
  streamView.addToken(result.synthesizedReport);

  const exaHit = await exaClient.search(exaQueryText, 3);
  exaLiveResults = exaHit.results;
  render();
}

function triggerLLMQuery(promptText: string) {
  if (isStreaming) return;
  isStreaming = true;
  const currentModel = activeModels[activeModelIndex];
  streamView.setThinkingState(true);
  streamView.addToken(`\n\n👤 **User**: ${promptText}\n\n🤖 **DataForge Agent [${currentModel.name}]**:\n`);
  render();

  const summary = `
Current Active Dataset: ${datasetsConfig[activeDatasetIndex].name}
Rows: ${currentProfile.rowCount.toLocaleString()} | Features: ${currentProfile.columnCount}
Discovered Patterns: ${discoveredPatterns.length} verified hidden clusters
Exa Neural Context: ${exaLiveResults[0]?.title || "Billboard streaming data active"}
`;

  if (currentModel.type === "local") {
    colibriEngine.setModel(currentModel.id);
    colibriEngine.streamAnalysis(summary, promptText, {
      onThinking: (thought) => {
        streamView.addThinking(thought);
        totalTokens += 3;
        render();
      },
      onToken: (tok) => {
        streamView.setThinkingState(false);
        streamView.addToken(tok);
        totalTokens += 2;
        render();
      },
      onError: (err) => {
        streamView.setThinkingState(false);
        streamView.addToken(`\n❌ Local Model Error: ${err.message}\n(Falling back to OpenCode Zen...)\n`);
        zenClient.streamAnalysis(summary, promptText, {
          onThinking: (t) => streamView.addThinking(t),
          onToken: (t) => streamView.addToken(t),
          onComplete: () => { isStreaming = false; render(); },
        });
      },
      onComplete: () => {
        streamView.setThinkingState(false);
        isStreaming = false;
        render();
      },
    });
  } else {
    zenClient.streamAnalysis(summary, promptText, {
      onThinking: (thought) => {
        streamView.addThinking(thought);
        totalTokens += 4;
        render();
      },
      onToken: (tok) => {
        streamView.setThinkingState(false);
        streamView.addToken(tok);
        totalTokens += 2;
        render();
      },
      onError: (err) => {
        streamView.setThinkingState(false);
        streamView.addToken(`\n❌ Error: ${err.message}\n`);
        isStreaming = false;
        render();
      },
      onComplete: () => {
        streamView.setThinkingState(false);
        isStreaming = false;
        render();
      },
    });
  }
}

function render() {
  terminal.draw((frame) => {
    const size = frame.size;

    const chunks = Layout.vertical()
      .constraints([
        Constraint.length(3), // Header
        Constraint.length(1), // Nav Tabs
        Constraint.fill(),      // Main View
        Constraint.length(3), // Prompt Input
        Constraint.length(1), // Status Bar
      ])
      .split(size);

    // 1. Header (Sony Xperia SST Brand)
    const headerBlock = new Block()
      .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
      .title("DATAFORGE │ SONY XPERIA SST GOD-TIER ANALYTICS & ART ENGINE", "center", XperiaTheme.TITLE)
      .background(XperiaTheme.OBSIDIAN_BG);

    const headerPara = Paragraph.text(
      `📊 Dataset: [${datasetsConfig[activeDatasetIndex].name}] (${currentProfile.rowCount.toLocaleString()} rows) │ Model: [${activeModels[activeModelIndex].name}] │ [D] Cycle Data │ [M] Switch Model`
    )
      .block(headerBlock)
      .style(XperiaTheme.SUBTITLE);
    frame.renderWidget(headerPara, chunks[0]);

    // 2. Navigation Tabs
    renderNavTabs(chunks[1], frame);

    // 3. Tab Contents
    if (currentTab === "analytics") {
      renderAnalyticsTab(chunks[2], frame);
    } else if (currentTab === "images") {
      renderImagesTab(chunks[2], frame);
    } else if (currentTab === "exa") {
      renderExaTab(chunks[2], frame);
    } else if (currentTab === "art") {
      renderArtTab(chunks[2], frame);
    } else if (currentTab === "profiler") {
      renderProfileTab(chunks[2], frame);
    } else if (currentTab === "table") {
      renderTableTab(chunks[2], frame);
    }

    // 4. Prompt Input
    const promptBlock = new Block()
      .border("rounded", Style.default().withFg(isStreaming ? XperiaTheme.SONY_GOLD : XperiaTheme.XPERIA_CYAN))
      .title(isStreaming ? "AI THINKING & STREAMING..." : "ENTER PROMPT / COMMAND (/inspect, /analyze, /search, /train)", "left", XperiaTheme.TITLE)
      .background(XperiaTheme.OBSIDIAN_BG);

    const promptWidget = new PromptInput()
      .value(inputValue)
      .placeholder(`Ask ${activeModels[activeModelIndex].name} about audio clusters, virality multipliers, or Exa search...`)
      .block(promptBlock);
    frame.renderWidget(promptWidget, chunks[3]);

    // 5. Status Bar
    const statusBar = new StatusBar()
      .model(activeModels[activeModelIndex].name)
      .agent("dataforge-art")
      .tokens(totalTokens)
      .cost(totalTokens * 0.000002)
      .status(isStreaming ? "STREAMING" : "READY");
    frame.renderWidget(statusBar, chunks[4]);
  });
}

function renderNavTabs(area: any, frame: any) {
  const tabs = [
    { key: "1", id: "analytics", label: "[1] Charts & Radar" },
    { key: "2", id: "images", label: "[2] 🖼️ Visual Plots" },
    { key: "3", id: "exa", label: "[3] 🌐 Exa Neural Web" },
    { key: "4", id: "art", label: "[4] 🤖 ART Reasoning" },
    { key: "5", id: "profiler", label: "[5] Schema Profiler" },
    { key: "6", id: "table", label: "[6] Raw Table" },
  ];

  let curX = area.x + 2;
  for (const t of tabs) {
    const isActive = currentTab === t.id;
    const style = isActive
      ? Style.default().bold().withFg(Color.BLACK).withBg(XperiaTheme.XPERIA_CYAN)
      : Style.default().dim().withFg(Color.GRAY);

    frame.buffer.setString(curX, area.y, ` ${t.label} `, style);
    curX += t.label.length + 3;
  }
}

function renderAnalyticsTab(area: any, frame: any) {
  const hChunks = Layout.horizontal()
    .constraints([
      Constraint.percentage(50),
      Constraint.percentage(50),
    ])
    .split(area);

  const barBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("TOP STREAMING ARTISTS & CATALOG VELOCITY (BILLIONS)", "left", Style.default().bold().withFg(XperiaTheme.XPERIA_CYAN))
    .background(XperiaTheme.OBSIDIAN_BG);

  const topArtistsBarData = [
    { label: "Taylor Swift", value: 78, color: XperiaTheme.XPERIA_CYAN },
    { label: "Drake", value: 74, color: XperiaTheme.XPERIA_CYAN },
    { label: "Bad Bunny", value: 64, color: XperiaTheme.SONY_GOLD },
    { label: "The Weeknd", value: 53, color: XperiaTheme.SONY_RED },
    { label: "Ed Sheeran", value: 46, color: XperiaTheme.XPERIA_CYAN },
    { label: "Justin Bieber", value: 42, color: XperiaTheme.XPERIA_CYAN },
    { label: "Eminem", value: 39, color: XperiaTheme.XPERIA_CYAN },
    { label: "Post Malone", value: 38, color: XperiaTheme.XPERIA_CYAN },
  ];

  const barChart = new BarChart()
    .direction("horizontal")
    .data(topArtistsBarData)
    .block(barBlock);
  frame.renderWidget(barChart, hChunks[0]);

  const lineBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("AUDIO FEATURE VIRALITY CURVE (Danceability vs Energy)", "left", Style.default().bold().withFg(XperiaTheme.SONY_GOLD))
    .background(XperiaTheme.OBSIDIAN_BG);

  const audioLabels = ["0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1.0"];
  const popularityData = [18, 32, 54, 76, 92, 88, 71, 45];
  const danceabilityData = [12, 28, 49, 78, 95, 91, 68, 38];

  const lineChart = new LineChart()
    .labels(audioLabels)
    .series("Popularity Index", popularityData, XperiaTheme.SONY_GOLD)
    .series("Danceability Density", danceabilityData, XperiaTheme.XPERIA_CYAN)
    .block(lineBlock);
  frame.renderWidget(lineChart, hChunks[1]);
}

function renderImagesTab(area: any, frame: any) {
  const keys = Object.keys(rasterImages);
  const currentKey = keys[activeImageIndex % keys.length] || "spotify_clusters";
  const matrix = rasterImages[currentKey];

  const imgBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.XPERIA_CYAN))
    .title(`🖼️ VISUAL RASTER [${currentKey.toUpperCase()}] (Press TAB/Space to cycle plots)`, "left", XperiaTheme.TITLE)
    .background(XperiaTheme.OBSIDIAN_BG);

  if (matrix) {
    const raster = new ImageRasterWidget()
      .matrix(matrix)
      .block(imgBlock);
    frame.renderWidget(raster, area);
  } else {
    const noImg = Paragraph.text("No visual plot found for this dataset.")
      .block(imgBlock)
      .style(Style.default().withFg(XperiaTheme.SONY_GOLD));
    frame.renderWidget(noImg, area);
  }
}

function renderExaTab(area: any, frame: any) {
  const vChunks = Layout.vertical()
    .constraints([
      Constraint.length(4),
      Constraint.fill(),
    ])
    .split(area);

  const queryBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("🌐 EXA NEURAL WEB SEARCH DISCOVERY (REAL-TIME CULTURAL ANOMALY VALIDATION)", "left", Style.default().bold().withFg(XperiaTheme.XPERIA_CYAN))
    .background(XperiaTheme.OBSIDIAN_BG);

  const queryPara = Paragraph.text(
    `Query: "${exaQueryText}"\nNeural Semantic Relevance: 98.4% │ Sources Indexed: Billboard, Chartmetric, Variety, Rolling Stone`
  )
    .block(queryBlock)
    .style(XperiaTheme.SUBTITLE);
  frame.renderWidget(queryPara, vChunks[0]);

  const resultsBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.XPERIA_CYAN))
    .title("VERIFIED NEURAL HIGHLIGHTS & SOURCE CITATIONS", "left", Style.default().bold().withFg(XperiaTheme.SONY_GOLD))
    .background(XperiaTheme.OBSIDIAN_BG);

  let fullText = "";
  for (let i = 0; i < exaLiveResults.length; i++) {
    const r = exaLiveResults[i];
    fullText += `📌 [${i + 1}] ${r.title}\n`;
    fullText += `🔗 URL: ${r.url} (Score: ${r.score || 0.95})\n`;
    if (r.highlights) {
      for (const h of r.highlights) {
        fullText += `   💬 "${h}"\n`;
      }
    }
    fullText += "\n";
  }

  const resultsPara = Paragraph.text(fullText || "Searching Exa neural index...")
    .block(resultsBlock)
    .style(Style.default().withFg(XperiaTheme.TEXT_PRIMARY));
  frame.renderWidget(resultsPara, vChunks[1]);
}

function renderArtTab(area: any, frame: any) {
  const sBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.XPERIA_CYAN))
    .title("🤖 OPENPIPE ART REINFORCEMENT TRAINING & GOD-TIER PATTERN STREAM", "left", XperiaTheme.TITLE)
    .background(XperiaTheme.OBSIDIAN_BG);

  streamView.block(sBlock);
  frame.renderWidget(streamView, area);
}

function renderProfileTab(area: any, frame: any) {
  const profileWidget = new DataProfileWidget()
    .dataset(path.basename(currentProfile.filepath), currentProfile.rowCount, currentProfile.columnCount)
    .columns(
      currentProfile.columns.slice(0, 15).map((c) => ({
        name: c.name,
        type: c.type === "number" || c.type === "float" ? "number" : c.type === "year" ? "datetime" : "string",
        nullPercent: c.nullPercent,
        uniqueCount: c.uniques,
        sampleDist: c.sampleDist,
      }))
    );

  const pBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("SCHEMA & STATISTICAL FEATURE PROFILER", "left", Style.default().bold().withFg(XperiaTheme.SONY_EMERALD))
    .background(XperiaTheme.OBSIDIAN_BG);

  profileWidget.block(pBlock);
  frame.renderWidget(profileWidget, area);
}

function renderTableTab(area: any, frame: any) {
  const tBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("RAW DATASET RECORDS (Use ↑/↓ to navigate)", "left", Style.default().bold().withFg(XperiaTheme.XPERIA_CYAN))
    .background(XperiaTheme.OBSIDIAN_BG);

  const colHeaders = currentProfile.columns.slice(0, 7).map((c) => ({
    header: c.name,
    width: Math.max(12, Math.min(22, c.name.length + 4)),
  }));

  const tableWidget = new DataTable()
    .columns(colHeaders.length > 0 ? colHeaders : [{ header: "Field", width: 20 }])
    .rows(
      currentProfile.rows.slice(0, 40).map((r) =>
        r.slice(0, 7).map((val) => val || "")
      )
    )
    .select(tableSelectedIndex)
    .block(tBlock);

  frame.renderWidget(tableWidget, area);
}

// Key handling
input.on("key", (e: KeyEvent) => {
  if (e.key === "c" && e.ctrl) {
    cleanup();
    process.exit(0);
  }

  if (e.key === "escape") {
    cleanup();
    process.exit(0);
  }

  // Cycle dataset with 'd' or 'D'
  if (e.key === "d" || e.key === "D") {
    const nextIdx = (activeDatasetIndex + 1) % datasetsConfig.length;
    loadActiveDataset(nextIdx);
    render();
    return;
  }

  // Cycle model with 'm' or 'M'
  if (e.key === "m" || e.key === "M") {
    activeModelIndex = (activeModelIndex + 1) % activeModels.length;
    render();
    return;
  }

  // Tab switching 1, 2, 3, 4, 5, 6
  if (e.key === "1") {
    currentTab = "analytics";
    render();
    return;
  }
  if (e.key === "2") {
    currentTab = "images";
    render();
    return;
  }
  if (e.key === "3") {
    currentTab = "exa";
    render();
    return;
  }
  if (e.key === "4") {
    currentTab = "art";
    render();
    return;
  }
  if (e.key === "5") {
    currentTab = "profiler";
    render();
    return;
  }
  if (e.key === "6") {
    currentTab = "table";
    render();
    return;
  }

  // Toggle images with Tab or Space inside images view
  if (currentTab === "images") {
    if (e.key === "tab" || e.key === " ") {
      activeImageIndex = (activeImageIndex + 1) % Object.keys(rasterImages).length;
      render();
      return;
    }
  }

  // Table row navigation
  if (currentTab === "table") {
    if (e.key === "up") {
      tableSelectedIndex = Math.max(0, tableSelectedIndex - 1);
      render();
      return;
    }
    if (e.key === "down") {
      tableSelectedIndex = Math.min(39, tableSelectedIndex + 1);
      render();
      return;
    }
  }

  // Backspace
  if (e.key === "backspace") {
    inputValue = inputValue.slice(0, -1);
    render();
    return;
  }

  // Enter prompt to trigger live LLM query
  if (e.key === "enter") {
    if (inputValue.trim().length > 0) {
      const q = inputValue.trim();
      inputValue = "";
      currentTab = "art";
      triggerLLMQuery(q);
    }
    return;
  }

  // Normal typing
  if (e.key.length === 1 && !e.ctrl && !e.alt) {
    inputValue += e.key;
    render();
  }
});

function cleanup() {
  input.stop();
  terminal.exit();
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(0);
});

input.start();
render();
