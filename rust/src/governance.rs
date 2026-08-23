use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    LocalInspect,
    AggregateProfile,
    LocalArtifact,
    Verify,
    ExternalResearch,
    ExternalDownloadOrJoin,
    CredentialUse,
    DataMutation,
    DestructiveOperation,
    DatabaseWrite,
    ModelTrainingOrLabelGeneration,
    Publication,
    OutOfWorkspaceAccess,
}

impl Action {
    pub fn label(self) -> &'static str {
        match self {
            Self::LocalInspect => "local_inspect",
            Self::AggregateProfile => "aggregate_profile",
            Self::LocalArtifact => "local_artifact",
            Self::Verify => "verify",
            Self::ExternalResearch => "external_research",
            Self::ExternalDownloadOrJoin => "external_download_or_join",
            Self::CredentialUse => "credential_use",
            Self::DataMutation => "data_mutation",
            Self::DestructiveOperation => "destructive_operation",
            Self::DatabaseWrite => "database_write",
            Self::ModelTrainingOrLabelGeneration => "model_training_or_label_generation",
            Self::Publication => "publication",
            Self::OutOfWorkspaceAccess => "out_of_workspace_access",
        }
    }

    pub fn is_local_safe(self) -> bool {
        matches!(
            self,
            Self::LocalInspect | Self::AggregateProfile | Self::LocalArtifact | Self::Verify
        )
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "decision", rename_all = "snake_case")]
pub enum Decision {
    Allowed { reason: String },
    ApprovalRequired { reason: String },
    Denied { reason: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutonomyBudget {
    pub mode: String,
    pub status: String,
    pub max_model_turns: u32,
    pub max_tool_calls: u32,
    #[serde(default)]
    pub model_turns: u32,
    #[serde(default)]
    pub tool_calls: u32,
    pub checkpoint_after: String,
    pub stop_on: Vec<String>,
}

impl Default for AutonomyBudget {
    fn default() -> Self {
        Self {
            mode: "bounded".to_string(),
            status: "idle".to_string(),
            max_model_turns: 8,
            max_tool_calls: 12,
            model_turns: 0,
            tool_calls: 0,
            checkpoint_after: "material_artifact_or_failed_verification".to_string(),
            stop_on: vec![
                "budget_exhausted".to_string(),
                "external_research".to_string(),
                "external_download_or_join".to_string(),
                "credential_use".to_string(),
                "data_mutation".to_string(),
                "destructive_operation".to_string(),
                "database_write".to_string(),
                "model_training_or_label_generation".to_string(),
                "publication".to_string(),
                "out_of_workspace_access".to_string(),
            ],
        }
    }
}

impl AutonomyBudget {
    pub fn exhausted(&self) -> bool {
        self.model_turns >= self.max_model_turns || self.tool_calls >= self.max_tool_calls
    }

    pub fn checkpoint(&mut self, model_turns: u32, tool_calls: u32) {
        self.model_turns = self.model_turns.saturating_add(model_turns);
        self.tool_calls = self.tool_calls.saturating_add(tool_calls);
        self.status = if self.exhausted() {
            "stopped"
        } else {
            "active"
        }
        .to_string();
    }
}

pub fn authorize(action: Action, bypass_requested: bool, budget: &AutonomyBudget) -> Decision {
    if bypass_requested {
        return Decision::Denied {
            reason:
                "DataForge never bypasses permissions, safeguards, rate limits, or review controls."
                    .to_string(),
        };
    }
    if budget.exhausted() {
        return Decision::ApprovalRequired {
            reason: "The bounded autonomy budget is exhausted; report evidence and await review."
                .to_string(),
        };
    }
    if action.is_local_safe() {
        return Decision::Allowed {
            reason: "Low-risk local action is within the bounded execution contract.".to_string(),
        };
    }
    Decision::ApprovalRequired {
        reason: format!(
            "{} requires explicit approval before execution.",
            action.label()
        ),
    }
}

pub fn policy_report() -> serde_json::Value {
    let budget = AutonomyBudget::default();
    serde_json::json!({
        "mode": budget.mode,
        "default_budgets": { "max_model_turns": budget.max_model_turns, "max_tool_calls": budget.max_tool_calls },
        "allowed_without_new_approval": ["local inspection", "aggregate profiling", "reproducible local artifact generation", "verification"],
        "mandatory_stop_conditions": budget.stop_on,
        "forbidden": ["permission bypass", "safeguard bypass", "rate-limit bypass", "unreviewed externalization"]
    })
}
