/** DataForge analysis console: obsidian operations view, only manifest-backed evidence, never fabricated data. */
import { useKeyboard } from "@opentui/solid"
import fs from "fs/promises"
import path from "path"
import { createMemo, createResource, createSignal, For, Show } from "solid-js"
import { useRoute } from "../context/route"
import { useTheme } from "../context/theme"

type Metric = {
  label: string
  value: number
}

type Column = {
  name: string
  type: string
  nullPercent: number
  uniqueCount: number
  sparkline?: string
}

type StreamEvent = {
  phase: "plan" | "tool" | "observation" | "interpretation" | "verification"
  message: string
}

type RasterFigure = {
  id: string
  title: string
  artifact: string
  raster?: string[]
  pixels?: Array<Array<{ foreground: string; background: string }>>
}

type AnalysisManifest = {
  dataset?: { label: string; classification: "public" | "internal" | "restricted" | "unknown" }
  charts?: { line?: Metric[]; bars?: Metric[] }
  columns?: Column[]
  stream?: StreamEvent[]
  safeRows?: Array<Record<string, string | number | boolean | null>>
  figures?: RasterFigure[]
}

const views = [
  { key: "1", id: "charts", label: "TERMINAL CHARTS" },
  { key: "2", id: "plots", label: "PLOT RASTER" },
  { key: "3", id: "profiler", label: "DATA PROFILER" },
  { key: "4", id: "stream", label: "ANALYSIS STREAM" },
  { key: "5", id: "records", label: "SAFE RECORDS" },
] as const

type View = (typeof views)[number]["id"]

const levels = "▁▂▃▄▅▆▇█"

function bars(values: Metric[]) {
  const maximum = Math.max(1, ...values.map((item) => item.value))
  return values.map((item) => ({ ...item, graph: "█".repeat(Math.max(1, Math.round((item.value / maximum) * 20))) }))
}

function line(values: Metric[]) {
  const maximum = Math.max(1, ...values.map((item) => item.value))
  return values
    .map((item) => levels[Math.min(levels.length - 1, Math.round((item.value / maximum) * (levels.length - 1)))])
    .join("")
}

async function loadManifest() {
  const file = path.join(process.cwd(), ".dataforge", "analysis-console.json")
  const text = await fs.readFile(file, "utf8").catch(() => undefined)
  if (!text) return undefined
  try {
    return JSON.parse(text) as AnalysisManifest
  } catch {
    return undefined
  }
}

function recordText(record: Record<string, string | number | boolean | null>) {
  return Object.entries(record)
    .map(([key, value]) => `${key}=${value ?? "∅"}`)
    .join("  ")
}

export function AnalysisConsole() {
  const route = useRoute()
  const { theme } = useTheme()
  const [manifest] = createResource(loadManifest)
  const [active, setActive] = createSignal<View>("charts")
  const [figureIndex, setFigureIndex] = createSignal(0)
  const [rowOffset, setRowOffset] = createSignal(0)
  const activeView = createMemo(() => views.find((item) => item.id === active()) ?? views[0])
  const figures = createMemo(() => manifest()?.figures ?? [])
  const figure = createMemo(() => figures()[figureIndex()])
  const safeRows = createMemo(() => manifest()?.safeRows ?? [])
  const selectedRows = createMemo(() => safeRows().slice(rowOffset(), rowOffset() + 12))

  useKeyboard((evt) => {
    const selected = views.find((item) => item.key === evt.name)
    if (selected) {
      evt.preventDefault()
      evt.stopPropagation()
      setActive(selected.id)
      return
    }
    if (evt.name === "tab" || evt.name === "space") {
      if (active() !== "plots" || figures().length < 2) return
      evt.preventDefault()
      evt.stopPropagation()
      setFigureIndex((current) => (current + 1) % figures().length)
      return
    }
    if (evt.name === "up") {
      if (active() !== "records") return
      evt.preventDefault()
      evt.stopPropagation()
      setRowOffset((current) => Math.max(0, current - 1))
      return
    }
    if (evt.name === "down") {
      if (active() !== "records") return
      evt.preventDefault()
      evt.stopPropagation()
      setRowOffset((current) => Math.min(Math.max(0, safeRows().length - 1), current + 1))
      return
    }
    if (evt.name === "return") {
      evt.preventDefault()
      evt.stopPropagation()
      route.navigate({
        type: "home",
        prompt: {
          input:
            "Review the current analysis console evidence, identify the strongest next question, and keep all data-governance approval gates in place.",
          parts: [],
        },
      })
      return
    }
    if (evt.name === "escape") route.navigate({ type: "home" })
  })

  return (
    <box flexGrow={1} minHeight={0} flexDirection="column" paddingLeft={2} paddingRight={2} paddingTop={1}>
      <box flexDirection="row" justifyContent="space-between" flexShrink={0}>
        <box flexDirection="row" gap={1}>
          <text fg={theme.primary}>◢◆◣ DATAFORGE</text>
          <text fg={theme.textMuted}>ANALYSIS CONSOLE</text>
          <text fg={manifest()?.dataset?.classification === "restricted" ? theme.error : theme.textMuted}>
            {manifest()?.dataset
              ? `[${manifest()!.dataset!.classification.toUpperCase()}] ${manifest()!.dataset!.label}`
              : "[NO MANIFEST]"}
          </text>
        </box>
        <text fg={theme.textMuted}>esc home · enter ask</text>
      </box>
      <box flexDirection="row" gap={2} paddingTop={1} paddingBottom={1} flexShrink={0}>
        <For each={views}>
          {(view) => (
            <text fg={active() === view.id ? theme.primary : theme.textMuted}>{`[${view.key}] ${view.label}`}</text>
          )}
        </For>
      </box>
      <Show
        when={!manifest.loading && manifest()}
        fallback={
          <box flexGrow={1} alignItems="center" justifyContent="center" flexDirection="column" gap={1}>
            <text fg={theme.textMuted}>No approved analysis manifest found.</text>
            <text fg={theme.textMuted}>
              Run a governed EDA notebook or script, then write aggregate metrics and safe display rows to
              .dataforge/analysis-console.json.
            </text>
            <text fg={theme.primary}>
              DataForge will not invent charts, research results, plot pixels, or raw records.
            </text>
          </box>
        }
      >
        <Show when={active() === "charts"}>
          <box flexGrow={1} minHeight={0} flexDirection="row" gap={3}>
            <box flexGrow={1} borderStyle="single" borderColor={theme.border} paddingLeft={1} paddingRight={1}>
              <text fg={theme.primary}>GLOBAL TREND</text>
              <text fg={theme.text}>{line(manifest()?.charts?.line ?? [])}</text>
              <For each={manifest()?.charts?.line ?? []}>
                {(item) => <text fg={theme.textMuted}>{`${item.label.padEnd(12)} ${item.value}`}</text>}
              </For>
            </box>
            <box flexGrow={1} borderStyle="single" borderColor={theme.border} paddingLeft={1} paddingRight={1}>
              <text fg={theme.primary}>TOP SEGMENTS</text>
              <For each={bars(manifest()?.charts?.bars ?? [])}>
                {(item) => <text fg={theme.text}>{`${item.label.padEnd(12)} ${item.graph} ${item.value}`}</text>}
              </For>
            </box>
          </box>
        </Show>
        <Show when={active() === "plots"}>
          <box
            flexGrow={1}
            minHeight={0}
            borderStyle="single"
            borderColor={theme.border}
            paddingLeft={1}
            paddingRight={1}
          >
            <Show
              when={figure()}
              fallback={
                <text fg={theme.textMuted}>
                  No terminal raster is available. A real Python plot artifact and its approved half-block raster
                  manifest are required.
                </text>
              }
            >
              <text fg={theme.primary}>{`${figure()!.title} · ${figure()!.artifact}`}</text>
              <Show
                when={figure()!.pixels?.length}
                fallback={<For each={figure()!.raster ?? []}>{(row) => <text fg={theme.text}>{row}</text>}</For>}
              >
                <For each={figure()!.pixels ?? []}>
                  {(row) => (
                    <text>
                      <For each={row}>
                        {(cell) => <span style={{ fg: cell.foreground, bg: cell.background }}>▀</span>}
                      </For>
                    </text>
                  )}
                </For>
              </Show>
              <text fg={theme.textMuted}>
                {figures().length > 1 ? "tab / space switches plot artifacts" : "one plot artifact available"}
              </text>
            </Show>
          </box>
        </Show>
        <Show when={active() === "profiler"}>
          <box
            flexGrow={1}
            minHeight={0}
            borderStyle="single"
            borderColor={theme.border}
            paddingLeft={1}
            paddingRight={1}
          >
            <text fg={theme.primary}>COLUMN · TYPE · NULL% · DISTINCT · DISTRIBUTION</text>
            <For each={manifest()?.columns ?? []}>
              {(column) => (
                <text
                  fg={theme.text}
                >{`${column.name.padEnd(18)} ${column.type.padEnd(10)} ${String(column.nullPercent).padStart(5)}% ${String(column.uniqueCount).padStart(8)}  ${column.sparkline ?? ""}`}</text>
              )}
            </For>
          </box>
        </Show>
        <Show when={active() === "stream"}>
          <scrollbox
            flexGrow={1}
            minHeight={0}
            borderStyle="single"
            borderColor={theme.border}
            paddingLeft={1}
            paddingRight={1}
            scrollbarOptions={{ visible: false }}
          >
            <For each={manifest()?.stream ?? []}>
              {(event) => (
                <text
                  fg={event.phase === "verification" ? theme.primary : theme.text}
                >{`${event.phase.toUpperCase().padEnd(15)} ${event.message}`}</text>
              )}
            </For>
          </scrollbox>
        </Show>
        <Show when={active() === "records"}>
          <scrollbox
            flexGrow={1}
            minHeight={0}
            borderStyle="single"
            borderColor={theme.border}
            paddingLeft={1}
            paddingRight={1}
            scrollbarOptions={{ visible: false }}
          >
            <text fg={theme.primary}>
              SAFE LOCAL PREVIEW · ROW ${rowOffset() + 1} OF ${safeRows().length}
            </text>
            <For each={selectedRows()}>{(record) => <text fg={theme.text}>{recordText(record)}</text>}</For>
            <text fg={theme.textMuted}>up / down scrolls rows. This view accepts redacted rows only.</text>
          </scrollbox>
        </Show>
      </Show>
      <box flexShrink={0} paddingTop={1}>
        <text
          fg={theme.textMuted}
        >{`ACTIVE: ${activeView().label} · Evidence is local and approval-gated; press Enter to ask DataForge a governed follow-up.`}</text>
      </box>
    </box>
  )
}
