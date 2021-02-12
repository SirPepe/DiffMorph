import { diff } from "../src/diff";

describe("diff lines", () => {
  test("diffing lines (addition at end)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } }, // new line!
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [b[3]],
      deleted: [],
    });
  });

  test("diffing lines (removal at end)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      // missing c0
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [],
      deleted: [a[3]],
    });
  });

  test("diffing lines (changed indent)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } }, // decreased indent
      { x: 2, y: 2, hash: "c0", parent: { hash: 0 } }, // increased indent
    ];
    expect(diff(a, b)).toEqual({
      moved: [b[2], b[3]],
      added: [],
      deleted: [],
    });
  });

  test("diffing lines (swap on y axis)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 2, hash: "b0", parent: { hash: 0 } }, // was: y1
      { x: 0, y: 1, hash: "c0", parent: { hash: 0 } }, // was: y2
    ];
    expect(diff(a, b)).toEqual({
      moved: [b[2], b[3]],
      added: [],
      deleted: [],
    });
  });
});

describe("diff tokens", () => {
  test("diffing tokens (addition at end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [b[1]],
      deleted: [],
    });
  });

  test("diffing tokens (removal from end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [],
      deleted: [a[1]],
    });
  });

  test("diffing tokens (replacement at end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "aX", parent: { hash: 0 } }, // was: a1
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b2", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [b[1]],
      deleted: [a[1]],
    });
  });

  test("diffing tokens (replacement in middle of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a2", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, hash: "aX", parent: { hash: 0 } }, // was: a1
      { x: 2, y: 0, hash: "a2", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [b[1]],
      deleted: [a[1]],
    });
  });

  test("diffing tokens (movement at end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a2", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 1, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 4, y: 0, hash: "a2", parent: { hash: 0 } }, // was: x === 2
      { x: 0, y: 1, hash: "b0", parent: { hash: 0 } },
      { x: 0, y: 2, hash: "c0", parent: { hash: 0 } },
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [b[2]],
      deleted: [a[2]],
    });
  });

  test("diffing tokens belonging to different parents", () => {
    const a = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 0 } },
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "a0", parent: { hash: 1 } },
      { x: 2, y: 1, hash: "a1", parent: { hash: 1 } },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0", parent: { hash: 1 } }, // switch with other a0
      { x: 2, y: 0, hash: "a1", parent: { hash: 0 } },
      { x: 0, y: 1, hash: "a0", parent: { hash: 0 } }, // switch with other a0
      { x: 2, y: 1, hash: "a1", parent: { hash: 1 } },
    ];
    expect(diff(a, b)).toEqual({
      moved: [],
      added: [b[2], b[0]],
      deleted: [a[0], a[2]],
    });
  });
});
