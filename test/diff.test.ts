import { diff } from "../src/diff";

describe("diff", () => {
  test("diffing", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 2, y: 2, hash: "c0" },
    ];
    expect(diff(a, b)).toEqual({
      moved: [b[2]],
      added: [],
      deleted: [a[2]],
    });
  });
});
