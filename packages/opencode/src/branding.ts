import type { ConfigV1 } from "@opencode-ai/core/v1/config/config"

export const BRAND = {
  name: "DataForge",
  command: "dataforge",
  tagline: "Autonomous data engineering and analysis in your terminal",
  providerID: "opencode",
  modelID: "big-pickle",
  model: "opencode/big-pickle",
  runtimeLabel: "DataForge Runtime",
  providerLabel: "DataForge Zen",
  modelLabel: "Big Pickle",
  apiKeyEnv: "OPENCODE_API_KEY",
  zenURL: "https://opencode.ai/zen",
} as const

const workflowCommands: ConfigV1.Info["command"] = {
  init: {
    description: "Initialize a DataForge workspace with durable state and data-agent guidance",
    agent: "dataforge",
    template:
      "Initialize this workspace for DataForge. Inspect the repository and available datasets, identify the runtime and package manager, create or update AGENTS.md with project-specific data-governance instructions, create durable .dataforge/ state and evidence directories, and report what was initialized. Do not delete or overwrite user data. Treat unknown data as restricted until classified.",
  },
  inspect: {
    description: "Profile datasets and report schema, quality, and useful next steps",
    agent: "dataforge",
    template:
      "Inspect the available datasets in this workspace. Use safe, read-only operations to identify files, schemas, row counts, missing values, duplicates, and likely target or timestamp columns. Summarize findings compactly and recommend the next analysis step without loading raw data into the conversation unnecessarily.",
  },
  analyze: {
    description: "Run a reproducible exploratory or machine-learning analysis",
    agent: "dataforge",
    template:
      "Analyze the requested dataset or business question end to end. Plan the work, classify and inspect the data before modeling, create reproducible scripts or notebooks, validate outputs, record aggregate metrics and assumptions in .dataforge/state.json, and explain limitations. Create an analysis-console manifest only from verified, redacted aggregate data. Prefer deterministic tools and small summaries over copying full datasets into chat. Do not send records to external services.",
  },
  research: {
    description: "Research public dataset context and record cited, approval-gated findings",
    agent: "dataforge",
    template:
      "Prepare a dataset-context research brief. First inspect the local schema and state without exposing records. Then ask for approval before using web search or web fetch. Form public queries only from the user's dataset description and non-sensitive schema concepts; never include raw values, identifiers, private URLs, proprietary labels, or secrets. Prefer primary and domain-authoritative sources. Record URLs, publisher, access date, query rationale, claim summary, relevance, and evidence limits in .dataforge/state.json or a report. Separate source-backed facts from unverified hypotheses. Do not download, join, train, or mutate data without a separate explicit approval.",
  },
  enrich: {
    description: "Design a reversible, approval-gated enrichment or training-preparation plan",
    agent: "dataforge",
    template:
      "Design a reversible enrichment or training-preparation plan without changing source data. Reuse the approved local profile and cited research brief. Specify intended outcome, public source, join key justification, coverage, privacy impact, transformations, rollback path, validation checks, and failure conditions. Ask for explicit approval before downloading, joining, writing, generating labels, or training. Record only metadata and aggregate validation results in .dataforge/state.json.",
  },
  autonomous: {
    description: "Run bounded local DataForge work with checkpoints and mandatory approval gates",
    agent: "dataforge",
    template:
      "Run this task in bounded autonomous mode. Continue only through low-risk local inspection, profiling, aggregate analysis, reproducible artifact generation, and verification within the configured turn and tool budgets. Before starting, state the goal, budget, expected artifacts, and stop conditions in .dataforge/state.json. Checkpoint after each material artifact or failed verification. Stop immediately and request approval before web research, web fetch, any external upload or download, external joins, credentials, destructive operations, database writes, source-data mutation, model training, label generation, publication, or an action outside the approved workspace. Do not attempt to bypass permissions, safeguards, rate limits, or review controls. When the budget is exhausted, report completed artifacts, evidence, unresolved risks, and the safest next step rather than continuing.",
  },
  notebook: {
    description: "Create and validate a reproducible Jupyter notebook",
    agent: "dataforge",
    template:
      "Create a reproducible Jupyter notebook for the requested analysis. Use nbformat and nbclient when available, keep data paths relative to the workspace, execute the notebook, capture outputs and errors, and repair failures before reporting completion. Store the final notebook under .dataforge/notebooks unless the user specifies another path.",
  },
  debug: {
    description: "Diagnose and repair a failing data or application workflow",
    agent: "dataforge",
    template:
      "Debug the reported failure systematically. First reproduce or inspect the error, then check environment, dependencies, paths, data assumptions, and recent changes. Make the smallest safe fix, rerun the relevant checks, and record the diagnosis, fix, and verification in .dataforge/state.json. Ask before destructive or external operations.",
  },
  verify: {
    description: "Run the project checks and summarize failures with actionable fixes",
    agent: "dataforge",
    template:
      "Verify this workspace. Detect the package manager and project checks, run the relevant lint, typecheck, unit, notebook, or data-quality commands, group failures by root cause, and propose or apply safe fixes. Do not claim success without showing the commands that passed.",
  },
}

export function applyBrandDefaults(input: ConfigV1.Info): ConfigV1.Info {
  if (process.env.DATAFORGE_RUNTIME !== "1") return input

  const hasExplicitModel = Boolean(input.model)
  input.default_agent ??= "dataforge"
  input.command = {
    ...workflowCommands,
    ...(input.command ?? {}),
  }

  if (process.env.DATAFORGE_ALLOW_PROVIDER_SWITCH === "1" || hasExplicitModel) return input

  input.enabled_providers = [BRAND.providerID]
  input.model = BRAND.model
  input.small_model ??= BRAND.model
  input.provider = {
    ...(input.provider ?? {}),
    [BRAND.providerID]: {
      ...(input.provider?.[BRAND.providerID] ?? {}),
      name: BRAND.providerLabel,
      ...(hasExplicitModel ? {} : { whitelist: [BRAND.modelID] }),
    },
  }
  return input
}
