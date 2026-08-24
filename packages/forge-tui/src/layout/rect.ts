export class Rect {
  x: number;
  y: number;
  width: number;
  height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = Math.max(0, Math.floor(x));
    this.y = Math.max(0, Math.floor(y));
    this.width = Math.max(0, Math.floor(width));
    this.height = Math.max(0, Math.floor(height));
  }

  static zero(): Rect {
    return new Rect(0, 0, 0, 0);
  }

  get left(): number {
    return this.x;
  }

  get right(): number {
    return this.x + this.width;
  }

  get top(): number {
    return this.y;
  }

  get bottom(): number {
    return this.y + this.height;
  }

  get area(): number {
    return this.width * this.height;
  }

  isEmpty(): boolean {
    return this.width === 0 || this.height === 0;
  }

  contains(x: number, y: number): boolean {
    return x >= this.left && x < this.right && y >= this.top && y < this.bottom;
  }

  intersects(other: Rect): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  intersection(other: Rect): Rect {
    const x = Math.max(this.left, other.left);
    const y = Math.max(this.top, other.top);
    const right = Math.min(this.right, other.right);
    const bottom = Math.min(this.bottom, other.bottom);

    if (right <= x || bottom <= y) {
      return Rect.zero();
    }
    return new Rect(x, y, right - x, bottom - y);
  }

  inset(dx: number, dy: number = dx): Rect {
    const nextWidth = Math.max(0, this.width - dx * 2);
    const nextHeight = Math.max(0, this.height - dy * 2);
    return new Rect(this.x + dx, this.y + dy, nextWidth, nextHeight);
  }

  clone(): Rect {
    return new Rect(this.x, this.y, this.width, this.height);
  }
}
