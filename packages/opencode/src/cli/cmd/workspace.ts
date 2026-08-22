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
}

const agentInstructions = `# DataForge workspace instructions

DataForge is the autonomous data engineering and analysis agent for this workspace.

- Inspect schemas and data quality before analysis or modeling.
- Prefer reproducible scripts and executed notebooks over ad hoc output.
- Keep raw datasets out of chat when summaries or metrics are sufficient.
- Record workflow status, assumptions, checks, and artifact paths in .dataforge/state.json.
- Ask before destructive commands, database writes, credential use, publication, or external-directory access.
- Verify generated artifacts and report the exact checks that passed.
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
  const state = await createIfMissing(
    path.join(dataforge, "state.json"),
    JSON.stringify(stateTemplate, null, 2) + "\n",
    0o600,
  )
  const instructions = await createIfMissing(path.join(directory, "AGENTS.md"), agentInstructions, 0o600)
  return { state, instructions, directory, dataforge }
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
        },
      })
      .command({
        command: "doctor [directory]",
        describe: "check DataForge runtime, Zen credentials, and workspace state",
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
            model: BRAND.model,
            provider: "DataForge Zen",
            workspace: directory,
            node: process.version,
            zen_api_key: process.env.OPENCODE_API_KEY ? "present" : "missing",
            state: stateError ? "unreadable" : "ready",
            state_error: stateError,
            state_data: state,
          }
          console.log(JSON.stringify(report, null, 2))
          if (stateError) process.exitCode = 1
        },
      })
      .demandCommand(),
  async handler() {},
})
