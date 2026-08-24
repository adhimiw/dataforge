import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Block } from "./block";

export class Paragraph implements Widget {
  private _text: string = "";
  private _style: Style = Style.default();
  private _block?: Block;
  private _wrap: boolean = true;

  constructor(text: string = "") {
    this._text = text;
  }

  static text(str: string): Paragraph {
    return new Paragraph(str);
  }

  style(s: Style): this {
    this._style = s;
    return this;
  }

  block(b: Block): this {
    this._block = b;
    return this;
  }

  wrap(w: boolean = true): this {
    this._wrap = w;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty()) return;

    let innerArea = area;
    if (this._block) {
      this._block.render(area, buffer);
      innerArea = this._block.inner(area);
    }

    if (innerArea.isEmpty()) return;

    const lines: string[] = [];
    const rawLines = this._text.split("\n");

    for (const rawLine of rawLines) {
      if (!this._wrap || rawLine.length <= innerArea.width) {
        lines.push(rawLine);
      } else {
        // Word wrap
        let cur = rawLine;
        while (cur.length > innerArea.width) {
          let breakIdx = cur.lastIndexOf(" ", innerArea.width);
          if (breakIdx === -1 || breakIdx === 0) {
            breakIdx = innerArea.width;
          }
          lines.push(cur.substring(0, breakIdx));
          cur = cur.substring(breakIdx).trimStart();
        }
        if (cur.length > 0) lines.push(cur);
      }
    }

    for (let i = 0; i < lines.length && i < innerArea.height; i++) {
      buffer.setString(innerArea.x, innerArea.y + i, lines[i], this._style, innerArea.width);
    }
  }
}
