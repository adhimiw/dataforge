import { Color } from "./color";
import { Style } from "../core/cell";

export class XperiaTheme {
  // Sony Xperia SST Color Spectrum
  static readonly OBSIDIAN_BG = Color.hex("#090b10");
  static readonly SURFACE_SLATE = Color.hex("#11151f");
  static readonly SURFACE_ELEVATED = Color.hex("#181e2b");
  static readonly BORDER_SUBTLE = Color.hex("#1f2738");
  static readonly BORDER_ACTIVE = Color.hex("#00d2ff");

  // Accent Tones
  static readonly XPERIA_CYAN = Color.hex("#00d2ff");
  static readonly SONY_RED = Color.hex("#e60012");
  static readonly SONY_GOLD = Color.hex("#ffb300");
  static readonly SONY_EMERALD = Color.hex("#00e676");
  static readonly SONY_PURPLE = Color.hex("#b388ff");

  // Typography
  static readonly TEXT_PRIMARY = Color.hex("#f0f6fc");
  static readonly TEXT_MUTED = Color.hex("#7d8590");
  static readonly TEXT_DIM = Color.hex("#484f58");

  // Style Presets
  static readonly TITLE = Style.default().bold().withFg(XperiaTheme.XPERIA_CYAN);
  static readonly SUBTITLE = Style.default().dim().withFg(XperiaTheme.TEXT_MUTED);
  static readonly BADGE = Style.default().bold().withFg(Color.BLACK).withBg(XperiaTheme.XPERIA_CYAN);
  static readonly ERROR_BADGE = Style.default().bold().withFg(Color.WHITE).withBg(XperiaTheme.SONY_RED);
}
