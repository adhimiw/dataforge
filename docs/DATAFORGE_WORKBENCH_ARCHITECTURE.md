# DataForge Workbench Architecture

DataForge Workbench is a **local-first graphical research operations workspace** for a human data-engineering operator. It directs work through classify, profile, research-plan, evidence, verification, and delivery stages without becoming an unrestricted shell, copied third-party desktop client, or silent data-exfiltration mechanism.

| Layer               | Responsibility                                                                                        | Enforced boundary                                                                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React renderer      | Research Desk, Data Bench, Evidence Ledger, Review Queue, Run Trace, and Settings.                    | The renderer receives typed snapshots and resolves a specific review receipt. It cannot directly open files, call the shell, read secrets, or contact network targets. |
| Rust Workbench core | Persists local run state, budget, evidence, approvals, and trace entries.                             | Artifacts remain under a selected local `.dataforge/workbench/<run>/` directory.                                                                                       |
| Tauri desktop host  | Exposes `workbench_snapshot` and `resolve_approval`.                                                  | The host uses a narrow typed IPC boundary with no broad filesystem or HTTP plugin permission.                                                                          |
| DataForge services  | Existing local profiling, data quality, raster, research contract, and governed live-fusion services. | Any public research, connector use, join, mutation, training, writing, or publishing remains a separate approval-gated adapter.                                        |

## Specialist workflow

| Specialist         | Responsibility                                                     | Mandatory approval boundary                                          |
| ------------------ | ------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Data steward       | Classify material and profile safe aggregates.                     | Reveal restricted records, export, or mutate source data.            |
| Research planner   | Form a redacted public-source question.                            | Any outbound web search or fetch.                                    |
| Evidence collector | Capture approved receipts, hash, timestamps, and warnings.         | New source domains, unreviewed links, or publication.                |
| Data investigator  | Form falsifiable hypotheses from approved aggregates and receipts. | Causal assertions, ranking people, or consequential recommendations. |
| Verifier           | Check claim-to-source mapping and contradictions.                  | Marking unverified claims as confirmed.                              |
| Delivery engineer  | Produce a report or controlled export from verified artifacts.     | External send, training, production write, or publication.           |

Approvals are exact, expiring, and single-use. The same rejected action/target combination remains rejected in the current run; a bypass request is denied. The offline demo deliberately records an approval receipt without making an external request.

The architecture applies general coordination, durable-state, streaming-history, scoped-approval, and local-execution-boundary ideas identified in the user-supplied reconstructed reference. It does not copy product branding, UI assets, prompts, credentials, or execution behavior. Tauri’s documented webview-to-Rust trust boundary and explicit command scopes support the desktop boundary used here. [1] [2] [3]

## Validation contract

The Workbench must build its React renderer, compile the native Tauri host, pass strict Rust linting, persist run state only under `.dataforge/workbench`, and prove that review decisions are single-use. Visual validation checks the Research Desk, review card, explicit approval behavior, safe Data Bench preview, and Evidence Ledger receipt linkage.

## References

[1]: https://github.com/b-nnett/grok-bot-0.18-reconstructed "Reconstructed reference project"
[2]: https://v2.tauri.app/security/ "Tauri security and IPC trust boundaries"
[3]: https://v2.tauri.app/security/scope/ "Tauri command scopes"
