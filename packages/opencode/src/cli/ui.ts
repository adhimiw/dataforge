import { EOL } from "os"
import { Schema } from "effect"
import { logo as glyphs } from "./logo"

const wordmark = [
  `  \x1b[38;2;0;210;255m\x1b[1m██████╗   █████╗  ████████╗  █████╗ ███████╗  ██████╗  ██████╗   ██████╗  ███████╗\x1b[0m`,
  `  \x1b[38;2;0;210;255m\x1b[1m██╔══██╗ ██╔══██╗ ╚══██╔══╝ ██╔══██╗██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝  ██╔════╝\x1b[0m`,
  `  \x1b[38;2;0;210;255m\x1b[1m██║  ██║ ███████║    ██║    ███████║█████╗   ██║   ██║ ██████╔╝ ██║  ███╗ █████╗  \x1b[0m`,
  `  \x1b[38;2;0;210;255m\x1b[1m██║  ██║ ██╔══██║    ██║    ██╔══██║██╔══╝   ██║   ██║ ██╔══██╗ ██║   ██║ ██╔══╝  \x1b[0m`,
  `  \x1b[38;2;0;210;255m\x1b[1m██████╔╝ ██║  ██║    ██║    ██║  ██║██║      ╚██████╔╝ ██║  ██║ ╚██████╔╝ ███████╗\x1b[0m`,
  `  \x1b[38;2;0;210;255m\x1b[1m╚═════╝  ╚═╝  ╚═╝    ╚═╝    ╚═╝  ╚═╝╚═╝       ╚═════╝  ╚═╝  ╚═╝  ╚═════╝  ╚══════╝\x1b[0m`,
  `  \x1b[38;2;255;179;0mAutonomous Data Engineering, OpenPipe ART & Situational Intelligence in your terminal\x1b[0m`,
]

export class CancelledError extends Schema.TaggedErrorClass<CancelledError>()("UICancelledError", {}) {}

export const Style = {
  TEXT_HIGHLIGHT: "\x1b[38;2;0;210;255m",       // Xperia Electric Cyan
  TEXT_HIGHLIGHT_BOLD: "\x1b[38;2;0;210;255m\x1b[1m",
  TEXT_DIM: "\x1b[38;2;120;140;160m",            // Subtle Slate
  TEXT_DIM_BOLD: "\x1b[38;2;120;140;160m\x1b[1m",
  TEXT_NORMAL: "\x1b[0m",
  TEXT_NORMAL_BOLD: "\x1b[1m",
  TEXT_WARNING: "\x1b[38;2;255;179;0m",          // Sony Gold
  TEXT_WARNING_BOLD: "\x1b[38;2;255;179;0m\x1b[1m",
  TEXT_DANGER: "\x1b[38;2;230;0;18m",            // Sony Crimson
  TEXT_DANGER_BOLD: "\x1b[38;2;230;0;18m\x1b[1m",
  TEXT_SUCCESS: "\x1b[38;2;0;230;118m",          // Emerald
  TEXT_SUCCESS_BOLD: "\x1b[38;2;0;230;118m\x1b[1m",
  TEXT_INFO: "\x1b[38;2;0;210;255m",             // Electric Cyan
  TEXT_INFO_BOLD: "\x1b[38;2;0;210;255m\x1b[1m",
}

export function println(...message: string[]) {
  print(...message)
  process.stderr.write(EOL)
}

export function print(...message: string[]) {
  blank = false
  process.stderr.write(message.join(" "))
}

let blank = false
export function empty() {
  if (blank) return
  println("" + Style.TEXT_NORMAL)
  blank = true
}

export function logo(pad?: string) {
  const result: string[] = []
  for (const row of wordmark) {
    if (pad) result.push(pad)
    result.push(row)
    result.push(EOL)
  }
  return result.join("").trimEnd()
}

export async function input(prompt: string): Promise<string> {
  const readline = require("readline")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

export function error(message: string) {
  if (message.startsWith("Error: ")) {
    message = message.slice("Error: ".length)
  }
  println(Style.TEXT_DANGER_BOLD + "DataForge Error: " + Style.TEXT_NORMAL + message)
}

export function markdown(text: string): string {
  return text
}

export * as UI from "./ui"
