import { isAdjacent } from "../../src/lib/util";
import { stubBox } from "../helpers";

describe("isAdjacent", () => {
  test("without parents", () => {
    const a = { x: 0, y: 0, text: "a", parent: undefined };
    const b = { x: 1, y: 0, text: "b", parent: undefined };
    const c = { x: 3, y: 0, text: "c", parent: undefined };
    const d = { x: 2, y: 1, text: "d", parent: undefined };
    expect(isAdjacent(a, b)).toBe(true);
    expect(isAdjacent(b, a)).toBe(true);
    expect(isAdjacent(a, c)).toBe(false);
    expect(isAdjacent(c, a)).toBe(false);
    expect(isAdjacent(a, d)).toBe(false);
    expect(isAdjacent(d, a)).toBe(false);
  });

  test("without identical parents", () => {
    const parent = stubBox({ x: 2, y: 2, parent: undefined });
    const a = { x: 0, y: 0, text: "a", parent };
    const b = { x: 1, y: 0, text: "b", parent };
    expect(isAdjacent(a, b)).toBe(true);
    expect(isAdjacent(b, a)).toBe(true);
  });

  test("with parent tree via absolute coordinates", () => {
    const root = stubBox({ x: 0, y: 0, parent: undefined });
    const nested = stubBox({ x: 2, y: 2, parent: root });
    const a = { x: 1, y: 2, text: "a", parent: root };
    const b = { x: 0, y: 0, text: "b", parent: nested };
    expect(isAdjacent(a, b)).toBe(true);
    expect(isAdjacent(b, a)).toBe(true);
  });
});
