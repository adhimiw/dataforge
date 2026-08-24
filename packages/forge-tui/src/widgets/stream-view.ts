import { Widget } from "./widget";
import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";
import { Style } from "../core/cell";
import { Color } from "../style/color";
import { Block } from "./block";

export class StreamView implements Widget {
  private _tokens: string[] = [];
  private _thinking: string[] = [];
  private _isThinking: boolean = false;
  private _block?: Block;
  private _scrollOffset: number = 0;
  private _autoScroll: boolean = true;

  addToken(token: string): this {
    this._tokens.push(token);
    return this;
  }

  addThinking(thought: string): this {
    this._thinking.push(thought);
    return this;
  }

  setThinkingState(thinking: boolean): this {
    this._isThinking = thinking;
    return this;
  }

  scrollUp(lines: number = 1): this {
    this._autoScroll = false;
    this._scrollOffset = Math.max(0, this._scrollOffset - lines);
    return this;
  }

  scrollDown(lines: number = 1): this {
    this._scrollOffset += lines;
    return this;
  }

  resetScroll(): this {
    this._autoScroll = true;
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

    const renderedLines: { text: string; style: Style }[] = [];

    // 1. Render Thinking Block if present
    if (this._thinking.length > 0) {
      renderedLines.push({
        text: `🧠 Thinking Process (${this._isThinking ? "Streaming..." : "Completed"}):`,
        style: Style.default().bold().withFg(Color.FORGE_AMBER),
      });

      const fullThinking = this._thinking.join("");
      const thinkingLines = fullThinking.split("\n");
      for (const tLine of thinkingLines) {
        renderedLines.push({
          text: `  │ ${tLine}`,
          style: Style.default().dim().withFg(Color.GRAY),
        });
      }
      renderedLines.push({ text: "  ╰───────────────────────────────", style: Style.default().dim().withFg(Color.FORGE_BORDER) });
      renderedLines.push({ text: "", style: Style.default() });
    }

    // 2. Render Assistant Answer Tokens
    const fullContent = this._tokens.join("");
    const contentLines = fullContent.split("\n");
    for (const cLine of contentLines) {
      if (cLine.length <= innerArea.width) {
        renderedLines.push({ text: cLine, style: Style.default().withFg(Color.WHITE) });
      } else {
        // Wrap
        let cur = cLine;
        while (cur.length > innerArea.width) {
          let breakIdx = cur.lastIndexOf(" ", innerArea.width);
          if (breakIdx === -1 || breakIdx === 0) breakIdx = innerArea.width;
          renderedLines.push({ text: cur.substring(0, breakIdx), style: Style.default().withFg(Color.WHITE) });
          cur = cur.substring(breakIdx).trimStart();
        }
        if (cur.length > 0) renderedLines.push({ text: cur, style: Style.default().withFg(Color.WHITE) });
      }
    }

    // Auto-scroll calculation
    const totalLines = renderedLines.length;
    let startLine = 0;
    if (this._autoScroll) {
      startLine = Math.max(0, totalLines - innerArea.height);
    } else {
      startLine = Math.min(Math.max(0, totalLines - innerArea.height), this._scrollOffset);
    }

    for (let i = 0; i < innerArea.height; i++) {
      const lineIdx = startLine + i;
      if (lineIdx < totalLines) {
        const item = renderedLines[lineIdx];
        buffer.setString(innerArea.x, innerArea.y + i, item.text, item.style, innerArea.width);
      }
    }
  }
}
