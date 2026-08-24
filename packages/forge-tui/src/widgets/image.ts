import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";
import { Block } from "./block";

export type ImageMatrix = {
  width: number;
  height: number;
  pixels: number[][][]; // [y][x][r,g,b]
};

export class ImageRasterWidget implements Widget {
  private _matrix?: ImageMatrix;
  private _block?: Block;
  private _title: string = "Python Visual Plot";

  matrix(m: ImageMatrix): this {
    this._matrix = m;
    return this;
  }

  title(t: string): this {
    this._title = t;
    return this;
  }

  block(b: Block): this {
    this._block = b;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty() || !this._matrix || this._matrix.pixels.length === 0) return;

    let innerArea = area;
    if (this._block) {
      this._block.render(area, buffer);
      innerArea = this._block.inner(area);
    }

    if (innerArea.isEmpty()) return;

    const imgW = this._matrix.width;
    const imgH = this._matrix.height;
    const pixels = this._matrix.pixels;

    // Center image inside innerArea
    const targetCols = Math.min(innerArea.width, imgW);
    const targetRows = Math.min(innerArea.height, Math.ceil(imgH / 2));

    const startX = innerArea.x + Math.max(0, Math.floor((innerArea.width - targetCols) / 2));
    const startY = innerArea.y + Math.max(0, Math.floor((innerArea.height - targetRows) / 2));

    // Each character cell renders 2 vertical pixels using '▀' (upper half block)
    // Top pixel = FG color, Bottom pixel = BG color
    for (let r = 0; r < targetRows; r++) {
      const topY = r * 2;
      const bottomY = topY + 1;
      const termY = startY + r;

      if (termY >= innerArea.bottom) break;

      for (let c = 0; c < targetCols; c++) {
        const termX = startX + c;
        if (termX >= innerArea.right) break;

        const topPixel = topY < imgH ? pixels[topY][c] : [0, 0, 0];
        const bottomPixel = bottomY < imgH ? pixels[bottomY][c] : [0, 0, 0];

        const fgColor = new Color(topPixel[0], topPixel[1], topPixel[2]);
        const bgColor = new Color(bottomPixel[0], bottomPixel[1], bottomPixel[2]);

        const style = Style.default().withFg(fgColor).withBg(bgColor);
        buffer.set(termX, termY, "▀", style);
      }
    }
  }
}
