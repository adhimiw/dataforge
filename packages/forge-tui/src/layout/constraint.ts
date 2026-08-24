export type ConstraintType = "length" | "percentage" | "min" | "max" | "ratio" | "fill";

export class Constraint {
  readonly type: ConstraintType;
  readonly value: number;
  readonly secondaryValue?: number;

  private constructor(type: ConstraintType, value: number, secondaryValue?: number) {
    this.type = type;
    this.value = value;
    this.secondaryValue = secondaryValue;
  }

  static length(n: number): Constraint {
    return new Constraint("length", Math.max(0, n));
  }

  static percentage(p: number): Constraint {
    return new Constraint("percentage", Math.max(0, Math.min(100, p)));
  }

  static min(m: number): Constraint {
    return new Constraint("min", Math.max(0, m));
  }

  static max(m: number): Constraint {
    return new Constraint("max", Math.max(0, m));
  }

  static ratio(a: number, b: number): Constraint {
    return new Constraint("ratio", a, b);
  }

  static fill(): Constraint {
    return new Constraint("fill", 1);
  }
}
