# DataForge Workbench

DataForge Workbench is a **local-first graphical research operations console** backed by Rust. It keeps the existing DataForge CLI and terminal interface intact while adding a human-in-the-loop desktop workspace for planning, evidence, review, and replay.

## What it does

| Surface             | Purpose                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Research Desk**   | Displays the current research brief, work graph, budget, active specialist, and data-boundary status.                       |
| **Data Bench**      | Shows local aggregate profiling, quality gates, safe previews, and lineage-oriented analysis artifacts.                     |
| **Evidence Ledger** | Keeps claims attached to source receipts, captured timestamps, integrity digests, verification states, and redaction notes. |
| **Review Queue**    | Presents expiring, scope-bound approvals with a targeted allow or reject decision.                                          |
| **Run Trace**       | Provides a local chronological record of plans, tools, checks, review decisions, and verification events.                   |
| **Settings**        | Explains the desktop trust boundary and local default policy without rendering provider secrets.                            |

The initial screen is a deterministic, offline demo. It intentionally does not call a model, browse the web, open a dataset, access a credential, write outside a selected workspace, or poll in the background. Packaging enables the same typed Rust command boundary used by the Workbench core.

## Local development

The browser demo is useful for developing the React renderer:

```bash
cd workbench
pnpm install
pnpm dev
```

The Rust core and desktop host can be validated independently:

```bash
cd workbench/src-tauri
cargo fmt --check
cargo clippy --features desktop -- -D warnings
cargo test --features desktop
cargo check --features desktop
```

To launch the native desktop host, use a Linux, macOS, or Windows environment with Tauri’s platform prerequisites installed. The Linux validation environment requires GTK 3, WebKitGTK 4.1, an application-indicator library, and librsvg development packages.

## Approval model

The renderer calls only `workbench_snapshot` and `resolve_approval`. The approval service records a single-use decision in the local run trace. An approval does not itself make an external request; future connectors must separately validate the approval scope, expiry, target allowlist, and DataForge governance rules before executing.

See [`../docs/DATAFORGE_WORKBENCH_ARCHITECTURE.md`](../docs/DATAFORGE_WORKBENCH_ARCHITECTURE.md) for the full design and [`../docs/DATAFORGE_WORKBENCH_VALIDATION.md`](../docs/DATAFORGE_WORKBENCH_VALIDATION.md) for test evidence.
