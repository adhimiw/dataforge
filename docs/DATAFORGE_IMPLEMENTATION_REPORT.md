# DataForge Fork: Detailed Implementation Report

**Status:** Implemented and locally verified
**Scope:** DataForge terminal fork, runtime defaults, task-agent behavior, workspace tooling, TUI identity, companion website, and repository runbook.

## Executive summary

DataForge is a focused fork of the OpenCode terminal runtime for reproducible data engineering and analysis. The implementation intentionally preserves compatible provider, session, tool, and local-runtime foundations while replacing the visible product identity and default operating behavior. The fork does not merely rename the binary: it adds a primary agent, a data-specific system prompt, explicit model-policy logic, workflow commands, deterministic workspace initialization, non-secret diagnostics, durable artifact conventions, and a matching technical companion website.

> **Design principle:** The system should inspect before it transforms, preserve evidence before it summarizes, and verify before it declares work complete.

## Fork boundary and compatibility strategy

DataForge remains compatible with the upstream Zen provider by retaining the internal provider ID `opencode`. This is a technical compatibility boundary rather than a public product name. The user-facing provider label is **DataForge Zen**, the executable is `dataforge`, and terminal-facing product language uses DataForge throughout.

| Concern | Upstream-compatible element retained | DataForge layer added |
| --- | --- | --- |
| Provider discovery | `opencode` provider ID | `DataForge Zen` user-facing label. |
| Zen model selection | `big-pickle` model ID | `opencode/big-pickle` runtime default and picker restriction. |
| Credential lookup | `OPENCODE_API_KEY` environment variable | Explicit secret-safe documentation and doctor presence check. |
| Local runtime | Existing session, tool, and provider services | `DATAFORGE_RUNTIME=1` startup marker and policy injection. |
| Agent registry | Existing native agent architecture | New `dataforge` primary agent and agent prompt. |
| TUI framework | Existing terminal renderer | New mark, home prompts, connection copy, errors, and runbook language. |

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

| Slash command | Operational objective |
| --- | --- |
| `/init` | Initialize a workspace, observe the repository and data layout, create guidance, and avoid overwriting user files. |
| `/inspect` | Profile data safely: file discovery, schemas, row counts, missing values, duplicates, and likely key fields. |
| `/analyze` | Produce reproducible exploratory or modeling work, record metrics and assumptions, and verify results. |
| `/notebook` | Create and execute a notebook through supported notebook tooling where available. |
| `/debug` | Reproduce a failure, inspect dependencies and assumptions, apply the smallest safe repair, and record diagnosis. |
| `/verify` | Detect and run relevant lint, typecheck, unit, notebook, and data-quality checks. |

## Workspace tooling

`packages/opencode/src/cli/cmd/workspace.ts` adds two deterministic CLI operations that do not require an LLM call.

### `dataforge workspace init [directory]`

The initializer creates `.dataforge/notebooks`, `.dataforge/reports`, `.dataforge/runs`, `.dataforge/state.json`, and an `AGENTS.md` instruction file only when missing. It uses exclusive file creation, so it reports `kept` rather than overwriting a pre-existing file.

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
  "model": "opencode/big-pickle",
  "provider": "DataForge Zen",
  "workspace": "/absolute/path/to/project",
  "node": "v22.x",
  "zen_api_key": "present",
  "state": "ready",
  "state_error": null,
  "state_data": {
    "status": "initialized",
    "workspace": null,
    "last_run": null,
    "artifacts": [],
    "checks": []
  }
}
```

## TUI and product-surface changes

The implementation replaces high-visibility terminal surfaces, not just package metadata. Changes include the DataForge diamond/wordmark, home-screen starter prompts for data quality and notebook debugging, DataForge Zen key-entry guidance, Big Pickle model wording, DataForge-branded model and MCP error messages, a configurable crash-report destination, and a DataForge-oriented base prompt for non-specialized sessions.

The companion website extends the identity in a separate static React project. It follows a warm-paper terminal-field-manual aesthetic with a monospaced type system, hairline rules, DataForge generated visual assets, a functional copy-to-clipboard command pattern, and responsive runbook content. It does not duplicate source-project branding or copy.

## Extension points for future work

| Extension | Location | Safe way to evolve it |
| --- | --- | --- |
| Brand and default model policy | `packages/opencode/src/branding.ts` | Update constants and policy tests together; preserve explicit user model behavior. |
| Data-agent operating procedure | `packages/opencode/src/agent/prompt/dataforge.txt` | Add task instructions in clear, observable language; do not embed secrets or project-specific paths. |
| Workflow prompts | `workflowCommands` in `src/branding.ts` | Add concise prompt templates with a measurable completion condition. |
| Workspace state schema | `.dataforge/state.example.json` and workspace command | Version additions carefully and keep state local/ignored. |
| Deterministic diagnostics | `src/cli/cmd/workspace.ts` | Add signals that do not require or disclose credentials. |
| TUI onboarding | `packages/tui/src/feature-plugins/home/tips-view.tsx` and dialog components | Keep suggestions accurate for the exact shipped binary and document configuration compatibility names. |
| Companion website | `website/client/src/pages/Home.tsx` | Add real documentation routes before adding decorative marketing surfaces. |

## Verification evidence

| Verification activity | Outcome |
| --- | --- |
| Bun dependency installation | Passed after installing the compiler toolchain required by a native tree-sitter dependency. |
| TUI typecheck | Passed. |
| Focused config and agent-color suite | 98 tests passed, 0 failed. |
| New DataForge runtime-default regression suite plus focused tests | 101 tests passed, 0 failed. |
| Workspace init and doctor smoke tests | Passed in disposable fixture directories; state and guidance were created and doctor reported a redacted key-presence status. |
| Fork formatting and diff hygiene | Passed. |
| Companion website typecheck and production build | Passed. |
| Full executable package native typecheck | The `tsgo` process was terminated by the sandbox resource/time envelope without diagnostics. The report keeps this as a documented limitation rather than a pass. |

## References

[1] [OpenCode Zen documentation](https://opencode.ai/docs/zen/)

[2] [OpenCode configuration documentation](https://opencode.ai/docs/config/)

[3] [OpenCode agents documentation](https://opencode.ai/docs/agents/)

[4] [OpenCode upstream repository](https://github.com/anomalyco/opencode)
