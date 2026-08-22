import type { ConfigV1 } from "@opencode-ai/core/v1/config/config"

export const BRAND = {
  name: "DataForge",
  command: "dataforge",
  tagline: "Autonomous data engineering and analysis in your terminal",
  providerID: "opencode",
  modelID: "big-pickle",
  model: "opencode/big-pickle",
  apiKeyEnv: "OPENCODE_API_KEY",
  zenURL: "https://opencode.ai/zen",
} as const

const workflowCommands: ConfigV1.Info["command"] = {
  init: {
    description: "Initialize a DataForge workspace with durable state and data-agent guidance",
    agent: "dataforge",
    template:
      "Initialize this workspace for DataForge. Inspect the repository and available datasets, identify the runtime and package manager, create or update AGENTS.md with safe project-specific instructions, create a durable .dataforge/ state directory, and report what was initialized. Do not delete or overwrite user data.",
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
      "Analyze the requested dataset or business question end to end. Plan the work, inspect the data before modeling, create reproducible scripts or notebooks, validate outputs, record metrics and assumptions in .dataforge/state.json, and explain any limitations. Prefer deterministic tools and small summaries over copying full datasets into chat.",
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
      name: "DataForge Zen",
      ...(hasExplicitModel ? {} : { whitelist: [BRAND.modelID] }),
    },
  }
  return input
}
