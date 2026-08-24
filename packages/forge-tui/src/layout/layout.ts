import { Rect } from "./rect";
import { Constraint } from "./constraint";

export type Direction = "horizontal" | "vertical";

export class Layout {
  private _direction: Direction = "vertical";
  private _constraints: Constraint[] = [];
  private _margin: number = 0;
  private _spacing: number = 0;

  static vertical(): Layout {
    const l = new Layout();
    l._direction = "vertical";
    return l;
  }

  static horizontal(): Layout {
    const l = new Layout();
    l._direction = "horizontal";
    return l;
  }

  direction(d: Direction): this {
    this._direction = d;
    return this;
  }

  constraints(c: Constraint[]): this {
    this._constraints = c;
    return this;
  }

  margin(m: number): this {
    this._margin = m;
    return this;
  }

  spacing(s: number): this {
    this._spacing = s;
    return this;
  }

  split(area: Rect): Rect[] {
    const insetArea = this._margin > 0 ? area.inset(this._margin) : area;
    if (this._constraints.length === 0 || insetArea.isEmpty()) {
      return [];
    }

    const isVert = this._direction === "vertical";
    const totalSpace = isVert ? insetArea.height : insetArea.width;
    const spacingTotal = (this._constraints.length - 1) * this._spacing;
    const availableSpace = Math.max(0, totalSpace - spacingTotal);

    const sizes: number[] = new Array(this._constraints.length).fill(0);
    let remaining = availableSpace;
    let fillCount = 0;

    // 1st pass: fixed length & percentage
    for (let i = 0; i < this._constraints.length; i++) {
      const c = this._constraints[i];
      if (c.type === "length") {
        const sz = Math.min(remaining, c.value);
        sizes[i] = sz;
        remaining -= sz;
      } else if (c.type === "percentage") {
        const sz = Math.min(remaining, Math.round((c.value / 100) * availableSpace));
        sizes[i] = sz;
        remaining -= sz;
      } else if (c.type === "fill" || c.type === "min" || c.type === "ratio") {
        fillCount++;
      }
    }

    // 2nd pass: distribute remaining among fill / min / ratio
    if (fillCount > 0 && remaining > 0) {
      const share = Math.floor(remaining / fillCount);
      let extra = remaining % fillCount;
      for (let i = 0; i < this._constraints.length; i++) {
        const c = this._constraints[i];
        if (c.type === "fill" || c.type === "min" || c.type === "ratio") {
          let sz = share + (extra > 0 ? 1 : 0);
          if (extra > 0) extra--;
          if (c.type === "min") sz = Math.max(c.value, sz);
          sizes[i] = sz;
        }
      }
    }

    // 3rd pass: Build final Rects
    const results: Rect[] = [];
    let currentOffset = isVert ? insetArea.y : insetArea.x;

    for (let i = 0; i < this._constraints.length; i++) {
      const size = sizes[i];
      if (isVert) {
        results.push(new Rect(insetArea.x, currentOffset, insetArea.width, size));
      } else {
        results.push(new Rect(currentOffset, insetArea.y, size, insetArea.height));
      }
      currentOffset += size + this._spacing;
    }

    return results;
  }
}
