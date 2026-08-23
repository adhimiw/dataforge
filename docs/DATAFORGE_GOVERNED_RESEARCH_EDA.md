# DataForge Governed Research and EDA Design

DataForge will treat **exploratory data analysis, public-context research, enrichment, and model preparation as separate, reviewable stages**. The system will produce evidence and hypotheses; it will not silently expose raw records, mutate a source dataset, or claim that an inferred relationship is a fact.

| Stage                              | Default behavior                                                                                                                                                         | Approval boundary                                                                                                                  | Durable output                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Classify and profile**           | Inspect paths, schemas, aggregate quality measures, safe samples, duplicates, distributions, and likely time or target fields locally.                                   | Required before reading unknown or restricted record content beyond the least disclosure needed.                                   | Profile summary, column metrics, redaction decision, chart manifest.                   |
| **Research the dataset context**   | Form a public research brief from the user-provided subject plus non-sensitive schema-level concepts. Search reputable primary or domain sources and capture provenance. | Required before any web search or fetch. Never use direct identifiers, raw values, private URLs, or proprietary labels in a query. | Research brief, query rationale, source ledger, cited claims.                          |
| **Discover patterns**              | Compare local aggregate findings against the approved external context, then record falsifiable hypotheses and confounders.                                              | Required before proposing an external join or using a derived feature for decisions.                                               | Hypothesis ledger with evidence, status, and verification plan.                        |
| **Prepare enrichment or training** | Generate a reversible, reproducible enrichment or feature-engineering plan. Keep source data immutable.                                                                  | Required before downloading, joining, writing, training, or publishing.                                                            | Approved join plan, transformation script or notebook, validation checks.              |
| **Verify and report**              | Execute the narrowest relevant checks, inspect output for sensitive material, and state limitations.                                                                     | Required before external distribution or production use.                                                                           | Executed notebook, report, chart files, terminal-raster manifest, verification record. |

## Public-research guardrails

External research is a **consent-gated capability**, not an automatic tool call. The agent must ask for consent if material is unknown or restricted, or if an external source, enrichment, or outbound query could create a data boundary crossing. It may only form a query from a public dataset description supplied by the user and a redacted, schema-level topic. Each source needs a URL, access date, publisher, claim summary, relevance note, and a distinction between reported fact and DataForge’s own hypothesis.

The word “train” in the user experience means **prepare an auditable training or enrichment plan**. It does not authorize model training, label generation, data synthesis, record mutation, or external joins. Those actions remain separate approval gates. Public research must not be used to infer sensitive attributes about people or to make consequential claims without a documented validation method.

## DataForge analysis console

The interactive console is branded only as **DataForge**. It does not expose upstream implementation or provider identifiers in public labels, help text, prompts, terminal titles, status screens, or navigation.

| Key     | Console view        | Purpose                                                                                                                                   |
| ------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `1`     | **Terminal Charts** | Side-by-side line and bar charts derived from aggregate analysis data.                                                                    |
| `2`     | **Plot Raster**     | Real Python-generated plot artifacts rendered as a terminal half-block raster; `Tab` or `Space` toggles figure artifacts.                 |
| `3`     | **Data Profiler**   | Column types, null percentages, distinct counts, range summaries, and compact distribution sparklines.                                    |
| `4`     | **Analysis Stream** | A clear live analysis status and evidence stream, separated into plan, tool, observation, interpretation, and verification events.        |
| `5`     | **Raw Records**     | A redaction-aware, scrollable local preview; `Up` and `Down` move through safe rows only.                                                 |
| `Enter` | **Ask DataForge**   | Places an analysis question into the prompt input; the agent begins with the current view’s context and must maintain all approval gates. |

The console should show unavailable data explicitly rather than fabricate output. It accepts an analysis manifest generated from an executed script or notebook. A plot is only labeled “rendered” when a real artifact and terminal-raster payload are present; otherwise the UI presents a missing-artifact state with the corrective command.

The local `dataforge workspace rasterize <plot.png> <workspace>` command creates that payload. It writes a Python utility under `.dataforge/scripts/rasterize.py`; when Pillow is available in the approved local analysis environment, it converts a real PNG into paired foreground/background color cells rendered with Unicode `▀` blocks. The source image is read locally and never uploaded. This command only creates a display manifest; it does not alter the source dataset or claim that the chart has been validated.

## Durable state contract

`.dataforge/state.json` remains metadata-only. The update adds a `governance`, `datasets`, `research`, `hypotheses`, `enrichment`, and `analysis_console` envelope. The state may contain aggregate counts, artifact paths, safe display labels, hashes, commands, approvals, source URLs, and verification results. It must never store a secret, raw restricted row, direct identifier, unredacted exception payload, downloaded external dataset, or image payload.

## Bounded autonomous execution

DataForge can work autonomously only inside a **bounded local execution contract**. A bounded run starts with a stated goal, expected artifacts, explicit model-turn and tool-call budgets, checkpoints, and stop conditions. It may continue through low-risk local inspection, aggregate profiling, reproducible local artifact generation, and verification. It must stop and request approval for external research, downloads, joins, credential use, data mutation, destructive actions, database writes, training or label generation, publication, and out-of-workspace access.

The default policy sets 8 model turns and 12 tool calls, checkpoints after each material artifact or failed verification, and returns a written evidence-and-next-step report when a budget is exhausted. It does not bypass permissions, safeguards, rate limits, approvals, or review controls. Operators can review the contract with `dataforge workspace autonomy .`; new workspaces persist it in local state, while existing state is surfaced as `legacy_missing` rather than silently altered.

## Reference-informed implementation choices

The design applies the reusable ideas found in the referenced projects without copying their prompts, names, or product interfaces: **durable and reviewable harness state, bounded autonomy, explicit verification, rollback-friendly refinement, specialist roles, and clear trust boundaries**. The Prime Agent documentation is used for its persistent-state and evidence-backed refinement concepts, while SWE-agent reinforces tool-mediated, configuration-driven automation. Curated agent lists are treated as discovery indexes, not as implementation specifications. [1] [2] [3] [4] [5]

## References

[1]: https://github.com/PrimeIntellect-ai/prime-agent "Prime Agent"
[2]: https://github.com/SWE-agent/SWE-agent "SWE-agent"
[3]: https://github.com/kyrolabs/awesome-agents "Awesome Agents"
[4]: https://github.com/e2b-dev/awesome-ai-agents "Awesome AI Agents"
[5]: https://github.com/caramaschiHG/awesome-ai-agents-2026 "Awesome AI Agents 2026"
