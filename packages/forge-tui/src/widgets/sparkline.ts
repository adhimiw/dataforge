import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";

const BARS = [" ", " ", "▂", "▃", "▄", "▅", "▆", "▇", "█"];

export class Sparkline implements Widget {
  private _data: number[] = [];
  private _style: Style = Style.default().withFg(Color.FORGE_CYAN);
  private _max?: number;

  data(d: number[]): this {
    this._data = d;
    return this;
  }

  style(s: Style): this {
    this._style = s;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty() || this._data.length === 0) return;

    const max = this._max ?? Math.max(...this._data, 1);
    const min = Math.min(...this._data, 0);
    const range = max - min || 1;

    const visibleData = this._data.slice(-area.width);

    for (let i = 0; i < visibleData.length; i++) {
      const val = visibleData[i];
      const normalized = Math.max(0, Math.min(1, (val - min) / range));
      const barIdx = Math.min(BARS.length - 1, Math.floor(normalized * (BARS.length - 1)));
      buffer.set(area.x + i, area.y, BARS[barIdx], this._style);
    }
  }
}
