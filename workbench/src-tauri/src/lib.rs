//! Local-first DataForge Workbench domain state. The webview receives only
//! typed snapshots and can resolve a specific, single-use review receipt.
use serde::{Deserialize, Serialize};
use std::{
    fs,
    path::{Path, PathBuf},
};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("workspace path must not be empty")]
    EmptyWorkspace,
    #[error("approval does not exist")]
    MissingApproval,
    #[error("approval is no longer pending")]
    SettledApproval,
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
}
pub type Result<T> = std::result::Result<T, Error>;
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum RunStatus {
    AwaitingApproval,
    RunningLocal,
    Stopped,
}
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalStatus {
    Pending,
    Approved,
    Rejected,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    pub model_turn_limit: u8,
    pub tool_call_limit: u8,
    pub model_turns_used: u8,
    pub tool_calls_used: u8,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Approval {
    pub id: String,
    pub action: String,
    pub specialist: String,
    pub target_preview: String,
    pub rationale: String,
    pub expires_at: String,
    pub status: ApprovalStatus,
    pub scope: Vec<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Trace {
    pub id: String,
    pub at: String,
    pub category: String,
    pub title: String,
    pub detail: String,
    pub state: String,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkbenchSnapshot {
    pub run_id: String,
    pub workspace_label: String,
    pub question: String,
    pub classification: String,
    pub status: RunStatus,
    pub budget: Budget,
    pub approvals: Vec<Approval>,
    pub trace: Vec<Trace>,
    pub notices: Vec<String>,
}
impl WorkbenchSnapshot {
    pub fn demo() -> Self {
        Self { run_id:"DFW-0042".into(), workspace_label:"Local climate resilience study".into(), question:"Which data-quality limitations should be resolved before comparing historical hazard observations across sources?".into(), classification:"internal — aggregate review only".into(), status:RunStatus::AwaitingApproval, budget:Budget { model_turn_limit:8, tool_call_limit:12, model_turns_used:3, tool_calls_used:5 }, approvals:vec![Approval { id:"public-context".into(), action:"Public context research".into(), specialist:"Research planner".into(), target_preview:"Search public methodology and reporting guidance for: historical hazard observation completeness".into(), rationale:"Compare local aggregate findings with documented public reporting constraints.".into(), expires_at:"Expires in 18 minutes".into(), status:ApprovalStatus::Pending, scope:vec!["Public sources only".into(),"No raw records or identifiers".into(),"One research brief".into()] }], trace:vec![Trace { id:"1".into(), at:"10:12".into(), category:"PLAN".into(), title:"Run brief accepted".into(), detail:"Local-first assessment route selected.".into(), state:"verified".into() }], notices:vec!["Offline demo mode: no provider, network, or filesystem action is triggered from this screen.".into()] }
    }
    pub fn resolve(&mut self, approval_id: &str, approve: bool) -> Result<()> {
        let receipt = self
            .approvals
            .iter_mut()
            .find(|item| item.id == approval_id)
            .ok_or(Error::MissingApproval)?;
        if receipt.status != ApprovalStatus::Pending {
            return Err(Error::SettledApproval);
        }
        receipt.status = if approve {
            ApprovalStatus::Approved
        } else {
            ApprovalStatus::Rejected
        };
        self.status = if approve {
            RunStatus::RunningLocal
        } else {
            RunStatus::Stopped
        };
        self.trace.push(Trace { id:format!("review-{}",self.trace.len()+1), at:"now".into(), category:"REVIEW".into(), title:if approve{"Approval receipt recorded".into()}else{"Approval request rejected".into()}, detail:if approve{"Only the declared scope is recorded. External execution remains disabled in offline demo mode.".into()}else{"The same action and target cannot be requested again in this run.".into()}, state:if approve{"approved".into()}else{"denied".into()} });
        Ok(())
    }
    pub fn persist_to(&self, root: impl AsRef<Path>) -> Result<PathBuf> {
        if root.as_ref().as_os_str().is_empty() {
            return Err(Error::EmptyWorkspace);
        }
        let dir = root
            .as_ref()
            .join(".dataforge/workbench")
            .join(&self.run_id);
        fs::create_dir_all(&dir)?;
        let out = dir.join("snapshot.json");
        fs::write(&out, serde_json::to_vec_pretty(self)?)?;
        Ok(out)
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn approval_is_single_use() {
        let mut snapshot = WorkbenchSnapshot::demo();
        snapshot.resolve("public-context", false).unwrap();
        assert_eq!(snapshot.status, RunStatus::Stopped);
        assert!(snapshot.resolve("public-context", true).is_err());
    }
    #[test]
    fn snapshot_stays_under_dataforge_directory() {
        let root = std::env::temp_dir().join("dataforge-workbench-persist-test");
        let out = WorkbenchSnapshot::demo().persist_to(&root).unwrap();
        assert!(out.to_string_lossy().contains(".dataforge/workbench"));
        fs::remove_dir_all(root).unwrap();
    }
}
