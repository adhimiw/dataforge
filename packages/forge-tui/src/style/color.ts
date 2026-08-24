export type RGB = { r: number; g: number; b: number };

export class Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;

  constructor(r: number, g: number, b: number, a: number = 1.0) {
    this.r = Math.max(0, Math.min(255, Math.round(r)));
    this.g = Math.max(0, Math.min(255, Math.round(g)));
    this.b = Math.max(0, Math.min(255, Math.round(b)));
    this.a = Math.max(0, Math.min(1.0, a));
  }

  static rgb(r: number, g: number, b: number, a: number = 1.0): Color {
    return new Color(r, g, b, a);
  }

  static hex(hex: string): Color {
    let cleaned = hex.replace("#", "").trim();
    if (cleaned.length === 3) {
      cleaned = cleaned.split("").map((c) => c + c).join("");
    }
    if (cleaned.length === 6) {
      const num = parseInt(cleaned, 16);
      return new Color((num >> 16) & 255, (num >> 8) & 255, num & 255);
    }
    if (cleaned.length === 8) {
      const num = parseInt(cleaned, 16);
      return new Color((num >> 24) & 255, (num >> 16) & 255, (num >> 8) & 255, (num & 255) / 255);
    }
    return Color.WHITE;
  }

  static lerp(a: Color, b: Color, t: number): Color {
    const clamped = Math.max(0, Math.min(1, t));
    return new Color(
      a.r + (b.r - a.r) * clamped,
      a.g + (b.g - a.g) * clamped,
      a.b + (b.b - a.b) * clamped,
      a.a + (b.a - a.a) * clamped
    );
  }

  toFgAnsi(): string {
    return `\x1b[38;2;${this.r};${this.g};${this.b}m`;
  }

  toBgAnsi(): string {
    return `\x1b[48;2;${this.r};${this.g};${this.b}m`;
  }

  equals(other?: Color): boolean {
    if (!other) return false;
    return this.r === other.r && this.g === other.g && this.b === other.b && this.a === other.a;
  }

  // Common Palettes
  static readonly RESET = new Color(0, 0, 0, 0);
  static readonly BLACK = Color.hex("#000000");
  static readonly WHITE = Color.hex("#ffffff");
  static readonly TRANSPARENT = new Color(0, 0, 0, 0);
  
  // Terminal Standard Colors
  static readonly RED = Color.hex("#ff5555");
  static readonly GREEN = Color.hex("#50fa7b");
  static readonly YELLOW = Color.hex("#f1fa8c");
  static readonly BLUE = Color.hex("#bd93f9");
  static readonly MAGENTA = Color.hex("#ff79c6");
  static readonly CYAN = Color.hex("#8be9fd");
  static readonly GRAY = Color.hex("#6272a4");
  static readonly DARK_GRAY = Color.hex("#282a36");
  
  // DataForge Brand Accents
  static readonly FORGE_CYAN = Color.hex("#00e5ff");
  static readonly FORGE_EMERALD = Color.hex("#00e676");
  static readonly FORGE_AMBER = Color.hex("#ffab00");
  static readonly FORGE_PURPLE = Color.hex("#d500f9");
  static readonly FORGE_PANEL = Color.hex("#131722");
  static readonly FORGE_BG = Color.hex("#0b0e14");
  static readonly FORGE_BORDER = Color.hex("#232936");
}
