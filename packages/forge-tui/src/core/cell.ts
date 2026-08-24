import { Color } from "../style/color";

export const enum StyleFlags {
  NONE = 0,
  BOLD = 1 << 0,
  DIM = 1 << 1,
  ITALIC = 1 << 2,
  UNDERLINE = 1 << 3,
  INVERSE = 1 << 4,
  STRIKETHROUGH = 1 << 5,
}

export class Style {
  fg?: Color;
  bg?: Color;
  flags: number;

  constructor(fg?: Color, bg?: Color, flags: number = StyleFlags.NONE) {
    this.fg = fg;
    this.bg = bg;
    this.flags = flags;
  }

  static default(): Style {
    return new Style();
  }

  bold(v: boolean = true): Style {
    return this.setFlag(StyleFlags.BOLD, v);
  }

  dim(v: boolean = true): Style {
    return this.setFlag(StyleFlags.DIM, v);
  }

  italic(v: boolean = true): Style {
    return this.setFlag(StyleFlags.ITALIC, v);
  }

  underline(v: boolean = true): Style {
    return this.setFlag(StyleFlags.UNDERLINE, v);
  }

  inverse(v: boolean = true): Style {
    return this.setFlag(StyleFlags.INVERSE, v);
  }

  private setFlag(flag: StyleFlags, value: boolean): Style {
    const nextFlags = value ? this.flags | flag : this.flags & ~flag;
    return new Style(this.fg, this.bg, nextFlags);
  }

  withFg(fg: Color): Style {
    return new Style(fg, this.bg, this.flags);
  }

  withBg(bg: Color): Style {
    return new Style(this.fg, bg, this.flags);
  }

  equals(other?: Style): boolean {
    if (!other) return false;
    if (this.flags !== other.flags) return false;
    const fgEq = this.fg ? this.fg.equals(other.fg) : other.fg === undefined;
    const bgEq = this.bg ? this.bg.equals(other.bg) : other.bg === undefined;
    return fgEq && bgEq;
  }
}

export class Cell {
  char: string;
  fg?: Color;
  bg?: Color;
  flags: number;

  constructor(char: string = " ", fg?: Color, bg?: Color, flags: number = StyleFlags.NONE) {
    this.char = char;
    this.fg = fg;
    this.bg = bg;
    this.flags = flags;
  }

  static empty(): Cell {
    return new Cell(" ");
  }

  reset(): void {
    this.char = " ";
    this.fg = undefined;
    this.bg = undefined;
    this.flags = StyleFlags.NONE;
  }

  applyStyle(style: Style): this {
    this.fg = style.fg ?? this.fg;
    this.bg = style.bg ?? this.bg;
    this.flags |= style.flags;
    return this;
  }

  equals(other?: Cell): boolean {
    if (!other) return false;
    if (this.char !== other.char || this.flags !== other.flags) return false;
    const fgEq = this.fg ? this.fg.equals(other.fg) : other.fg === undefined;
    const bgEq = this.bg ? this.bg.equals(other.bg) : other.bg === undefined;
    return fgEq && bgEq;
  }
}
