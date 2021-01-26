import { diff } from "../src/diff";

describe("diff", () => {
  test("diffing lines", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" }, // same as before
      { x: 2, y: 0, hash: "a1" }, // same as before
      // missing b0
      { x: 2, y: 2, hash: "c0" }, // increased indent
    ];
    expect(diff(a, b)).toEqual({
      moved: [b[2]],
      added: [],
      deleted: [a[2]],
    });
  });

  test("diffing tokens", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 2, y: 0, hash: "a0" }, // increased indent
      { x: 4, y: 0, hash: "a1" }, // increased indent
      { x: 0, y: 1, hash: "b0" },
      // missing b1
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c1" }, // c0 replaced by c1
    ];
    expect(diff(a, b)).toEqual({
      moved: [b[0], b[1]],
      added: [b[4]],
      deleted: [a[3], a[5]],
    });
  });
});
