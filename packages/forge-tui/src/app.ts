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
import path from "path";
import fs from "fs";

// Find TB_Burden_Country.csv
const possiblePaths = [
  "C:\\Users\\Admin\\Downloads\\TB_Burden_Country.csv",
  "/mnt/c/Users/Admin/Downloads/TB_Burden_Country.csv",
  "./TB_Burden_Country.csv",
];

let datasetPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[1];
let profile: DatasetProfile;

try {
  profile = CSVProfiler.profile(datasetPath, 5000);
} catch (e) {
  console.error("Failed to load dataset:", e);
  process.exit(1);
}

// Load Python Generated Raster Images
let trendImageMatrix: ImageMatrix | undefined;
let topCountriesImageMatrix: ImageMatrix | undefined;

try {
  const trendJsonPath = path.join(__dirname, "../artifacts/tb_global_trends.json");
  const topJsonPath = path.join(__dirname, "../artifacts/tb_top_countries.json");
  if (fs.existsSync(trendJsonPath)) {
    trendImageMatrix = JSON.parse(fs.readFileSync(trendJsonPath, "utf8"));
  }
  if (fs.existsSync(topJsonPath)) {
    topCountriesImageMatrix = JSON.parse(fs.readFileSync(topJsonPath, "utf8"));
  }
} catch {
  // Graceful fallback if not yet generated
}

const terminal = new Terminal().enter();
const input = new InputParser();
const zenClient = new ZenClient();

type ActiveTab = "analytics" | "profile" | "images" | "llm" | "table";
let currentTab: ActiveTab = "analytics";
let activeImageIndex = 0; // 0: Global Trends, 1: Top Countries
let inputValue = "";
let isStreaming = false;
let totalTokens = 0;
let tableSelectedIndex = 0;

const streamView = new StreamView();

// Prepare charts data
const mortalityYears = profile.yearlyTrends.map((t) => String(t.year));
const deathsData = profile.yearlyTrends.map((t) => t.deaths);
const incidenceData = profile.yearlyTrends.map((t) => t.incidence);

const topCountriesData = profile.topCountriesByMortality.map((c) => ({
  label: c.country,
  value: Math.round(c.deaths),
  color: XperiaTheme.XPERIA_CYAN,
}));

// Dataset Summary String for LLM
const datasetSummaryText = `
Dataset: WHO Global Tuberculosis Burden (TB_Burden_Country.csv)
Total Rows: ${profile.rowCount.toLocaleString()}
Total Columns: ${profile.columnCount}
Year Range: ${profile.yearlyTrends[0]?.year} - ${profile.yearlyTrends[profile.yearlyTrends.length - 1]?.year}
Top 5 Countries by Mortality:
${profile.topCountriesByMortality.slice(0, 5).map((c, i) => `${i + 1}. ${c.country}: ${Math.round(c.deaths).toLocaleString()} cumulative deaths`).join("\n")}
`;

// Initial prompt
triggerLLMQuery("Provide an executive epidemiological summary of global tuberculosis mortality trends and high-burden hotspots based on this dataset.");

function triggerLLMQuery(promptText: string) {
  if (isStreaming) return;
  isStreaming = true;
  streamView.setThinkingState(true);
  streamView.addToken(`\n\n👤 **User**: ${promptText}\n\n🤖 **DataForge Zen (big-pickle)**:\n`);
  render();

  zenClient.streamAnalysis(datasetSummaryText, promptText, {
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

function render() {
  terminal.draw((frame) => {
    const size = frame.size;

    // Layout: Header (3), Tabs (1), Main Body (Fill), Prompt (3), Status (1)
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
      .title("DATAFORGE │ SONY XPERIA SST IMM-TUI", "center", XperiaTheme.TITLE)
      .background(XperiaTheme.OBSIDIAN_BG);

    const headerPara = Paragraph.text(
      `📊 Dataset: TB_Burden_Country.csv (${profile.rowCount.toLocaleString()} records, 47 features) │ Matplotlib/Seaborn In-TUI Visual Engine`
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
    } else if (currentTab === "profile") {
      renderProfileTab(chunks[2], frame);
    } else if (currentTab === "llm") {
      renderLLMTab(chunks[2], frame);
    } else if (currentTab === "table") {
      renderTableTab(chunks[2], frame);
    }

    // 4. Prompt Input
    const promptBlock = new Block()
      .border("rounded", Style.default().withFg(isStreaming ? XperiaTheme.SONY_GOLD : XperiaTheme.XPERIA_CYAN))
      .title(isStreaming ? "AI THINKING & STREAMING..." : "ENTER PROMPT / COMMAND (/inspect, /analyze, /notebook)", "left", XperiaTheme.TITLE)
      .background(XperiaTheme.OBSIDIAN_BG);

    const promptWidget = new PromptInput()
      .value(inputValue)
      .placeholder("Ask a question about the TB dataset or type /analyze...")
      .block(promptBlock);
    frame.renderWidget(promptWidget, chunks[3]);

    // 5. Status Bar
    const statusBar = new StatusBar()
      .model("opencode/big-pickle (200k)")
      .agent("dataforge")
      .tokens(totalTokens)
      .cost(totalTokens * 0.000002)
      .status(isStreaming ? "STREAMING" : "READY");
    frame.renderWidget(statusBar, chunks[4]);
  });
}

function renderNavTabs(area: any, frame: any) {
  const tabs = [
    { key: "1", id: "analytics", label: "[1] Terminal Charts" },
    { key: "2", id: "images", label: "[2] 🖼️ Python Matplotlib Plots (In-TUI)" },
    { key: "3", id: "profile", label: "[3] Data Profiler" },
    { key: "4", id: "llm", label: "[4] Live LLM Reasoning" },
    { key: "5", id: "table", label: "[5] Raw Records" },
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
      Constraint.percentage(52), // Left: Global Trends Line Chart
      Constraint.percentage(48), // Right: Top Burdened Countries Bar Chart
    ])
    .split(area);

  // Line Chart
  const lineBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("GLOBAL TB INCIDENCE & DEATHS (1990-2013)", "left", Style.default().bold().withFg(XperiaTheme.XPERIA_CYAN))
    .background(XperiaTheme.OBSIDIAN_BG);

  const lineChart = new LineChart()
    .labels(mortalityYears)
    .series("Incidence", incidenceData, XperiaTheme.XPERIA_CYAN)
    .series("Deaths", deathsData, XperiaTheme.SONY_RED)
    .block(lineBlock);
  frame.renderWidget(lineChart, hChunks[0]);

  // Bar Chart
  const barBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("HIGHEST BURDEN COUNTRIES (CUMULATIVE DEATHS)", "left", Style.default().bold().withFg(XperiaTheme.SONY_GOLD))
    .background(XperiaTheme.OBSIDIAN_BG);

  const barChart = new BarChart()
    .direction("horizontal")
    .data(topCountriesData)
    .block(barBlock);
  frame.renderWidget(barChart, hChunks[1]);
}

function renderImagesTab(area: any, frame: any) {
  const selectedMatrix = activeImageIndex === 0 ? trendImageMatrix : topCountriesImageMatrix;
  const imageTitle = activeImageIndex === 0 
    ? "FIGURE 1: GLOBAL TB TRENDS (1990-2013) [Press TAB/Space to toggle Fig 2]" 
    : "FIGURE 2: TOP 8 BURDEN COUNTRIES (MORTALITY) [Press TAB/Space to toggle Fig 1]";

  const imgBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.XPERIA_CYAN))
    .title(`🖼️ ${imageTitle}`, "left", XperiaTheme.TITLE)
    .background(XperiaTheme.OBSIDIAN_BG);

  if (selectedMatrix) {
    const raster = new ImageRasterWidget()
      .matrix(selectedMatrix)
      .block(imgBlock);
    frame.renderWidget(raster, area);
  } else {
    const noImg = Paragraph.text("Generating Matplotlib charts... Please run 'python3 scripts/generate_plots.py'")
      .block(imgBlock)
      .style(Style.default().withFg(XperiaTheme.SONY_GOLD));
    frame.renderWidget(noImg, area);
  }
}

function renderProfileTab(area: any, frame: any) {
  const profileWidget = new DataProfileWidget()
    .dataset(path.basename(profile.filepath), profile.rowCount, profile.columnCount)
    .columns(
      profile.columns.slice(0, 15).map((c) => ({
        name: c.name,
        type: c.type === "number" || c.type === "float" ? "number" : c.type === "year" ? "datetime" : "string",
        nullPercent: c.nullPercent,
        uniqueCount: c.uniques,
        sampleDist: c.sampleDist,
      }))
    );

  const pBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("WHO TB DATASET FEATURE PROFILER", "left", Style.default().bold().withFg(XperiaTheme.SONY_EMERALD))
    .background(XperiaTheme.OBSIDIAN_BG);

  profileWidget.block(pBlock);
  frame.renderWidget(profileWidget, area);
}

function renderLLMTab(area: any, frame: any) {
  const sBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.XPERIA_CYAN))
    .title("LIVE OPENCODE-ZEN (BIG-PICKLE) STREAMING AGENT", "left", XperiaTheme.TITLE)
    .background(XperiaTheme.OBSIDIAN_BG);

  streamView.block(sBlock);
  frame.renderWidget(streamView, area);
}

function renderTableTab(area: any, frame: any) {
  const tBlock = new Block()
    .border("rounded", Style.default().withFg(XperiaTheme.BORDER_SUBTLE))
    .title("RAW DATASET RECORDS (Use ↑/↓ to navigate)", "left", Style.default().bold().withFg(XperiaTheme.XPERIA_CYAN))
    .background(XperiaTheme.OBSIDIAN_BG);

  const tableWidget = new DataTable()
    .columns([
      { header: "Country", width: 16 },
      { header: "ISO3", width: 6 },
      { header: "Year", width: 6 },
      { header: "Population", width: 12 },
      { header: "Prevalence/100k", width: 16 },
      { header: "TB Deaths", width: 12 },
      { header: "Incidence", width: 12 },
    ])
    .rows(
      profile.rows.slice(0, 40).map((r) => [
        r[0] || "",
        r[2] || "",
        r[5] || "",
        Number(r[6] || 0).toLocaleString(),
        r[7] || "",
        Number(r[17] || 0).toLocaleString(),
        Number(r[30] || 0).toLocaleString(),
      ])
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

  // Tab switching 1, 2, 3, 4, 5
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
    currentTab = "profile";
    render();
    return;
  }
  if (e.key === "4") {
    currentTab = "llm";
    render();
    return;
  }
  if (e.key === "5") {
    currentTab = "table";
    render();
    return;
  }

  // Toggle images with Tab or Space inside images view
  if (currentTab === "images") {
    if (e.key === "tab" || e.key === " ") {
      activeImageIndex = activeImageIndex === 0 ? 1 : 0;
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
      currentTab = "llm";
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
