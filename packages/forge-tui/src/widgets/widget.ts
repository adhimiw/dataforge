import { Rect } from "../layout/rect";
import { Buffer } from "../core/buffer";

export interface Widget {
  render(area: Rect, buffer: Buffer): void;
}
