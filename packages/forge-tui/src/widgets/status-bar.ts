import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";

export class StatusBar implements Widget {
  private _model: string = "opencode/big-pickle";
  private _agent: string = "dataforge";
  private _tokens: number = 0;
  private _cost: number = 0.0;
  private _status: string = "IDLE";

  model(m: string): this {
    this._model = m;
    return this;
  }

  agent(a: string): this {
    this._agent = a;
    return this;
  }

  tokens(t: number): this {
    this._tokens = t;
    return this;
  }

  cost(c: number): this {
    this._cost = c;
    return this;
  }

  status(s: string): this {
    this._status = s;
    return this;
  }

  render(area: Rect, buffer: Buffer): void {
    if (area.isEmpty()) return;

    const bgStyle = Style.default().withBg(Color.FORGE_PANEL);
    buffer.fill(area, " ", bgStyle);

    // Left info
    const leftText = ` ◢◆◣ DataForge │ Agent: ${this._agent} │ Model: ${this._model} │ Status: [${this._status}] `;
    buffer.setString(area.x, area.y, leftText, Style.default().bold().withFg(Color.FORGE_CYAN).withBg(Color.FORGE_PANEL));

    // Right info (tokens / cost / shortcuts)
    const rightText = ` Tokens: ${this._tokens.toLocaleString()} │ Cost: $${this._cost.toFixed(4)} │ Esc: Exit `;
    const rightX = Math.max(area.x + leftText.length, area.right - rightText.length);
    buffer.setString(rightX, area.y, rightText, Style.default().withFg(Color.FORGE_AMBER).withBg(Color.FORGE_PANEL));
  }
}
