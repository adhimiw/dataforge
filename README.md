# DataForge

DataForge is a terminal-first autonomous data engineering and analysis agent. It helps inspect datasets, build reproducible analyses and notebooks, debug project failures, and verify the resulting artifacts without forcing raw data into the conversation.

DataForge is built from the OpenCode terminal runtime, but it is intentionally presented as a separate product with its own name, wordmark, onboarding, agent behavior, workflow commands, and safety defaults. The upstream runtime remains MIT licensed; see [LICENSE](LICENSE).

## What is included

The default primary agent is `dataforge`. It uses a plan-and-execute workflow, keeps durable progress in `.dataforge/state.json`, prefers compact dataset summaries over raw-data dumps, and asks for approval before shell mutations, edits, external-directory access, or other sensitive actions.

The default model is `opencode/big-pickle`, provided through OpenCode Zen. DataForge restricts the model picker to Big Pickle unless `DATAFORGE_ALLOW_PROVIDER_SWITCH=1` is explicitly set. The provider ID remains `opencode` internally for compatibility with the Zen catalog and upstream authentication flow, while the user-facing label is `DataForge Zen`.

The built-in workflow commands are:

| Command     | Purpose                                                                |
| ----------- | ---------------------------------------------------------------------- |
| `/init`     | Initialize workspace guidance and durable state.                       |
| `/inspect`  | Profile available datasets and report data quality.                    |
| `/analyze`  | Run a reproducible exploratory or machine-learning analysis.           |
| `/notebook` | Create and execute a validated Jupyter notebook.                       |
| `/debug`    | Reproduce, diagnose, repair, and verify a failure.                     |
| `/verify`   | Run relevant lint, typecheck, unit, notebook, and data-quality checks. |

## Zen and Big Pickle setup

OpenCode Zen documents Big Pickle as the model ID `big-pickle` and exposes it through the Zen chat-completions endpoint. Create or copy a Zen API key from [OpenCode Zen](https://opencode.ai/auth), then export it locally:

```sh
export OPENCODE_API_KEY="your-key"
```

Do not commit the key. The repository includes [.env.example](.env.example) only as a variable-name reference. DataForge never prints the credential and does not store it in the repository.

## Development

This repository uses Bun. Install dependencies and launch the terminal agent with:

```sh
bun install
bun run dataforge
```

You can launch it in a specific project directory or pass a prompt through the existing CLI options:

```sh
bun run dataforge /path/to/project
bun run dataforge --prompt "Profile the sales dataset and create a notebook"
```

Before submitting changes, run the project checks that apply to the modified packages:

```sh
bun run lint
bun run typecheck
```

## Workspace artifacts

When `/init` or a workflow command is used, DataForge can create the following local structure:

```text
.dataforge/
├── state.json       # ignored local progress and verification state
├── notebooks/       # executed Jupyter notebooks
├── reports/         # generated summaries and reports
└── runs/            # run logs and diagnostics
```

Raw datasets should remain in their original project location unless the project explicitly requires copies. Use [AGENTS.md](AGENTS.md) for durable project-specific instructions.

## Architecture

The fork keeps the upstream server and TUI separation: the terminal interface remains a client of the local runtime. DataForge-specific behavior is layered through a built-in brand module, a built-in primary agent prompt, config defaults, onboarding copy, and a safe artifact convention. This keeps the fork easier to update while making the default experience focused on data engineering and debugging rather than generic coding.

The Zen provider and model identifiers are based on the official [Zen documentation](https://opencode.ai/docs/zen/), and the configuration surfaces follow the official [configuration](https://opencode.ai/docs/config/) and [agents](https://opencode.ai/docs/agents/) documentation.

## The DataForge story

### How it started

DataForge began with a practical question: how can a terminal agent become more useful for data work without turning every analysis into an untraceable chat session? The upstream terminal runtime already supplied a mature model-provider layer, a TUI, agent definitions, local sessions, project configuration, and a tool-execution model. The fork did not attempt to replace those foundations. Instead, it changed the operating posture.

The design brief was simple: a data-oriented agent should inspect before it edits, summarize before it floods a prompt with raw records, preserve assumptions, create artifacts that can be rerun, and verify the result before it calls a task complete. The fork therefore treats durable workspace state, notebook execution, data profiling, debugging evidence, and command-level diagnostics as product features rather than optional prompt habits.

### How it is going

The current fork is named **DataForge** and presents a complete product identity rather than a superficial label change. Its TUI uses a DataForge diamond mark and wordmark, data-specific starter prompts, DataForge Zen onboarding, model-error guidance, and a branded recovery view. The default primary agent is `dataforge`; its dedicated system prompt instructs it to plan and resume work, profile schemas and quality before modeling, create reproducible scripts and notebooks, protect secrets, record work in local state, and report verification evidence.

The companion site in [`website/`](website/) explains the product in the same terminal-manual design language. It documents the story, implementation, runtime behavior, extension points, and operating runbook in a deployable static React application.

## Architecture and design

DataForge keeps the upstream server/TUI split but adds a small, deliberately explicit customization layer. The following flow shows the runtime path.

```text
dataforge executable
  └─ sets DATAFORGE_RUNTIME=1
      └─ resolved project configuration
          └─ applyBrandDefaults()
              ├─ default agent: dataforge
              ├─ default provider label: DataForge Zen
              ├─ default model: opencode/big-pickle
              └─ workflow commands: init / inspect / analyze / notebook / debug / verify
                  └─ TUI session and tool loop
                      ├─ dedicated DataForge agent prompt
                      ├─ approval-aware shell/edit behavior
                      ├─ .dataforge/state.json
                      └─ reproducible artifacts, notebook outputs, reports, and run logs
```

| Layer | Role | DataForge change |
| --- | --- | --- |
| `src/index.ts` | CLI identity and startup | Defines the `dataforge` command name and marks the process as a DataForge runtime. |
| `src/branding.ts` | Runtime policy | Holds product constants and applies runtime-scoped model, provider, agent, and workflow defaults. |
| `src/agent/agent.ts` | Agent registry | Adds the native `dataforge` primary agent with the Big Pickle model and approval-oriented permissions. |
| `src/agent/prompt/dataforge.txt` | Agent operating procedure | Encodes data inspection, reproducibility, secrets handling, state recording, and verification rules. |
| `src/cli/cmd/workspace.ts` | Deterministic local operations | Provides `workspace init` and `workspace doctor` without exposing credentials. |
| `packages/tui` | Product experience | Replaces visible identity and shifts onboarding from generic coding prompts to data and debugging workflows. |
| `.dataforge/` | Durable artifacts | Defines the ignored local state, notebook, report, and run-log convention. |

The visual system is equally intentional. The companion site follows a terminal field-manual approach: warm cream paper, near-black ink, one monospaced type system, 1px rules instead of shadows, bracketed markers, a single dark terminal surface, and forge cobalt reserved for configuration signals. It references the supplied design brief's structural restraint without reusing upstream names, wordmarks, product copy, or visual assets.

## Big Pickle and Zen integration

OpenCode Zen remains the compatible provider substrate. DataForge does not invent a second gateway or copy credentials into another store. The integration uses the existing provider ID `opencode`, the Zen model ID `big-pickle`, and the standard `OPENCODE_API_KEY` environment variable. The visible label is changed to **DataForge Zen** so users see the product they are actually operating.

At process startup, the DataForge entry point sets `DATAFORGE_RUNTIME=1`. During configuration resolution, `applyBrandDefaults()` runs only under that flag. If the project has not explicitly chosen a model, DataForge sets `opencode/big-pickle` as the main and small model, enables the compatible provider, labels it DataForge Zen, and restricts the model list to Big Pickle. If a project deliberately sets a model, that choice remains authoritative. Setting `DATAFORGE_ALLOW_PROVIDER_SWITCH=1` makes provider switching an explicit opt-in rather than an accidental default.

```sh
# Required for a live Zen session. Keep this local; never commit it.
export OPENCODE_API_KEY="your-zen-key"

# Start the DataForge TUI with its default Big Pickle runtime policy.
bun run dataforge

# Intentionally allow an alternate provider or model for a specific session.
DATAFORGE_ALLOW_PROVIDER_SWITCH=1 bun run dataforge
```

The key is intentionally absent from `.env.example`, `README.md` examples, workspace state, tests, reports, logs, and source. `workspace doctor` reports only `present` or `missing` for the credential.

## New extension points

| Extension point | How to use it | Why it exists |
| --- | --- | --- |
| Runtime brand policy | Edit `packages/opencode/src/branding.ts`. | Centralizes the public name, compatible provider, default model, workflow prompts, and opt-in escape hatch. |
| Primary agent prompt | Edit `packages/opencode/src/agent/prompt/dataforge.txt`. | Makes data-engineering behavior durable and reviewable rather than embedding it in transient chat setup. |
| Built-in workflow commands | Extend `workflowCommands` in `src/branding.ts`. | Adds reusable operator shortcuts such as `/inspect`, `/analyze`, and `/verify`. |
| Workspace CLI | Extend `src/cli/cmd/workspace.ts`. | Adds deterministic operations that do not need an LLM round trip. |
| TUI identity | Change `packages/tui/src/logo.ts`, home prompts, and connection/recovery components. | Keeps the visible product coherent when the terminal launches or fails. |
| Project instructions | Edit `AGENTS.md` in an initialized target workspace. | Captures project-specific schema, test, governance, and data-handling rules next to the work. |
| Local state | Add fields to `.dataforge/state.json` deliberately. | Supports resumption, evidence tracking, and artifact discovery without treating user data as source code. |

## Workspace runbook

### Initialize a workspace

Run the initializer from the project you want DataForge to work in. It creates missing directories and guidance, but keeps any existing `AGENTS.md` or state file untouched.

```sh
dataforge workspace init .
```

The command creates this local structure:

```text
.dataforge/
├── state.json       # private progress, assumptions, artifacts, and verification checks
├── notebooks/       # executed notebook artifacts
├── reports/         # generated summaries
└── runs/            # diagnostics and execution logs
```

### Run workspace doctor

Use doctor whenever a session does not behave as expected, before debugging a live request, or after moving to a new machine:

```sh
dataforge workspace doctor .
```

The command prints a JSON report. A normal result looks like this:

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

`zen_api_key: "present"` confirms that an environment variable was found; it does not validate the key remotely and never prints its value. `state: "unreadable"` means the file is missing or malformed, in which case re-run `dataforge workspace init .` after preserving any needed contents. Use `cat .dataforge/state.json` or a JSON-aware editor to inspect generated state directly. Because this file is ignored by version control, it should contain operational context that is useful locally but not suitable for commits.

### Debug a failing analysis

Start a DataForge session with the failure context, then use the debug workflow:

```text
/debug reproduce the notebook error, identify the dependency or data assumption that failed, apply the smallest safe repair, and verify the result
```

The dedicated agent is instructed to reproduce or inspect before guessing, collect environment and stack-trace evidence, make the smallest safe repair, rerun relevant checks, and update the workspace state with the diagnosis and verification outcome. It asks before destructive operations, database writes, publication, external-directory access, or using credentials.

## Verification history

The fork was verified with Bun installation, TUI typechecking, focused configuration and agent tests, DataForge runtime-default regression tests, workspace initializer and doctor smoke tests, formatting, and diff hygiene. The focused suite recorded **101 passing tests and no failures**. The full executable-package native typechecker exceeded the available sandbox resource envelope and was terminated without diagnostics; that limitation is recorded in the detailed implementation report rather than masked as a passing result.

## References

[1] [OpenCode Zen documentation](https://opencode.ai/docs/zen/)

[2] [OpenCode configuration documentation](https://opencode.ai/docs/config/)

[3] [OpenCode agents documentation](https://opencode.ai/docs/agents/)

[4] [OpenCode upstream repository](https://github.com/anomalyco/opencode)
