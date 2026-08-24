import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";
import { Block } from "./block";

export class PromptInput implements Widget {
  private _value: string = "";
  private _cursorPos: number = 0;
  private _placeholder: string = "Type a command or message (e.g. /inspect, /analyze, /notebook)...";
  private _block?: Block;
  private _isFocused: boolean = true;

  value(v: string): this {
    this._value = v;
    this._cursorPos = v.length;
    return this;
  }

  cursor(pos: number): this {
    this._cursorPos = Math.max(0, Math.min(this._value.length, pos));
    return this;
  }

  placeholder(p: string): this {
    this._placeholder = p;
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

    // Prompt symbol
    const promptSymbol = "❯ ";
    buffer.setString(innerArea.x, innerArea.y, promptSymbol, Style.default().bold().withFg(Color.FORGE_CYAN));

    const textX = innerArea.x + promptSymbol.length;
    const availableWidth = innerArea.width - promptSymbol.length;

    if (this._value.length === 0) {
      buffer.setString(textX, innerArea.y, this._placeholder, Style.default().dim().withFg(Color.GRAY), availableWidth);
    } else {
      buffer.setString(textX, innerArea.y, this._value, Style.default().withFg(Color.WHITE), availableWidth);
    }
  }
}
