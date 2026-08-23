import fs from "fs/promises"
import path from "path"
import { cmd } from "./cmd"
import { BRAND } from "@/branding"

const stateTemplate = {
  status: "initialized",
  workspace: null,
  last_run: null,
  artifacts: [],
  checks: [],
  governance: {
    data_classification: "unknown",
    external_research: "approval_required",
    external_enrichment: "approval_required",
    raw_data_externalization: "forbidden",
  },
  datasets: [],
  research: {
    approval: "not_requested",
    sources: [],
  },
  hypotheses: [],
  enrichment: {
    status: "not_started",
    approved: false,
  },
  analysis_console: {
    manifest: ".dataforge/analysis-console.json",
    safe_rows_only: true,
  },
}

const agentInstructions = `# DataForge workspace instructions

DataForge is the autonomous data engineering and analysis agent for this workspace.

DataForge follows a governed workflow. Inspect and classify schemas before analysis or modeling, and treat unknown data as restricted. Prefer reproducible scripts and executed notebooks over ad hoc output. Keep raw datasets out of chat when summaries or metrics are sufficient.

External research is opt-in. Before web search or web fetch, request approval and form queries only from the user-provided subject plus non-sensitive schema concepts. Never place raw values, direct identifiers, private URLs, proprietary labels, or secrets in an outbound query. Store only source provenance, aggregate findings, and evidence limits in .dataforge/state.json.

Record workflow status, assumptions, checks, hypotheses, approval decisions, and artifact paths in .dataforge/state.json. A correlation is a hypothesis until a reproducible validation passes. Ask before destructive commands, database writes, credential use, external downloads, joins, model training, publication, or external-directory access. Verify generated artifacts and report the exact checks that passed.
`

const rasterizeScript = `#!/usr/bin/env python3
"""Render a local PNG as a DataForge true-color half-block raster manifest."""
import argparse
import json
from pathlib import Path

try:
    from PIL import Image
except ImportError as error:
    raise SystemExit("Pillow is required for rasterization. Install it in the approved local environment, then retry.") from error


def color(pixel):
    return "#%02x%02x%02x" % pixel[:3]


def main():
    parser = argparse.ArgumentParser(description="Convert a local plot PNG into a DataForge console raster.")
    parser.add_argument("image")
    parser.add_argument("--output", required=True)
    parser.add_argument("--id", default="figure")
    parser.add_argument("--title", default="Python plot")
    parser.add_argument("--width", type=int, default=64)
    parser.add_argument("--height", type=int, default=18)
    args = parser.parse_args()

    source = Path(args.image).resolve()
    output = Path(args.output).resolve()
    image = Image.open(source).convert("RGBA")
    image.thumbnail((max(1, args.width), max(2, args.height * 2)))
    canvas = Image.new("RGBA", (max(1, args.width), max(2, args.height * 2)), (9, 11, 16, 255))
    canvas.paste(image, ((canvas.width - image.width) // 2, (canvas.height - image.height) // 2), image)
    pixels = []
    for y in range(0, canvas.height, 2):
        row = []
        for x in range(canvas.width):
            row.append({"foreground": color(canvas.getpixel((x, y))), "background": color(canvas.getpixel((x, min(y + 1, canvas.height - 1))))})
        pixels.append(row)

    existing = json.loads(output.read_text()) if output.exists() else {}
    figures = [item for item in existing.get("figures", []) if item.get("id") != args.id]
    figures.append({
        "id": args.id,
        "title": args.title,
        "artifact": str(source),
        "pixels": pixels,
    })
    existing["figures"] = figures
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(existing, indent=2) + "\\n")
    print("Wrote DataForge terminal raster to " + str(output))


if __name__ == "__main__":
    main()
`

async function createIfMissing(file: string, content: string, mode: number) {
  try {
    await fs.writeFile(file, content, { flag: "wx", mode })
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") return false
    throw error
  }
}

async function initializeWorkspace(directory: string) {
  const dataforge = path.join(directory, ".dataforge")
  await fs.mkdir(path.join(dataforge, "notebooks"), { recursive: true, mode: 0o700 })
  await fs.mkdir(path.join(dataforge, "reports"), { recursive: true, mode: 0o700 })
  await fs.mkdir(path.join(dataforge, "runs"), { recursive: true, mode: 0o700 })
  await fs.mkdir(path.join(dataforge, "research"), { recursive: true, mode: 0o700 })
  await fs.mkdir(path.join(dataforge, "scripts"), { recursive: true, mode: 0o700 })
  const state = await createIfMissing(
    path.join(dataforge, "state.json"),
    JSON.stringify(stateTemplate, null, 2) + "\n",
    0o600,
  )
  const instructions = await createIfMissing(path.join(directory, "AGENTS.md"), agentInstructions, 0o600)
  const rasterizer = await createIfMissing(path.join(dataforge, "scripts", "rasterize.py"), rasterizeScript, 0o700)
  return { state, instructions, rasterizer, directory, dataforge }
}

export const WorkspaceCommand = cmd({
  command: "workspace",
  describe: "initialize and inspect a DataForge workspace",
  builder: (yargs) =>
    yargs
      .command({
        command: "init [directory]",
        describe: "create DataForge state directories and project guidance",
        builder: (inner) =>
          inner.positional("directory", {
            type: "string",
            default: process.cwd(),
            describe: "workspace directory",
          }),
        async handler(args) {
          const directory = path.resolve(args.directory as string)
          const result = await initializeWorkspace(directory)
          console.log(`DataForge workspace ready: ${result.directory}`)
          console.log(`${result.state ? "created" : "kept"} ${path.join(result.dataforge, "state.json")}`)
          console.log(`${result.instructions ? "created" : "kept"} ${path.join(result.directory, "AGENTS.md")}`)
          console.log(
            `${result.rasterizer ? "created" : "kept"} ${path.join(result.dataforge, "scripts", "rasterize.py")}`,
          )
        },
      })
      .command({
        command: "doctor [directory]",
        describe: "check DataForge runtime, credential presence, governance controls, and workspace state",
        builder: (inner) =>
          inner.positional("directory", {
            type: "string",
            default: process.cwd(),
            describe: "workspace directory",
          }),
        async handler(args) {
          const directory = path.resolve(args.directory as string)
          const dataforge = path.join(directory, ".dataforge")
          const stateFile = path.join(dataforge, "state.json")
          let state: unknown = null
          let stateError: string | null = null
          try {
            state = JSON.parse(await fs.readFile(stateFile, "utf8"))
          } catch (error) {
            stateError = error instanceof Error ? error.message : String(error)
          }
          const report = {
            product: BRAND.name,
            runtime: BRAND.runtimeLabel,
            model: BRAND.modelLabel,
            provider: BRAND.providerLabel,
            workspace: directory,
            node: process.version,
            credential: process.env[BRAND.apiKeyEnv] ? "present" : "missing",
            state: stateError ? "unreadable" : "ready",
            state_error: stateError,
            governance: state && typeof state === "object" && "governance" in state ? state.governance : "missing",
            research: state && typeof state === "object" && "research" in state ? state.research : "missing",
          }
          console.log(JSON.stringify(report, null, 2))
          if (stateError) process.exitCode = 1
        },
      })
      .command({
        command: "research-brief [directory]",
        describe: "print the consent-gated public research contract for a DataForge workspace",
        builder: (inner) =>
          inner.positional("directory", {
            type: "string",
            default: process.cwd(),
            describe: "workspace directory",
          }),
        async handler(args) {
          const directory = path.resolve(args.directory as string)
          console.log(
            JSON.stringify(
              {
                product: BRAND.name,
                workspace: directory,
                status: "approval_required",
                allowed_query_inputs: ["user-provided public subject", "non-sensitive schema concepts"],
                prohibited_query_inputs: ["raw values", "identifiers", "private URLs", "proprietary labels", "secrets"],
                required_source_ledger: [
                  "url",
                  "publisher",
                  "access date",
                  "query rationale",
                  "claim",
                  "relevance",
                  "limitations",
                ],
                next_step: "Use /research with explicit approval before any external lookup.",
              },
              null,
              2,
            ),
          )
        },
      })
      .command({
        command: "rasterize <image> [directory]",
        describe: "render a local Python plot PNG as a true-color DataForge terminal raster",
        builder: (inner) =>
          inner
            .positional("image", {
              type: "string",
              describe: "local PNG artifact created by an approved analysis",
            })
            .positional("directory", {
              type: "string",
              default: process.cwd(),
              describe: "workspace directory",
            }),
        async handler(args) {
          const directory = path.resolve(args.directory as string)
          const image = path.resolve(directory, args.image as string)
          const result = await initializeWorkspace(directory)
          const output = path.join(result.dataforge, "analysis-console.json")
          const process = Bun.spawn(
            ["python3", path.join(result.dataforge, "scripts", "rasterize.py"), image, "--output", output],
            {
              cwd: directory,
              stdout: "inherit",
              stderr: "inherit",
            },
          )
          if ((await process.exited) !== 0) process.exitCode = 1
        },
      })
      .demandCommand(),
  async handler() {},
})
