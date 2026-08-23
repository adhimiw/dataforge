use crate::governance::{policy_report, AutonomyBudget};
use crate::{Result, MODEL_LABEL, PRODUCT, PROVIDER_LABEL, RUNTIME_LABEL};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GovernanceState {
    pub data_classification: String,
    pub external_research: String,
    pub external_enrichment: String,
    pub raw_data_externalization: String,
}

impl Default for GovernanceState {
    fn default() -> Self {
        Self {
            data_classification: "unknown".to_string(),
            external_research: "approval_required".to_string(),
            external_enrichment: "approval_required".to_string(),
            raw_data_externalization: "forbidden".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResearchState {
    pub approval: String,
    #[serde(default)]
    pub sources: Vec<Value>,
}

impl Default for ResearchState {
    fn default() -> Self {
        Self {
            approval: "not_requested".to_string(),
            sources: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnrichmentState {
    pub status: String,
    pub approved: bool,
}

impl Default for EnrichmentState {
    fn default() -> Self {
        Self {
            status: "not_started".to_string(),
            approved: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisConsoleState {
    pub manifest: String,
    pub safe_rows_only: bool,
}

impl Default for AnalysisConsoleState {
    fn default() -> Self {
        Self {
            manifest: ".dataforge/analysis-console.json".to_string(),
            safe_rows_only: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkspaceState {
    pub status: String,
    #[serde(default)]
    pub workspace: Option<String>,
    #[serde(default)]
    pub last_run: Option<String>,
    #[serde(default)]
    pub artifacts: Vec<String>,
    #[serde(default)]
    pub checks: Vec<String>,
    #[serde(default)]
    pub governance: GovernanceState,
    #[serde(default)]
    pub datasets: Vec<Value>,
    #[serde(default)]
    pub research: ResearchState,
    #[serde(default)]
    pub hypotheses: Vec<Value>,
    #[serde(default)]
    pub enrichment: EnrichmentState,
    #[serde(default)]
    pub autonomy: AutonomyBudget,
    #[serde(default)]
    pub analysis_console: AnalysisConsoleState,
}

impl Default for WorkspaceState {
    fn default() -> Self {
        Self {
            status: "initialized".to_string(),
            workspace: None,
            last_run: None,
            artifacts: Vec::new(),
            checks: Vec::new(),
            governance: GovernanceState::default(),
            datasets: Vec::new(),
            research: ResearchState::default(),
            hypotheses: Vec::new(),
            enrichment: EnrichmentState::default(),
            autonomy: AutonomyBudget::default(),
            analysis_console: AnalysisConsoleState::default(),
        }
    }
}

pub struct Workspace {
    pub root: PathBuf,
}

impl Workspace {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn dataforge_dir(&self) -> PathBuf {
        self.root.join(".dataforge")
    }

    pub fn state_path(&self) -> PathBuf {
        self.dataforge_dir().join("state.json")
    }

    pub fn manifest_path(&self) -> PathBuf {
        self.dataforge_dir().join("analysis-console.json")
    }

    pub fn initialize(&self) -> Result<Vec<String>> {
        let directory = self.dataforge_dir();
        for child in ["notebooks", "reports", "runs", "research", "scripts"] {
            fs::create_dir_all(directory.join(child))?;
        }
        let mut output = Vec::new();
        if !self.state_path().exists() {
            let state = serde_json::to_string_pretty(&WorkspaceState::default())? + "\n";
            fs::write(self.state_path(), state)?;
            output.push("created .dataforge/state.json".to_string());
        } else {
            output.push("kept .dataforge/state.json".to_string());
        }
        let instructions = self.root.join("AGENTS.md");
        if !instructions.exists() {
            fs::write(instructions, agent_instructions())?;
            output.push("created AGENTS.md".to_string());
        } else {
            output.push("kept AGENTS.md".to_string());
        }
        Ok(output)
    }

    pub fn read_state(&self) -> Result<WorkspaceState> {
        let raw = fs::read_to_string(self.state_path())?;
        Ok(serde_json::from_str(&raw)?)
    }

    pub fn write_state(&self, state: &WorkspaceState) -> Result<()> {
        let raw = serde_json::to_string_pretty(state)? + "\n";
        fs::write(self.state_path(), raw)?;
        Ok(())
    }

    pub fn doctor(&self) -> Value {
        let state = self.read_state();
        match state {
            Ok(state) => json!({
                "product": PRODUCT,
                "runtime": RUNTIME_LABEL,
                "model": MODEL_LABEL,
                "provider": PROVIDER_LABEL,
                "workspace": self.root,
                "credential": if std::env::var("OPENCODE_API_KEY").is_ok() { "present" } else { "missing" },
                "state": "ready",
                "state_error": Value::Null,
                "governance": state.governance,
                "research": state.research,
                "autonomy": state.autonomy,
            }),
            Err(error) => json!({
                "product": PRODUCT,
                "runtime": RUNTIME_LABEL,
                "workspace": self.root,
                "credential": if std::env::var("OPENCODE_API_KEY").is_ok() { "present" } else { "missing" },
                "state": "unreadable",
                "state_error": error.to_string(),
                "governance": "missing",
                "research": "missing",
                "autonomy": { "status": "legacy_missing", "defaults": policy_report() },
            }),
        }
    }
}

pub fn research_brief(workspace: &Path) -> Value {
    json!({
        "product": PRODUCT,
        "workspace": workspace,
        "status": "approval_required",
        "allowed_query_inputs": ["user-provided public subject", "non-sensitive schema concepts"],
        "prohibited_query_inputs": ["raw values", "identifiers", "private URLs", "proprietary labels", "secrets"],
        "required_source_ledger": ["url", "publisher", "access date", "query rationale", "claim", "relevance", "limitations"],
        "next_step": "Request explicit approval before any external lookup."
    })
}

fn agent_instructions() -> &'static str {
    "# DataForge workspace instructions\n\nDataForge follows a governed workflow. Classify data before analysis, treat unknown data as restricted, and prefer local summaries over raw-data disclosure. External research, downloads, joins, credential use, data mutation, destructive actions, database writes, model training, label generation, publication, and out-of-workspace access require explicit approval. Bounded autonomy is limited to local inspection, aggregate profiling, reproducible artifact generation, and verification within the configured budgets. Never bypass permissions, safeguards, rate limits, approvals, or review controls.\n"
}
