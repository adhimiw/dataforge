import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";

export type BorderStyle = "rounded" | "single" | "double" | "heavy" | "ascii" | "none";
export type Alignment = "left" | "center" | "right";

const BORDERS = {
  rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
  single: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
  double: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
  heavy: { tl: "┏", tr: "┓", bl: "┗", br: "┛", h: "━", v: "┃" },
  ascii: { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" },
  none: { tl: " ", tr: " ", bl: " ", br: " ", h: " ", v: " " },
};

export class Block implements Widget {
  private _title?: string;
  private _titleAlign: Alignment = "left";
  private _titleStyle: Style = Style.default().bold().withFg(Color.FORGE_CYAN);
  private _borderType: BorderStyle = "rounded";
  private _borderStyle: Style = Style.default().withFg(Color.FORGE_BORDER);
  private _bgStyle?: Style;

  title(t: string, align: Alignment = "left", style?: Style): this {
    this._title = t;
    this._titleAlign = align;
    if (style) this._titleStyle = style;
    return this;
  }

  border(type: BorderStyle = "rounded", style?: Style): this {
    this._borderType = type;
    if (style) this._borderStyle = style;
    return this;
  }

  background(bg: Color): this {
    this._bgStyle = Style.default().withBg(bg);
    return this;
  }

  inner(area: Rect): Rect {
    if (this._borderType === "none") return area;
    return area.inset(1);
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty()) return;

    if (this._bgStyle) {
      buffer.fill(area, " ", this._bgStyle);
    }

    if (this._borderType !== "none") {
      const b = BORDERS[this._borderType];
      const style = this._borderStyle;

      // Corners
      buffer.set(area.x, area.y, b.tl, style);
      buffer.set(area.right - 1, area.y, b.tr, style);
      buffer.set(area.x, area.bottom - 1, b.bl, style);
      buffer.set(area.right - 1, area.bottom - 1, b.br, style);

      // Horizontal borders
      for (let x = area.x + 1; x < area.right - 1; x++) {
        buffer.set(x, area.y, b.h, style);
        buffer.set(x, area.bottom - 1, b.h, style);
      }

      // Vertical borders
      for (let y = area.y + 1; y < area.bottom - 1; y++) {
        buffer.set(area.x, y, b.v, style);
        buffer.set(area.right - 1, y, b.v, style);
      }
    }

    // Render Title
    if (this._title && area.width > 4) {
      const formattedTitle = ` ${this._title} `;
      let titleX = area.x + 2;

      if (this._titleAlign === "center") {
        titleX = Math.max(area.x + 1, area.x + Math.floor((area.width - formattedTitle.length) / 2));
      } else if (this._titleAlign === "right") {
        titleX = Math.max(area.x + 1, area.right - formattedTitle.length - 2);
      }

      buffer.setString(titleX, area.y, formattedTitle, this._titleStyle, area.width - 4);
    }
  }
}
