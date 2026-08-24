import { Color } from "../style/color";
import { StyleFlags } from "./cell";

export class Ansi {
  static readonly CSI = "\x1b[";
  static readonly RESET = "\x1b[0m";

  // Cursor controls
  static cursorPosition(row: number, col: number): string {
    return `${Ansi.CSI}${row + 1};${col + 1}H`;
  }

  static hideCursor(): string {
    return `${Ansi.CSI}?25l`;
  }

  static showCursor(): string {
    return `${Ansi.CSI}?25h`;
  }

  // Screen buffers
  static enterAlternateScreen(): string {
    return `${Ansi.CSI}?1049h`;
  }

  static exitAlternateScreen(): string {
    return `${Ansi.CSI}?1049l`;
  }

  static clearScreen(): string {
    return `${Ansi.CSI}2J${Ansi.CSI}H`;
  }

  static clearLine(): string {
    return `${Ansi.CSI}2K`;
  }

  // Mouse tracking
  static enableMouse(): string {
    return `${Ansi.CSI}?1000h${Ansi.CSI}?1002h${Ansi.CSI}?1006h`;
  }

  static disableMouse(): string {
    return `${Ansi.CSI}?1006l${Ansi.CSI}?1002l${Ansi.CSI}?1000l`;
  }

  // SGR (Select Graphic Rendition) formatter
  static styleToAnsi(fg?: Color, bg?: Color, flags: number = StyleFlags.NONE): string {
    let out = "";
    if (flags & StyleFlags.BOLD) out += `${Ansi.CSI}1m`;
    if (flags & StyleFlags.DIM) out += `${Ansi.CSI}2m`;
    if (flags & StyleFlags.ITALIC) out += `${Ansi.CSI}3m`;
    if (flags & StyleFlags.UNDERLINE) out += `${Ansi.CSI}4m`;
    if (flags & StyleFlags.INVERSE) out += `${Ansi.CSI}7m`;
    if (flags & StyleFlags.STRIKETHROUGH) out += `${Ansi.CSI}9m`;

    if (fg) out += fg.toFgAnsi();
    if (bg) out += bg.toBgAnsi();

    return out;
  }
}
