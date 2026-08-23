# Rust-native DataForge migration architecture

## Decision

The `rust-native-migration` branch introduces a standalone Rust application under `rust/`. It is the replacement target for the DataForge-owned runtime, workspace tooling, state model, governed commands, and terminal analysis console. The existing TypeScript/OpenCode-compatible code remains temporarily in the repository only to preserve existing users while parity is verified; the Rust binary does not embed, execute, or depend on the TypeScript runtime.

The first Rust delivery is intentionally a **complete governed DataForge application core**, not a false claim of full feature parity with every upstream provider, plugin, and remote integration. It owns the user-facing CLI and TUI, local state, analysis-manifest protocol, safe workspace commands, and bounded autonomy. Provider calls, web research, external integrations, plugin interoperability, and model execution are represented as explicit future adapters behind the same approval boundary.

## Architecture

```text
dataforge-rs binary
├── cli            typed command hierarchy and JSON/plain output
├── workspace      .dataforge initialization, state loading, diagnostics, safe artifacts
├── governance     action classification, approval gates, autonomy budgets, stop conditions
├── manifest       serde contract for aggregate charts, profiler, stream, safe rows, raster figures
├── analysis       local CSV inspection and aggregate manifest generation
├── tui            Ratatui event loop and five analysis views
└── adapters       future model, web-research, and integration boundaries (not enabled by default)
```

| TypeScript boundary                 | Rust-native replacement                     | Compatibility policy                                                                                                                                                                  |
| ----------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `branding.ts` and workflow commands | `cli` command enums and `governance` policy | Keeps the DataForge name, Big Pickle / DataForge Zen labels, and approval semantics. No internal provider identifier is exposed in the Rust UI.                                       |
| `workspace.ts`                      | `workspace` and `governance` modules        | Reads/writes the same `.dataforge/state.json` envelope additively; preserves legacy-state behavior.                                                                                   |
| `analysis-console.tsx`              | `tui` and `manifest` modules                | Reads the same `.dataforge/analysis-console.json` aggregate manifest and preserves views `1`–`5`, figure switching, safe row navigation, and the no-fabrication rule.                 |
| Python rasterizer helper            | Rust `rasterize` command                    | Converts a local PNG to the same true-color foreground/background half-block manifest. No upload occurs.                                                                              |
| Tool permissions                    | `Governance::authorize`                     | Denies or requests approval for external research, downloads, joins, credentials, mutation, destructive actions, database writes, training, publication, and out-of-workspace access. |

## Crate selection

| Crate                   | Responsibility                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| `clap`                  | Typed commands, arguments, and generated help.                                            |
| `serde` / `serde_json`  | Durable state and analysis-manifest serialization.                                        |
| `ratatui` / `crossterm` | Portable terminal rendering, input, layout, charts, tables, and event handling.           |
| `tokio`                 | Bounded asynchronous orchestration, subprocess management, cancellation, and time limits. |
| `csv`                   | Streaming local CSV profile and aggregate analysis without loading unbounded records.     |
| `image`                 | Local PNG decoding for true-color half-block rasterization.                               |
| `thiserror`             | Auditable typed failures rather than opaque panics.                                       |

## Governed action model

The Rust core has no unrestricted autonomous mode. A run has an `AutonomyBudget` with model-turn and tool-call limits, a durable checkpoint policy, and non-overridable stop conditions. Purely local inspection, aggregate profiling, artifact generation, and verification may proceed automatically within budget. Any action classified as `ApprovalRequired` returns a structured stop report; it never reaches an adapter without explicit approval.

```text
Local safe action → budget available → execute → checkpoint → verify → continue/report
Approval-required action → stop → emit reason and evidence → await explicit approval
Budget exhausted → stop → emit completed artifacts, risks, and safest next step
```

## Acceptance criteria

The initial branch is acceptable when `cargo fmt --check`, `cargo test`, and `cargo clippy -- -D warnings` pass; the binary can initialize and diagnose a workspace; it can profile a local CSV into a safe analysis manifest; it can rasterize a local PNG; its TUI can render all five views from a manifest; and its tests demonstrate that approval-required actions and bypass requests are denied. The code must not contain a supplied credential, raw test data, or an unrestricted bypass path.

## Implemented branch status

The `rust-native-migration` branch now includes the initial Rust-native core in `rust/`. `dataforge-rs` implements typed workspace commands, safe state initialization, doctor and research-contract output, bounded-autonomy policy output, a local streaming CSV profiler, local PNG rasterization, action-guard decisions, and the interactive Ratatui console. The console was manually launched against a local manifest created from the supplied TB CSV and rendered the DataForge charts view successfully.

```sh
cd rust
cargo fmt --check
cargo clippy -- -D warnings
cargo test
cargo build --release
./target/release/dataforge-rs --help
```

`dataforge-rust.yml` runs the same quality gate on pushes and pull requests affecting the Rust migration branch. The current release intentionally leaves provider execution, third-party-plugin parity, and externally connected research adapters as future approval-gated adapters; they are not silently replaced with placeholders or unrestricted execution.

## References

[1]: https://ratatui.rs/ "Ratatui"
[2]: https://tokio.rs/tokio/tutorial "Tokio tutorial"
[3]: https://docs.rs/clap/latest/clap/ "clap documentation"
[4]: https://github.com/ratatui/ratatui-image "ratatui-image"
