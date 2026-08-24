import { expect, test, describe } from "bun:test";
import { Rect, Layout, Constraint, Color, Buffer, DoubleBufferRenderer, Block, Paragraph } from "../src/index";

describe("ForgeTUI Immediate-Mode Engine", () => {
  test("Rect calculations and insets", () => {
    const r = new Rect(10, 10, 100, 50);
    expect(r.area).toBe(5000);
    expect(r.left).toBe(10);
    expect(r.right).toBe(110);

    const inset = r.inset(2);
    expect(inset.x).toBe(12);
    expect(inset.y).toBe(12);
    expect(inset.width).toBe(96);
    expect(inset.height).toBe(46);
  });

  test("Immediate-mode Layout split solver", () => {
    const root = new Rect(0, 0, 100, 100);
    const chunks = Layout.vertical()
      .constraints([
        Constraint.length(10),
        Constraint.percentage(50),
        Constraint.fill(),
      ])
      .split(root);

    expect(chunks.length).toBe(3);
    expect(chunks[0].height).toBe(10);
    expect(chunks[1].height).toBe(50);
    expect(chunks[2].height).toBe(40);
  });

  test("Double-buffer Diff rendering", () => {
    const area = new Rect(0, 0, 20, 5);
    const renderer = new DoubleBufferRenderer(20, 5);
    const frame = renderer.getFrame();

    const block = new Block().title("Test", "center");
    frame.renderWidget(block, area);

    const p = Paragraph.text("Hello World");
    frame.renderWidget(p, block.inner(area));

    expect(frame.buffer.get(0, 0)?.char).toBe("╭");
    expect(frame.buffer.get(19, 0)?.char).toBe("╮");
  });
});
