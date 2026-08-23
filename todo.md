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
