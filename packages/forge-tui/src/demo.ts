import { Terminal } from "./core/terminal";
import { InputParser, KeyEvent } from "./core/input";
import { Layout } from "./layout/layout";
import { Constraint } from "./layout/constraint";
import { Block } from "./widgets/block";
import { Paragraph } from "./widgets/paragraph";
import { StreamView } from "./widgets/stream-view";
import { DataTable } from "./widgets/data-table";
import { DataProfileWidget } from "./widgets/data-profile";
import { PromptInput } from "./widgets/prompt-input";
import { StatusBar } from "./widgets/status-bar";
import { Color } from "./style/color";
import { Style } from "./core/cell";

const terminal = new Terminal().enter();
const input = new InputParser();

let inputValue = "";
let tokens: string[] = [];
let thoughts: string[] = [];
let isThinking = true;
let totalTokens = 0;
let tableSelectedIndex = 0;
let activeTab: "stream" | "profile" = "stream";

const streamView = new StreamView();
const profileWidget = new DataProfileWidget()
  .dataset("customer_churn_q3.parquet", 125480, 8)
  .columns([
    { name: "customer_id", type: "string", nullPercent: 0.0, uniqueCount: 125480, sampleDist: [2, 5, 8, 3, 7, 9, 4, 6] },
    { name: "age", type: "number", nullPercent: 1.2, uniqueCount: 78, sampleDist: [1, 3, 7, 9, 8, 6, 4, 2] },
    { name: "monthly_spend", type: "float", nullPercent: 0.0, uniqueCount: 4320, sampleDist: [8, 6, 5, 4, 3, 2, 1, 1] },
    { name: "support_tickets", type: "number", nullPercent: 0.0, uniqueCount: 14, sampleDist: [9, 7, 4, 2, 1, 0, 0, 0] },
    { name: "churned", type: "boolean", nullPercent: 0.0, uniqueCount: 2, sampleDist: [8, 2, 0, 0, 0, 0, 0, 0] },
    { name: "last_login", type: "datetime", nullPercent: 4.8, uniqueCount: 18200, sampleDist: [3, 4, 6, 7, 8, 9, 8, 9] },
  ]);

const sampleTokens = [
  "I ", "have ", "completed ", "the ", "preliminary ", "inspection ", "of ", "`customer_churn_q3.parquet`.\n\n",
  "### Key Findings:\n",
  "- **High Churn Correlation**: `support_tickets >= 3` shows a **64.2%** probability of churn within 30 days.\n",
  "- **Data Quality**: 1.2% missing values in `age` and 4.8% in `last_login`.\n",
  "- **Recommendation**: Impute `age` using median and run a Random Forest feature importance analysis.\n\n",
  "Would you like me to generate a reproducible Jupyter notebook under `.dataforge/notebooks/churn_model.ipynb`? (Type `/notebook`)"
];

const sampleThoughts = [
  "1. Loading schema from parquet metadata.\n",
  "2. Computing null distributions and column statistics.\n",
  "3. Identifying target variable: 'churned'.\n",
  "4. Structuring compact summary to preserve context budget.\n"
];

// Simulate initial thought streaming
let thoughtIdx = 0;
const thoughtTimer = setInterval(() => {
  if (thoughtIdx < sampleThoughts.length) {
    streamView.addThinking(sampleThoughts[thoughtIdx]);
    totalTokens += 15;
    thoughtIdx++;
    render();
  } else {
    clearInterval(thoughtTimer);
    streamView.setThinkingState(false);
    startTokenStream();
  }
}, 300);

function startTokenStream() {
  let tokenIdx = 0;
  const tokenTimer = setInterval(() => {
    if (tokenIdx < sampleTokens.length) {
      streamView.addToken(sampleTokens[tokenIdx]);
      totalTokens += 4;
      tokenIdx++;
      render();
    } else {
      clearInterval(tokenTimer);
    }
  }, 100);
}

function render() {
  terminal.draw((frame) => {
    const size = frame.size;

    // Split main vertical layout: Header (3), Main Body (Fill), Prompt (3), Status (1)
    const mainChunks = Layout.vertical()
      .constraints([
        Constraint.length(3),  // Header
        Constraint.fill(),       // Main Content
        Constraint.length(3),  // Prompt input
        Constraint.length(1),  // Status Bar
      ])
      .split(size);

    // 1. Header
    const headerBlock = new Block()
      .border("rounded", Style.default().withFg(Color.FORGE_BORDER))
      .title("DATAFORGE IMMEDIATE-MODE TUI", "center", Style.default().bold().withFg(Color.FORGE_CYAN))
      .background(Color.FORGE_BG);
    
    const headerPara = Paragraph.text("⚡ Direct Zero-Dependency Terminal Engine │ Instant 60 FPS Diff Renderer │ Pure Immediate Mode")
      .block(headerBlock)
      .style(Style.default().dim().withFg(Color.GRAY));
    frame.renderWidget(headerPara, mainChunks[0]);

    // 2. Main Content (Horizontal split: Left Profiler / Right Stream)
    const bodyChunks = Layout.horizontal()
      .constraints([
        Constraint.percentage(45), // Left: Data Profiler & Samples
        Constraint.percentage(55), // Right: LLM Streaming & Reasoning
      ])
      .split(mainChunks[1]);

    // Left Panel: Profiler on top, Table on bottom
    const leftChunks = Layout.vertical()
      .constraints([
        Constraint.percentage(55),
        Constraint.percentage(45),
      ])
      .split(bodyChunks[0]);

    const profileBlock = new Block()
      .border("rounded", Style.default().withFg(Color.FORGE_BORDER))
      .title("DATASET PROFILER", "left", Style.default().bold().withFg(Color.FORGE_EMERALD))
      .background(Color.FORGE_BG);
    profileWidget.block(profileBlock);
    frame.renderWidget(profileWidget, leftChunks[0]);

    const tableBlock = new Block()
      .border("rounded", Style.default().withFg(Color.FORGE_BORDER))
      .title("SAMPLE RECORDS (Use ↑/↓)", "left", Style.default().bold().withFg(Color.FORGE_CYAN))
      .background(Color.FORGE_BG);

    const dataTable = new DataTable()
      .columns([
        { header: "ID", width: 8 },
        { header: "Age", width: 5 },
        { header: "Spend ($)", width: 10 },
        { header: "Tickets", width: 8 },
        { header: "Churn", width: 6 },
      ])
      .rows([
        ["C-10021", 34, "124.50", 1, "No"],
        ["C-10022", 52, "480.00", 4, "YES"],
        ["C-10023", 28, "89.20", 0, "No"],
        ["C-10024", 41, "210.00", 3, "YES"],
        ["C-10025", 61, "340.50", 2, "No"],
      ])
      .select(tableSelectedIndex)
      .block(tableBlock);
    frame.renderWidget(dataTable, leftChunks[1]);

    // Right Panel: Stream View
    const streamBlock = new Block()
      .border("rounded", Style.default().withFg(Color.FORGE_BORDER))
      .title("AGENT STREAM & REASONING", "left", Style.default().bold().withFg(Color.FORGE_AMBER))
      .background(Color.FORGE_BG);
    streamView.block(streamBlock);
    frame.renderWidget(streamView, bodyChunks[1]);

    // 3. Prompt Input Box
    const promptBlock = new Block()
      .border("rounded", Style.default().withFg(Color.FORGE_CYAN))
      .title("INPUT PROMPT", "left", Style.default().bold().withFg(Color.FORGE_CYAN))
      .background(Color.FORGE_BG);
    
    const promptWidget = new PromptInput()
      .value(inputValue)
      .block(promptBlock);
    frame.renderWidget(promptWidget, mainChunks[2]);

    // 4. Status Bar
    const statusBar = new StatusBar()
      .model("opencode/big-pickle (Zen)")
      .agent("dataforge")
      .tokens(totalTokens)
      .cost(totalTokens * 0.000002)
      .status(isThinking ? "PROCESSING" : "READY");
    frame.renderWidget(statusBar, mainChunks[3]);
  });
}

// Input Listener
input.on("key", (e: KeyEvent) => {
  if (e.key === "c" && e.ctrl) {
    cleanup();
    process.exit(0);
  }

  if (e.key === "escape") {
    cleanup();
    process.exit(0);
  }

  if (e.key === "up") {
    tableSelectedIndex = Math.max(0, tableSelectedIndex - 1);
    render();
    return;
  }

  if (e.key === "down") {
    tableSelectedIndex = Math.min(4, tableSelectedIndex + 1);
    render();
    return;
  }

  if (e.key === "backspace") {
    inputValue = inputValue.slice(0, -1);
    render();
    return;
  }

  if (e.key === "enter") {
    if (inputValue.trim().length > 0) {
      streamView.addToken(`\n\n👤 **User**: ${inputValue}\n\n🤖 **DataForge**: Processing command \`${inputValue}\`...\n`);
      inputValue = "";
      totalTokens += 20;
      render();
    }
    return;
  }

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
