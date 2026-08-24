import { Buffer } from "./buffer";
import { Rect } from "../layout/rect";
import { Ansi } from "./ansi";
import { Color } from "../style/color";
import { StyleFlags } from "./cell";
import { Widget } from "../widgets/widget";

export class Frame {
  readonly buffer: Buffer;
  readonly size: Rect;
  cursorPosition?: { x: number; y: number };

  constructor(buffer: Buffer) {
    this.buffer = buffer;
    this.size = buffer.area;
  }

  renderWidget(widget: Widget, area: Rect): void {
    widget.render(area, this.buffer);
  }

  setCursor(x: number, y: number): void {
    this.cursorPosition = { x, y };
  }
}

export class DoubleBufferRenderer {
  private currentBuffer: Buffer;
  private previousBuffer: Buffer;
  private lastFg?: Color;
  private lastBg?: Color;
  private lastFlags: number = StyleFlags.NONE;

  constructor(width: number, height: number) {
    const area = new Rect(0, 0, width, height);
    this.currentBuffer = Buffer.empty(area);
    this.previousBuffer = Buffer.empty(area);
  }

  resize(width: number, height: number): void {
    const area = new Rect(0, 0, width, height);
    this.currentBuffer = Buffer.empty(area);
    this.previousBuffer = Buffer.empty(area);
  }

  getFrame(): Frame {
    this.currentBuffer.clear();
    return new Frame(this.currentBuffer);
  }

  renderDiff(stdout: NodeJS.WriteStream): void {
    let output = "";
    let lastRow = -1;
    let lastCol = -1;

    const area = this.currentBuffer.area;

    for (let y = 0; y < area.height; y++) {
      for (let x = 0; x < area.width; x++) {
        const curCell = this.currentBuffer.get(x, y);
        const prevCell = this.previousBuffer.get(x, y);

        if (!curCell) continue;

        // Diff check: only render changed cells
        if (!prevCell || !curCell.equals(prevCell)) {
          // Cursor repositioning optimization
          if (lastRow !== y || lastCol !== x) {
            output += Ansi.cursorPosition(y, x);
          }

          // Style update optimization
          const fgChanged = curCell.fg ? !curCell.fg.equals(this.lastFg) : this.lastFg !== undefined;
          const bgChanged = curCell.bg ? !curCell.bg.equals(this.lastBg) : this.lastBg !== undefined;
          const flagsChanged = curCell.flags !== this.lastFlags;

          if (fgChanged || bgChanged || flagsChanged) {
            output += Ansi.RESET;
            output += Ansi.styleToAnsi(curCell.fg, curCell.bg, curCell.flags);
            this.lastFg = curCell.fg;
            this.lastBg = curCell.bg;
            this.lastFlags = curCell.flags;
          }

          output += curCell.char;
          lastRow = y;
          lastCol = x + 1;

          // Update previous buffer cell
          if (prevCell) {
            prevCell.char = curCell.char;
            prevCell.fg = curCell.fg;
            prevCell.bg = curCell.bg;
            prevCell.flags = curCell.flags;
          }
        }
      }
    }

    if (output.length > 0) {
      stdout.write(output);
    }
  }
}
