# DataForge governed EDA system update

- [x] Review current DataForge runtime, command, agent, and TUI extension points.
- [x] Research the referenced open-source agent projects for reusable architecture patterns; do not adopt external prompt instructions verbatim.
- [x] Specify a data-governed EDA and dataset-context research workflow, including provenance, approval, and privacy controls.
- [x] Implement user-facing DataForge branding that avoids exposing the internal provider identifier.
- [x] Add the requested terminal analysis views and keyboard interaction model.
- [x] Add or extend focused tests for safe research, analysis artifacts, and TUI contracts.
- [x] Update documentation and verify local checks before creating a release-ready commit.

## TB burden CSV validation and bounded autonomy

- [x] Inspect and classify the supplied TB burden CSV in a temporary local workspace.
- [x] Produce reproducible aggregate EDA, local plot artifacts, and a redaction-aware analysis-console manifest.
- [x] Add bounded autonomous-run controls with explicit budgets, checkpointing, stop conditions, and approval gates.
- [x] Add focused regression coverage and validate the full dataset workflow without externalizing the source records.
- [x] Document the dataset test results and bounded-autonomy behavior for review.

## Rust-native DataForge migration

- [x] Research the current TypeScript runtime, terminal UI, command, state, and integration boundaries alongside appropriate Rust crates and patterns.
- [x] Produce a migration architecture that defines the Rust application scope, compatibility policy, and governed action model.
- [x] Create a dedicated Rust migration branch and scaffold the Rust DataForge workspace.
- [x] Implement the governed workspace commands, bounded-autonomy contract, and terminal analysis console in Rust.
- [x] Test the Rust application with safe fixtures and document feature coverage, known gaps, and migration instructions.

## Multi-source real-time data-fusion challenge

- [x] Research public live-data sources and select a reproducible, high-value multi-source use case.
- [x] Define source contracts, provenance, staleness, reconciliation, and replay policies.
- [x] Implement Rust source adapters, bounded concurrency, source health records, and deterministic replay fixtures.
- [x] Add six hard test cases: schema drift, late data, conflicting revisions, rate limiting, missing intervals, and semantic/unit mismatch.
- [x] Validate the end-to-end fusion run against available public data without silently externalizing user data.
- [x] Document live-operation options, costs, test outcomes, and residual risks.

## Governed research-orchestrator and GUI upgrade

- [x] Inspect DataForge and the reconstructed Grok bot for reusable workflow, interface, and integration patterns without copying prompts or secrets.
- [x] Define a governed multi-agent research orchestration model, evidence contract, approval boundaries, and durable work-state design.
- [x] Select the local-first product delivery route with the user: a Rust-backed DataForge graphical workspace that keeps data and approvals on-device by default.
- [x] Build a dedicated upgrade branch with a DataForge graphical workspace while preserving existing local migration work.
- [x] Implement specialist research workflow management, provenance, review gates, and human-in-the-loop controls.
- [x] Test end-to-end research orchestration, GUI flows, and safety boundaries; document coverage and remaining integration work.
