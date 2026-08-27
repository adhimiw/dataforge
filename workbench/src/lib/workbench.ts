export type ApprovalStatus = "pending" | "approved" | "rejected";
export type WorkStatus = "verified" | "blocked" | "queued";
export type Snapshot = {
  run_id: string;
  workspace_label: string;
  question: string;
  classification: string;
  status: "awaiting_approval" | "running_local" | "stopped";
  budget: { model_turn_limit: number; tool_call_limit: number; model_turns_used: number; tool_calls_used: number };
  work_items: Array<{ id: string; title: string; specialist: string; detail: string; status: WorkStatus; risk: string }>;
  evidence: Array<{ id: string; label: string; source: string; captured_at: string; digest: string; claim: string; verification: string; redaction_note: string }>;
  approvals: Array<{ id: string; action: string; specialist: string; target_preview: string; rationale: string; expires_at: string; status: ApprovalStatus; scope: string[] }>;
  trace: Array<{ id: string; at: string; category: string; title: string; detail: string; state: string }>;
  notices: string[];
};

export const demoSnapshot = (): Snapshot => ({
  run_id: "DFW-0042",
  workspace_label: "Local climate resilience study",
  question: "Which data-quality limitations should be resolved before comparing historical hazard observations across sources?",
  classification: "internal — aggregate review only",
  status: "awaiting_approval",
  budget: { model_turn_limit: 8, tool_call_limit: 12, model_turns_used: 3, tool_calls_used: 5 },
  work_items: [
    { id: "classify", title: "Classify local material", specialist: "Data steward", detail: "Safe fields and aggregate-only display policy recorded.", status: "verified", risk: "local" },
    { id: "profile", title: "Profile source quality", specialist: "Data steward", detail: "Nulls, ranges, units, and temporal coverage inspected locally.", status: "verified", risk: "local" },
    { id: "research", title: "Request public context", specialist: "Research planner", detail: "A redacted source question awaits operator review.", status: "blocked", risk: "review" },
    { id: "reconcile", title: "Reconcile observations", specialist: "Data investigator", detail: "Will compare only approved receipts and local aggregates.", status: "queued", risk: "guarded" },
    { id: "verify", title: "Verify claims", specialist: "Verifier", detail: "Contradictions and unverified claims remain visible in the ledger.", status: "queued", risk: "guarded" },
  ],
  evidence: [
    { id: "profile", label: "Local schema profile", source: "Selected workspace artifact", captured_at: "2026-08-27 10:14 local", digest: "5cca6ad2e9db46f1", claim: "Temporal coverage and measurement units require reconciliation before cross-source comparison.", verification: "Verified locally", redaction_note: "Aggregate metadata only; no source rows shown." },
    { id: "policy", label: "Unit compatibility rule", source: "DataForge governed fusion policy", captured_at: "2026-08-27 10:16 local", digest: "312e623ea1b6f205", claim: "Incompatible units cannot become a composite score without an approved method.", verification: "Policy guard active", redaction_note: "No external source fetched." },
  ],
  approvals: [{ id: "public-context", action: "Public context research", specialist: "Research planner", target_preview: "Search public methodology and reporting guidance for: historical hazard observation completeness", rationale: "Compare local aggregate data-quality findings with documented public reporting constraints.", expires_at: "Expires in 18 minutes", status: "pending", scope: ["Public sources only", "No raw records or identifiers", "One research brief"] }],
  trace: [
    { id: "1", at: "10:12", category: "PLAN", title: "Run brief accepted", detail: "Local-first assessment route selected.", state: "verified" },
    { id: "2", at: "10:14", category: "TOOL", title: "Schema profile completed", detail: "Aggregate metrics recorded in the local artifact ledger.", state: "verified" },
    { id: "3", at: "10:16", category: "CHECK", title: "Unit guard triggered", detail: "Composite scoring is unavailable for incompatible measurements.", state: "guarded" },
    { id: "4", at: "10:17", category: "REVIEW", title: "Public research held", detail: "No outbound request occurs unless the scoped review card is approved.", state: "pending" },
  ],
  notices: ["Offline demo mode: no provider, network, or filesystem action is triggered from this screen."],
});

type NativeWindow = Window & { __TAURI__?: { core?: { invoke?: <T>(command: string, payload?: Record<string, unknown>) => Promise<T> } } };
const native = <T>(command: string, payload?: Record<string, unknown>) => (window as NativeWindow).__TAURI__?.core?.invoke?.<T>(command, payload);

export const bridge = {
  native: () => Boolean((window as NativeWindow).__TAURI__),
  async load(): Promise<Snapshot> { return (await native<Snapshot>("workbench_snapshot")) ?? demoSnapshot(); },
  async resolve(snapshot: Snapshot, approvalId: string, approve: boolean): Promise<Snapshot> {
    const result = native<Snapshot>("resolve_approval", { approvalId, approve });
    if (result) return result;
    const status: ApprovalStatus = approve ? "approved" : "rejected";
    return {
      ...snapshot,
      status: approve ? "running_local" : "stopped",
      approvals: snapshot.approvals.map((item) => item.id === approvalId ? { ...item, status } : item),
      trace: [...snapshot.trace, { id: "local-resolution", at: "now", category: "REVIEW", title: approve ? "Demo approval recorded" : "Demo request rejected", detail: approve ? "Offline demo updated; no external action has run." : "The action and target remain blocked for this run.", state: approve ? "approved" : "denied" }],
    };
  },
};
