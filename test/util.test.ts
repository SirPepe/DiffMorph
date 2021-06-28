import { createIdGenerator, isAdjacent } from "../src/util";

describe("createIdGenerator()", () => {
  test("unique id generation", () => {
    const generator = createIdGenerator();
    const a = generator(null, "a");
    const b = generator(null, "a");
    const c = generator(null, "a");
    expect(a).not.toBe(b);
    expect(a).not.toBe(c);
    expect(b).not.toBe(c);
  });
});

describe("isAdjacent()", () => {
  test("with two inputs", () => {
    const a = { x: 0, y: 0, width: 1 };
    const b = { x: 1, y: 0, width: 1 };
    const c = { x: 3, y: 0, width: 1 };
    const d = { x: 2, y: 1, width: 1 };
    expect(isAdjacent(a, b)).toBe(true);
    expect(isAdjacent(b, a)).toBe(true);
    expect(isAdjacent(a, c)).toBe(false);
    expect(isAdjacent(c, a)).toBe(false);
    expect(isAdjacent(a, d)).toBe(false);
    expect(isAdjacent(d, a)).toBe(false);
  });

  test("with one input", () => {
    expect(isAdjacent({ x: 0, y: 0, width: 1 }, undefined)).toBe(false);
    expect(isAdjacent(undefined, { x: 0, y: 0, width: 1 })).toBe(false);
  });
});
