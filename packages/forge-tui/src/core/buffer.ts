import { Cell, Style, StyleFlags } from "./cell";
import { Rect } from "../layout/rect";
import { Color } from "../style/color";

export class Buffer {
  readonly area: Rect;
  readonly content: Cell[];

  constructor(area: Rect) {
    this.area = area;
    this.content = new Array(area.area);
    for (let i = 0; i < this.content.length; i++) {
      this.content[i] = Cell.empty();
    }
  }

  static empty(area: Rect): Buffer {
    return new Buffer(area);
  }

  private index(x: number, y: number): number {
    const relX = x - this.area.x;
    const relY = y - this.area.y;
    return relY * this.area.width + relX;
  }

  get(x: number, y: number): Cell | undefined {
    if (!this.area.contains(x, y)) return undefined;
    return this.content[this.index(x, y)];
  }

  set(x: number, y: number, char: string, style?: Style): void {
    if (!this.area.contains(x, y)) return;
    const cell = this.content[this.index(x, y)];
    cell.char = char;
    if (style) {
      cell.applyStyle(style);
    }
  }

  setString(x: number, y: number, str: string, style?: Style, maxWidth?: number): number {
    if (y < this.area.top || y >= this.area.bottom) return 0;
    const maxLen = maxWidth !== undefined ? Math.min(maxWidth, this.area.right - x) : this.area.right - x;
    let written = 0;

    for (let i = 0; i < str.length && written < maxLen; i++) {
      const curX = x + written;
      if (curX >= this.area.right) break;
      this.set(curX, y, str[i], style);
      written++;
    }
    return written;
  }

  fill(rect: Rect, char: string = " ", style?: Style): void {
    const intersect = this.area.intersection(rect);
    if (intersect.isEmpty()) return;

    for (let y = intersect.top; y < intersect.bottom; y++) {
      for (let x = intersect.left; x < intersect.right; x++) {
        this.set(x, y, char, style);
      }
    }
  }

  clear(): void {
    for (let i = 0; i < this.content.length; i++) {
      this.content[i].reset();
    }
  }
}
