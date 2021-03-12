import { diff, diffAll } from "../../src/lib/diff";
import { TokenLike } from "../../src/types";

// Makes creating linked lists simpler
function link<T extends TokenLike>(list: Omit<T, "prev" | "next">[]): T[] {
  for (let i = 0; i < list.length; i++) {
    (list[i] as any).next = list[i + 1];
    (list[i] as any).prev = list[i - 1];
  }
  return list as any;
}

describe("diff lines", () => {
  test("diffing lines (addition at end)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } }, // new line!
    ]);
    expect(diff(a, b)).toEqual([{ type: "ADD", item: b[3] }]);
  });

  test("diffing lines (removal at end)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      // missing c0
    ]);
    expect(diff(a, b)).toEqual([{ type: "DEL", item: a[3] }]);
  });

  test("diffing lines (changed indent)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } }, // decreased indent
      { x: 2, y: 2, size: 1, hash: "c0", parent: { hash: 0 } }, // increased indent
    ]);
    expect(diff(a, b)).toEqual([
      { type: "MOV", item: b[2], ref: a[2] },
      { type: "MOV", item: b[3], ref: a[3] },
    ]);
  });

  test("diffing lines (swap on y axis)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 2, size: 1, hash: "b0", parent: { hash: 0 } }, // was: y1
      { x: 0, y: 1, size: 1, hash: "c0", parent: { hash: 0 } }, // was: y2
    ]);
    expect(diff(a, b)).toEqual([
      { type: "MOV", item: b[2], ref: a[2] },
      { type: "MOV", item: b[3], ref: a[3] },
    ]);
  });
});

describe("diff tokens", () => {
  test("diffing tokens (addition at end of line)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    expect(diff(a, b)).toEqual([{ type: "ADD", item: b[1] }]);
  });

  test("diffing tokens (removal from end of line)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    expect(diff(a, b)).toEqual([{ type: "DEL", item: a[1] }]);
  });

  test("diffing tokens (replacement at end of line)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "aX", parent: { hash: 0 } }, // was: a1
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    expect(diff(a, b)).toEqual([
      { type: "DEL", item: a[1] },
      { type: "ADD", item: b[1] },
    ]);
  });

  test("diffing tokens (replacement in middle of line)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a2", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, size: 1, hash: "aX", parent: { hash: 0 } }, // was: a1
      { x: 2, y: 0, size: 1, hash: "a2", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    expect(diff(a, b)).toEqual([
      { type: "DEL", item: a[1] },
      { type: "ADD", item: b[1] },
    ]);
  });

  test("diffing tokens (movement at end of line)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a2", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 0, size: 1, hash: "a2", parent: { hash: 0 } }, // was: x === 2
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    expect(diff(a, b)).toEqual([
      { type: "DEL", item: a[2] },
      { type: "ADD", item: b[2] },
    ]);
  });

  test("diffing tokens belonging to different parents", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "a0", parent: { hash: 1 } },
      { x: 2, y: 1, size: 1, hash: "a1", parent: { hash: 1 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 1 } }, // switch with other a0
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "a0", parent: { hash: 0 } }, // switch with other a0
      { x: 2, y: 1, size: 1, hash: "a1", parent: { hash: 1 } },
    ]);
    expect(diff(a, b)).toEqual([
      { type: "DEL", item: a[0] },
      { type: "ADD", item: b[2] },
      { type: "DEL", item: a[2] },
      { type: "ADD", item: b[0] },
    ]);
  });
});

describe("diff across multiple frames", () => {
  test("diffing lines (addition at end)", () => {
    const a = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
    ]);
    const b = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } }, // new line!
    ]);
    const c = link([
      { x: 0, y: 0, size: 1, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, size: 1, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      { x: 2, y: 1, size: 1, hash: "b1", parent: { hash: 0 } }, // new item!
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    const d = link([
      { x: 6, y: 0, size: 1, hash: "a0", parent: { hash: 0 } }, // indent
      { x: 8, y: 0, size: 1, hash: "a1", parent: { hash: 0 } }, // indent
      { x: 0, y: 1, size: 1, hash: "b0", parent: { hash: 0 } },
      // b1 went away
      { x: 0, y: 2, size: 1, hash: "c0", parent: { hash: 0 } },
    ]);
    expect(diffAll([a, b, c, d])).toEqual([
      [
        { type: "ADD", item: a[0] },
        { type: "ADD", item: a[1] },
        { type: "ADD", item: a[2] },
      ],
      [{ type: "ADD", item: b[3] }],
      [{ type: "ADD", item: c[3] }],
      [
        { type: "MOV", item: d[0], ref: c[0] },
        { type: "MOV", item: d[1], ref: c[1] },
        { type: "DEL", item: c[3] },
      ],
    ]);
  });
});
