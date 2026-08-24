import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";
import { Block } from "./block";

export type Column = {
  header: string;
  width?: number;
  align?: "left" | "right" | "center";
};

export class DataTable implements Widget {
  private _columns: Column[] = [];
  private _rows: (string | number)[][] = [];
  private _block?: Block;
  private _selectedIndex?: number;
  private _stripeBg: boolean = true;

  columns(cols: (string | Column)[]): this {
    this._columns = cols.map((c) => (typeof c === "string" ? { header: c } : c));
    return this;
  }

  rows(r: (string | number)[][]): this {
    this._rows = r;
    return this;
  }

  select(index?: number): this {
    this._selectedIndex = index;
    return this;
  }

  block(b: Block): this {
    this._block = b;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty()) return;

    let innerArea = area;
    if (this._block) {
      this._block.render(area, buffer);
      innerArea = this._block.inner(area);
    }

    if (innerArea.isEmpty() || this._columns.length === 0) return;

    // Calculate column widths
    const colCount = this._columns.length;
    const colWidths: number[] = new Array(colCount).fill(0);
    const availableWidth = innerArea.width - (colCount - 1); // 1 space divider

    // Auto width distribution
    const evenWidth = Math.max(8, Math.floor(availableWidth / colCount));
    for (let i = 0; i < colCount; i++) {
      colWidths[i] = this._columns[i].width ?? evenWidth;
    }

    // 1. Render Header
    let curX = innerArea.x;
    const headerStyle = Style.default().bold().withFg(Color.FORGE_CYAN).withBg(Color.FORGE_PANEL);
    buffer.fill(new Rect(innerArea.x, innerArea.y, innerArea.width, 1), " ", headerStyle);

    for (let i = 0; i < colCount; i++) {
      const col = this._columns[i];
      const w = colWidths[i];
      buffer.setString(curX, innerArea.y, col.header.padEnd(w).substring(0, w), headerStyle);
      curX += w + 1;
    }

    // 2. Render Rows
    for (let r = 0; r < this._rows.length && r < innerArea.height - 1; r++) {
      const y = innerArea.y + 1 + r;
      const row = this._rows[r];
      const isSelected = this._selectedIndex === r;

      let rowStyle = Style.default();
      if (isSelected) {
        rowStyle = Style.default().bold().withFg(Color.BLACK).withBg(Color.FORGE_CYAN);
      } else if (this._stripeBg && r % 2 === 1) {
        rowStyle = Style.default().withBg(Color.hex("#11141c"));
      }

      buffer.fill(new Rect(innerArea.x, y, innerArea.width, 1), " ", rowStyle);

      curX = innerArea.x;
      for (let c = 0; c < colCount; c++) {
        const val = String(row[c] ?? "");
        const w = colWidths[c];
        buffer.setString(curX, y, val.padEnd(w).substring(0, w), rowStyle);
        curX += w + 1;
      }
    }
  }
}
