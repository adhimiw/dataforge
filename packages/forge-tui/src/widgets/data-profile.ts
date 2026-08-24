import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";
import { Block } from "./block";

export type ColumnProfile = {
  name: string;
  type: "string" | "number" | "boolean" | "datetime" | "float";
  nullPercent: number; // 0 to 100
  uniqueCount: number;
  sampleDist: number[]; // sparkline data
};

export class DataProfileWidget implements Widget {
  private _datasetName: string = "Dataset Profiler";
  private _rowCount: number = 0;
  private _colCount: number = 0;
  private _columns: ColumnProfile[] = [];
  private _block?: Block;

  dataset(name: string, rows: number, cols: number): this {
    this._datasetName = name;
    this._rowCount = rows;
    this._colCount = cols;
    return this;
  }

  columns(cols: ColumnProfile[]): this {
    this._columns = cols;
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

    if (innerArea.isEmpty()) return;

    // Header stats
    const summary = `📊 ${this._datasetName} │ Rows: ${this._rowCount.toLocaleString()} │ Columns: ${this._colCount}`;
    buffer.setString(innerArea.x, innerArea.y, summary, Style.default().bold().withFg(Color.FORGE_EMERALD));

    // Column table header
    const yStart = innerArea.y + 2;
    const colHeader = " Column            Type      Null %    Uniques    Distribution";
    buffer.setString(innerArea.x, yStart, colHeader, Style.default().bold().withFg(Color.FORGE_CYAN).withBg(Color.FORGE_PANEL));

    const sparkBars = [" ", " ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

    for (let i = 0; i < this._columns.length && i < innerArea.height - 3; i++) {
      const col = this._columns[i];
      const y = yStart + 1 + i;

      // Col name & type badge
      buffer.setString(innerArea.x + 1, y, col.name.padEnd(16).substring(0, 16), Style.default().bold().withFg(Color.WHITE));
      
      const typeColor = col.type === "number" || col.type === "float" ? Color.FORGE_CYAN : col.type === "datetime" ? Color.FORGE_AMBER : Color.GRAY;
      buffer.setString(innerArea.x + 18, y, `[${col.type}]`.padEnd(9), Style.default().withFg(typeColor));

      // Null % indicator with color gradient
      const nullColor = col.nullPercent === 0 ? Color.FORGE_EMERALD : col.nullPercent < 15 ? Color.FORGE_AMBER : Color.RED;
      buffer.setString(innerArea.x + 28, y, `${col.nullPercent.toFixed(1)}%`.padEnd(9), Style.default().withFg(nullColor));

      // Uniques
      buffer.setString(innerArea.x + 38, y, col.uniqueCount.toLocaleString().padEnd(10), Style.default().withFg(Color.WHITE));

      // Mini distribution sparkline
      if (col.sampleDist.length > 0) {
        const max = Math.max(...col.sampleDist, 1);
        for (let s = 0; s < col.sampleDist.length && s < 12; s++) {
          const val = col.sampleDist[s];
          const norm = Math.max(0, Math.min(1, val / max));
          const idx = Math.min(sparkBars.length - 1, Math.floor(norm * (sparkBars.length - 1)));
          buffer.set(innerArea.x + 49 + s, y, sparkBars[idx], Style.default().withFg(Color.FORGE_CYAN));
        }
      }
    }
  }
}
