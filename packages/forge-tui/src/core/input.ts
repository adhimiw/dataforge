import { EventEmitter } from "events";

export type KeyEvent = {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  raw: Buffer;
};

export class InputParser extends EventEmitter {
  private stdin: NodeJS.ReadStream = process.stdin;

  start(): void {
    this.stdin.on("data", (chunk: Buffer) => {
      this.parse(chunk);
    });
  }

  stop(): void {
    this.stdin.removeAllListeners("data");
  }

  private parse(buf: Buffer): void {
    const str = buf.toString("utf8");

    // Ctrl+C check
    if (buf.length === 1 && buf[0] === 3) {
      this.emit("key", { key: "c", ctrl: true, alt: false, shift: false, raw: buf });
      return;
    }

    // Enter
    if (buf.length === 1 && (buf[0] === 13 || buf[0] === 10)) {
      this.emit("key", { key: "enter", ctrl: false, alt: false, shift: false, raw: buf });
      return;
    }

    // Backspace
    if (buf.length === 1 && (buf[0] === 127 || buf[0] === 8)) {
      this.emit("key", { key: "backspace", ctrl: false, alt: false, shift: false, raw: buf });
      return;
    }

    // Tab
    if (buf.length === 1 && buf[0] === 9) {
      this.emit("key", { key: "tab", ctrl: false, alt: false, shift: false, raw: buf });
      return;
    }

    // Escape or ANSI Sequences
    if (str.startsWith("\x1b")) {
      if (str === "\x1b[A") return this.emit("key", { key: "up", ctrl: false, alt: false, shift: false, raw: buf });
      if (str === "\x1b[B") return this.emit("key", { key: "down", ctrl: false, alt: false, shift: false, raw: buf });
      if (str === "\x1b[C") return this.emit("key", { key: "right", ctrl: false, alt: false, shift: false, raw: buf });
      if (str === "\x1b[D") return this.emit("key", { key: "left", ctrl: false, alt: false, shift: false, raw: buf });
      if (str === "\x1b[5~") return this.emit("key", { key: "pageup", ctrl: false, alt: false, shift: false, raw: buf });
      if (str === "\x1b[6~") return this.emit("key", { key: "pagedown", ctrl: false, alt: false, shift: false, raw: buf });
      if (str === "\x1b") return this.emit("key", { key: "escape", ctrl: false, alt: false, shift: false, raw: buf });
    }

    // Normal typing characters
    if (str.length > 0 && buf[0] >= 32) {
      this.emit("key", { key: str, ctrl: false, alt: false, shift: false, raw: buf });
    }
  }
}
