import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";
import { Block } from "./block";

export type DataPoint = {
  label: string;
  value: number;
  color?: Color;
};

export class BarChart implements Widget {
  private _data: DataPoint[] = [];
  private _block?: Block;
  private _barWidth: number = 3;
  private _gap: number = 2;
  private _max?: number;
  private _direction: "vertical" | "horizontal" = "vertical";

  data(d: DataPoint[]): this {
    this._data = d;
    return this;
  }

  direction(dir: "vertical" | "horizontal"): this {
    this._direction = dir;
    return this;
  }

  barWidth(w: number): this {
    this._barWidth = Math.max(1, w);
    return this;
  }

  gap(g: number): this {
    this._gap = Math.max(0, g);
    return this;
  }

  block(b: Block): this {
    this._block = b;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty() || this._data.length === 0) return;

    let innerArea = area;
    if (this._block) {
      this._block.render(area, buffer);
      innerArea = this._block.inner(area);
    }

    if (innerArea.isEmpty()) return;

    const maxVal = this._max ?? Math.max(...this._data.map((d) => d.value), 1);

    if (this._direction === "horizontal") {
      this.renderHorizontal(innerArea, buffer, maxVal);
    } else {
      this.renderVertical(innerArea, buffer, maxVal);
    }
  }

  private renderHorizontal(area: Rect, buffer: Buffer, maxVal: number): void {
    const blocks = ["▏", "▎", "▍", "▌", "▋", "▊", "▉", "█"];
    const maxBarLen = Math.max(10, area.width - 24);

    for (let i = 0; i < this._data.length && i < area.height; i++) {
      const item = this._data[i];
      const y = area.y + i;

      // Label
      const label = item.label.padEnd(14).substring(0, 14);
      buffer.setString(area.x, y, label, Style.default().bold().withFg(Color.WHITE));

      // Bar
      const norm = Math.max(0, Math.min(1, item.value / maxVal));
      const fullBlocks = Math.floor(norm * maxBarLen);
      const fracIdx = Math.floor((norm * maxBarLen - fullBlocks) * blocks.length);

      const color = item.color ?? Color.FORGE_CYAN;
      const barStyle = Style.default().withFg(color);

      let curX = area.x + 15;
      for (let b = 0; b < fullBlocks; b++) {
        buffer.set(curX++, y, "█", barStyle);
      }
      if (fracIdx > 0 && curX < area.x + 15 + maxBarLen) {
        buffer.set(curX++, y, blocks[fracIdx], barStyle);
      }

      // Value label
      const valStr = ` ${item.value.toLocaleString()}`;
      buffer.setString(curX, y, valStr, Style.default().dim().withFg(Color.FORGE_AMBER));
    }
  }

  private renderVertical(area: Rect, buffer: Buffer, maxVal: number): void {
    const vBlocks = [" ", " ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
    const chartHeight = area.height - 2; // reserve 2 rows for labels
    if (chartHeight <= 0) return;

    let curX = area.x + 1;
    for (let i = 0; i < this._data.length; i++) {
      if (curX + this._barWidth >= area.right) break;
      const item = this._data[i];
      const norm = Math.max(0, Math.min(1, item.value / maxVal));
      const totalUnits = norm * chartHeight;
      const fullRows = Math.floor(totalUnits);
      const frac = totalUnits - fullRows;
      const fracIdx = Math.min(vBlocks.length - 1, Math.floor(frac * (vBlocks.length - 1)));

      const color = item.color ?? Color.FORGE_CYAN;
      const barStyle = Style.default().withFg(color);

      for (let r = 0; r < chartHeight; r++) {
        const y = area.y + chartHeight - 1 - r;
        if (r < fullRows) {
          for (let w = 0; w < this._barWidth; w++) {
            buffer.set(curX + w, y, "█", barStyle);
          }
        } else if (r === fullRows && fracIdx > 0) {
          for (let w = 0; w < this._barWidth; w++) {
            buffer.set(curX + w, y, vBlocks[fracIdx], barStyle);
          }
        }
      }

      // Label at bottom
      const label = item.label.substring(0, this._barWidth);
      buffer.setString(curX, area.bottom - 1, label, Style.default().dim().withFg(Color.WHITE));

      curX += this._barWidth + this._gap;
    }
  }
}

export class LineChart implements Widget {
  private _series: { name: string; data: number[]; color: Color }[] = [];
  private _block?: Block;
  private _labels: string[] = [];

  series(name: string, data: number[], color: Color = Color.FORGE_CYAN): this {
    this._series.push({ name, data, color });
    return this;
  }

  labels(l: string[]): this {
    this._labels = l;
    return this;
  }

  block(b: Block): this {
    this._block = b;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty() || this._series.length === 0) return;

    let innerArea = area;
    if (this._block) {
      this._block.render(area, buffer);
      innerArea = this._block.inner(area);
    }

    if (innerArea.isEmpty() || innerArea.height < 4) return;

    // Find global min & max
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const s of this._series) {
      for (const v of s.data) {
        if (v < minVal) minVal = v;
        if (v > maxVal) maxVal = v;
      }
    }
    if (minVal === maxVal) maxVal = minVal + 1;
    const range = maxVal - minVal;

    const yAxisWidth = 8;
    const chartArea = new Rect(
      innerArea.x + yAxisWidth,
      innerArea.y + 1,
      innerArea.width - yAxisWidth - 1,
      innerArea.height - 3
    );

    // 1. Render Y-Axis & Gridlines
    const ySteps = 3;
    for (let i = 0; i <= ySteps; i++) {
      const norm = i / ySteps;
      const y = Math.round(chartArea.bottom - 1 - norm * (chartArea.height - 1));
      const val = minVal + norm * range;
      const valStr = formatNumber(val).padStart(yAxisWidth - 1);
      buffer.setString(innerArea.x, y, valStr, Style.default().dim().withFg(Color.GRAY));
      buffer.set(innerArea.x + yAxisWidth - 1, y, "┤", Style.default().withFg(Color.FORGE_BORDER));

      // Light horizontal gridline
      for (let x = chartArea.left; x < chartArea.right; x++) {
        const curCell = buffer.get(x, y);
        if (!curCell || curCell.char === " ") {
          buffer.set(x, y, "┄", Style.default().withFg(Color.hex("#1a2130")));
        }
      }
    }

    // 2. Render Multi-series Data Points
    for (const s of this._series) {
      const dataLen = s.data.length;
      if (dataLen === 0) continue;

      const style = Style.default().bold().withFg(s.color);
      let lastX = -1;
      let lastY = -1;

      for (let i = 0; i < dataLen; i++) {
        const xNorm = dataLen > 1 ? i / (dataLen - 1) : 0.5;
        const x = Math.round(chartArea.left + xNorm * (chartArea.width - 1));
        const yNorm = (s.data[i] - minVal) / range;
        const y = Math.round(chartArea.bottom - 1 - yNorm * (chartArea.height - 1));

        buffer.set(x, y, "●", style);

        // Simple line connection between points
        if (lastX !== -1 && x > lastX + 1) {
          const dx = x - lastX;
          const dy = y - lastY;
          for (let step = 1; step < dx; step++) {
            const ix = lastX + step;
            const iy = Math.round(lastY + (dy * step) / dx);
            buffer.set(ix, iy, "─", Style.default().withFg(s.color));
          }
        }

        lastX = x;
        lastY = y;
      }
    }

    // 3. Render X-Axis Labels & Legend
    if (this._labels.length > 0) {
      const labelStep = Math.max(1, Math.floor(this._labels.length / 5));
      for (let i = 0; i < this._labels.length; i += labelStep) {
        const xNorm = i / (this._labels.length - 1);
        const x = Math.round(chartArea.left + xNorm * (chartArea.width - 1));
        const lbl = this._labels[i];
        buffer.setString(Math.max(chartArea.left, x - Math.floor(lbl.length / 2)), innerArea.bottom - 1, lbl, Style.default().dim().withFg(Color.WHITE));
      }
    }

    // Top Legend
    let legX = innerArea.x + yAxisWidth;
    for (const s of this._series) {
      buffer.setString(legX, innerArea.y, `■ ${s.name}  `, Style.default().bold().withFg(s.color));
      legX += s.name.length + 5;
    }
  }
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toFixed(0);
}
