import { DoubleBufferRenderer, Frame } from "./renderer";
import { Ansi } from "./ansi";
import { Rect } from "../layout/rect";

export class Terminal {
  private renderer: DoubleBufferRenderer;
  private isRaw: boolean = false;
  private stdout: NodeJS.WriteStream = process.stdout;
  private stdin: NodeJS.ReadStream = process.stdin;

  constructor() {
    const width = this.stdout.columns || 80;
    const height = this.stdout.rows || 24;
    this.renderer = new DoubleBufferRenderer(width, height);
  }

  get size(): Rect {
    return new Rect(0, 0, this.stdout.columns || 80, this.stdout.rows || 24);
  }

  enter(): this {
    if (this.stdin.isTTY && typeof this.stdin.setRawMode === "function") {
      this.stdin.setRawMode(true);
      this.isRaw = true;
    }
    this.stdin.resume();
    this.stdout.write(Ansi.enterAlternateScreen() + Ansi.hideCursor() + Ansi.clearScreen());

    this.stdout.on("resize", () => {
      this.renderer.resize(this.stdout.columns || 80, this.stdout.rows || 24);
    });

    return this;
  }

  exit(): void {
    if (this.isRaw && this.stdin.isTTY && typeof this.stdin.setRawMode === "function") {
      this.stdin.setRawMode(false);
      this.isRaw = false;
    }
    this.stdout.write(Ansi.RESET + Ansi.showCursor() + Ansi.exitAlternateScreen());
  }

  draw(renderFn: (frame: Frame) => void): void {
    const frame = this.renderer.getFrame();
    renderFn(frame);
    this.renderer.renderDiff(this.stdout);

    if (frame.cursorPosition) {
      this.stdout.write(Ansi.cursorPosition(frame.cursorPosition.y, frame.cursorPosition.x) + Ansi.showCursor());
    } else {
      this.stdout.write(Ansi.hideCursor());
    }
  }
}
