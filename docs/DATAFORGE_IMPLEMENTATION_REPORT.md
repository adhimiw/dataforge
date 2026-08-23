# DataForge Fork: Detailed Implementation Report

**Status:** Implemented and locally verified
**Scope:** DataForge terminal fork, runtime defaults, task-agent behavior, workspace tooling, TUI identity, companion website, and repository runbook.

## Executive summary

DataForge is a focused fork of the OpenCode terminal runtime for reproducible data engineering and analysis. The implementation intentionally preserves compatible provider, session, tool, and local-runtime foundations while replacing the visible product identity and default operating behavior. The fork does not merely rename the binary: it adds a primary agent, a data-specific system prompt, explicit model-policy logic, workflow commands, deterministic workspace initialization, non-secret diagnostics, durable artifact conventions, and a matching technical companion website.

> **Design principle:** The system should inspect before it transforms, preserve evidence before it summarizes, and verify before it declares work complete.

## Fork boundary and compatibility strategy

DataForge remains compatible with the upstream Zen provider by retaining the internal provider ID `opencode`. This is a technical compatibility boundary rather than a public product name. The user-facing provider label is **DataForge Zen**, the executable is `dataforge`, and terminal-facing product language uses DataForge throughout.

| Concern             | Upstream-compatible element retained          | DataForge layer added                                                  |
| ------------------- | --------------------------------------------- | ---------------------------------------------------------------------- |
| Provider discovery  | `opencode` provider ID                        | `DataForge Zen` user-facing label.                                     |
| Zen model selection | `big-pickle` model ID                         | `opencode/big-pickle` runtime default and picker restriction.          |
| Credential lookup   | `OPENCODE_API_KEY` environment variable       | Explicit secret-safe documentation and doctor presence check.          |
| Local runtime       | Existing session, tool, and provider services | `DATAFORGE_RUNTIME=1` startup marker and policy injection.             |
| Agent registry      | Existing native agent architecture            | New `dataforge` primary agent and agent prompt.                        |
| TUI framework       | Existing terminal renderer                    | New mark, home prompts, connection copy, errors, and runbook language. |

## Runtime configuration flow

The executable entry point sets the runtime marker before configuration resolution:

```text
packages/opencode/src/index.ts
  └─ process.env.DATAFORGE_RUNTIME ??= "1"
      └─ Config loader resolves global, project, environment, and CLI configuration
          └─ applyBrandDefaults(result)
              ├─ no-op outside the DataForge executable
              ├─ sets default_agent = dataforge
              ├─ installs DataForge workflow command templates
              └─ when there is no explicit project model:
                  ├─ enables the compatible Zen provider
                  ├─ sets model = opencode/big-pickle
                  ├─ sets small_model = opencode/big-pickle
                  ├─ labels provider = DataForge Zen
                  └─ whitelists big-pickle in the model picker
```

This policy is deliberately conservative. An explicit project-level `model` is treated as an intentional user choice and is left unchanged. Setting `DATAFORGE_ALLOW_PROVIDER_SWITCH=1` skips provider restriction, allowing a user to intentionally work with a different model or provider.

## Zen and Big Pickle integration

The fork is configured for the official Zen model identifier `big-pickle` and standard Zen credential variable `OPENCODE_API_KEY`.[1] The key is supplied at session start, not baked into the repository:

```sh
export OPENCODE_API_KEY="your-zen-key"
bun run dataforge
```

The credential policy is as important as the model policy. The provided key was not placed in source code, `.env.example`, test fixtures, state files, reports, archived deliverables, or Git history. The `workspace doctor` command returns only the string `present` or `missing`. It does not echo a key, use a key to make a remote request, or create a persistent credential record.

## Primary agent design

The `dataforge` agent is registered as a native primary agent in `packages/opencode/src/agent/agent.ts`. It pins its default model to the DataForge brand constant, points to `src/agent/prompt/dataforge.txt`, and asks for approval around shell execution, edits, and external-directory access.

The prompt introduces a reusable operating procedure:

1. Create or resume a compact plan and state record for non-trivial work.
2. Inspect datasets and schemas before modeling or transformation.
3. Prefer summaries, quality metrics, and relative file paths over raw-data dumps.
4. Create reproducible scripts and execute notebooks where supported.
5. Diagnose failures from evidence such as commands, exit statuses, stack traces, environment, and data assumptions.
6. Verify outputs before reporting success, and record the result locally.

This is not a claim that DataForge can autonomously infer every organization’s governance requirements. Project-specific handling rules still belong in `AGENTS.md`, and the agent is instructed to ask before destructive, external, credentialed, or database-writing operations.

## Workflow command templates

The brand module installs command templates at runtime. They remain project-overridable, allowing a team to provide a same-named project command when its procedure must differ.

| Slash command | Operational objective                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/init`       | Initialize a workspace, observe the repository and data layout, create guidance, and avoid overwriting user files.                                          |
| `/inspect`    | Profile data safely: file discovery, schemas, row counts, missing values, duplicates, and likely key fields.                                                |
| `/analyze`    | Produce reproducible exploratory or modeling work, record metrics and assumptions, and verify results.                                                      |
| `/research`   | Request approval, form a schema-level public research brief, and create a provenance ledger that separates sources from hypotheses.                         |
| `/enrich`     | Produce a reversible enrichment or training-preparation plan without changing source data or downloading, joining, training, or publishing before approval. |
| `/notebook`   | Create and execute a notebook through supported notebook tooling where available.                                                                           |
| `/debug`      | Reproduce a failure, inspect dependencies and assumptions, apply the smallest safe repair, and record diagnosis.                                            |
| `/verify`     | Detect and run relevant lint, typecheck, unit, notebook, and data-quality checks.                                                                           |

## Workspace tooling

`packages/opencode/src/cli/cmd/workspace.ts` adds deterministic local operations that do not require an LLM call. The state envelope now tracks only non-sensitive governance metadata, source-ledger status, hypotheses, enrichment status, and analysis-console artifact paths. It does not contain raw rows, identifiers, secrets, downloaded external data, or image payloads.

### `dataforge workspace init [directory]`

The initializer creates `.dataforge/notebooks`, `.dataforge/reports`, `.dataforge/runs`, `.dataforge/research`, `.dataforge/scripts`, `.dataforge/state.json`, and an `AGENTS.md` instruction file only when missing. It uses exclusive file creation, so it reports `kept` rather than overwriting a pre-existing file. The generated instructions require classification before analysis, consent before external research, a source ledger, and approval before enrichment or training actions.

```sh
dataforge workspace init .
```

### `dataforge workspace doctor [directory]`

Doctor resolves the workspace path, reads the local state file, and prints a compact JSON report. It reports runtime information, the expected model and provider, the key’s presence state, and state-file readability. It exits non-zero if state is unreadable.

```sh
dataforge workspace doctor .
```

Example shape:

```json
{
  "product": "DataForge",
  "runtime": "DataForge Runtime",
  "model": "Big Pickle",
  "provider": "DataForge Zen",
  "workspace": "/absolute/path/to/project",
  "node": "v22.x",
  "credential": "present",
  "state": "ready",
  "state_error": null,
  "governance": {
    "external_research": "approval_required",
    "external_enrichment": "approval_required",
    "raw_data_externalization": "forbidden"
  },
  "research": {
    "approval": "not_requested",
    "sources": []
  }
}
```

### `dataforge workspace research-brief [directory]`

This command prints the outbound-research contract before an agent performs an external lookup. It permits only a user-provided public subject and non-sensitive schema concepts in a query. It explicitly excludes raw values, identifiers, private URLs, proprietary labels, and secrets. The required source ledger includes URL, publisher, access date, query rationale, claim, relevance, and limitations.

### `dataforge workspace rasterize <image> [directory]`

This command is a local-only display bridge for genuine Python plot files. It writes a generated helper under `.dataforge/scripts/rasterize.py`; with Pillow installed in the approved local environment, the helper converts a Matplotlib or Seaborn PNG into foreground/background RGB cell pairs for `.dataforge/analysis-console.json`. The TUI renders each pair with the Unicode `▀` half-block, so the displayed figure is based on actual artifact pixels rather than a simulated chart. The image is not uploaded, and rasterization does not constitute analysis verification.

## TUI and product-surface changes

The implementation replaces high-visibility terminal surfaces, not just package metadata. Changes include the DataForge diamond/wordmark, DataForge terminal title, DataForge-only connection, sidebar, notification, permission, debug, and documentation labels, home-screen starter prompts for data quality and notebook debugging, DataForge Zen key-entry guidance, Big Pickle model wording, DataForge-branded model and MCP error messages, a configurable crash-report destination, and a DataForge-oriented base prompt for non-specialized sessions. Internal compatibility IDs remain implementation details and are not used as public TUI labels.

The new `/dashboard` command opens a dedicated DataForge analysis console. The console accepts only an executed `.dataforge/analysis-console.json` manifest. Its key model provides terminal charts on `1`, true-color plot raster artifacts on `2`, column profiling on `3`, a separated plan/tool/observation/interpretation/verification activity stream on `4`, and redaction-aware safe local rows on `5`. `Tab` or `Space` selects a raster figure, `Up` and `Down` move within safe rows, `Enter` returns an evidence-review prompt to the main agent, and `Escape` returns to the home screen. Missing artifacts are announced; the UI does not fabricate charts, source findings, or data rows.

The companion website extends the identity in a separate static React project. It follows a warm-paper terminal-field-manual aesthetic with a monospaced type system, hairline rules, DataForge generated visual assets, a functional copy-to-clipboard command pattern, and responsive runbook content. It does not duplicate source-project branding or copy.

## Extension points for future work

| Extension                      | Location                                           | Safe way to evolve it                                                                                                         |
| ------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Brand and default model policy | `packages/opencode/src/branding.ts`                | Update constants and policy tests together; preserve explicit user model behavior.                                            |
| Data-agent operating procedure | `packages/opencode/src/agent/prompt/dataforge.txt` | Add task instructions in clear, observable language; do not embed secrets or project-specific paths.                          |
| Workflow prompts               | `workflowCommands` in `src/branding.ts`            | Add concise prompt templates with a measurable completion condition.                                                          |
| Workspace state schema         | `stateTemplate` in `src/cli/cmd/workspace.ts`      | Version additions carefully and keep state local, metadata-only, and ignored.                                                 |
| Deterministic diagnostics      | `src/cli/cmd/workspace.ts`                         | Add signals that do not require or disclose credentials.                                                                      |
| Research and enrichment policy | `packages/opencode/src/agent/prompt/dataforge.txt` | Keep public search consent-gated, preserve source provenance, and require explicit approval before data mutation or training. |
| TUI analysis console           | `packages/tui/src/routes/analysis-console.tsx`     | Add manifest fields only when an executed local artifact provides evidence; never substitute mock analysis output.            |
| Companion website              | `website/client/src/pages/Home.tsx`                | Add real documentation routes before adding decorative marketing surfaces.                                                    |

## Verification evidence

| Verification activity                                             | Outcome                                                                                                                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bun dependency installation                                       | Passed after installing the compiler toolchain required by a native tree-sitter dependency.                                                                       |
| TUI typecheck                                                     | Passed.                                                                                                                                                           |
| Focused config and agent-color suite                              | 98 tests passed, 0 failed.                                                                                                                                        |
| New DataForge runtime-default regression suite plus focused tests | 101 tests passed, 0 failed.                                                                                                                                       |
| Workspace init and doctor smoke tests                             | Passed in disposable fixture directories; state and guidance were created and doctor reported a redacted key-presence status.                                     |
| Research-brief command smoke test                                 | Passed; it printed the consent-gated outbound query contract and source-ledger requirements.                                                                      |
| Local plot-raster smoke test                                      | Passed with a generated local PNG; the rasterizer wrote a true-color pixel manifest, with no dataset upload or record disclosure.                                 |
| Fork formatting and diff hygiene                                  | Passed.                                                                                                                                                           |
| Companion website typecheck and production build                  | Passed.                                                                                                                                                           |
| Full executable package native typecheck                          | The `tsgo` process was terminated by the sandbox resource/time envelope without diagnostics. The report keeps this as a documented limitation rather than a pass. |

## References

[1] [OpenCode Zen documentation](https://opencode.ai/docs/zen/)

[2] [OpenCode configuration documentation](https://opencode.ai/docs/config/)

[3] [OpenCode agents documentation](https://opencode.ai/docs/agents/)

[4] [OpenCode upstream repository](https://github.com/anomalyco/opencode)
