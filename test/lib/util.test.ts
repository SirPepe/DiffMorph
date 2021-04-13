import { isAdjacent, spliceBoxContent } from "../../src/lib/util";
import { Box } from "../../src/types";

type SpliceTest = {
  parent: Box<SpliceTest, any>;
  next: SpliceTest | undefined;
};

describe("spliceBoxContent", () => {
  test("splice inside of a box", () => {
    const box: Box<SpliceTest, any> = {
      kind: "BOX" as const,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hash: "foo",
      id: "foo0",
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const d = { value: "d", parent: box, next: undefined };
    const c = { value: "c", parent: box, next: d };
    const b = { value: "b", parent: box, next: c };
    const a = { value: "a", parent: box, next: b };
    box.content = [a, b, c, d];
    spliceBoxContent<SpliceTest, any>(a, 2, (parent) => ({ ...parent }));
    expect(box.content).toEqual([
      expect.objectContaining({ content: [a, b] }),
      c,
      d,
    ]);
  });

  test("splice across boxes", () => {
    const parent: Box<SpliceTest, any> = {
      kind: "BOX" as const,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hash: "parent",
      id: "parent0",
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const box1: Box<SpliceTest, any> = {
      kind: "BOX" as const,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hash: "box1",
      id: "box10",
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const box2: Box<SpliceTest, any> = {
      kind: "BOX" as const,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hash: "box2",
      id: "box20",
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const g = { value: "g", parent: box2, next: undefined };
    const f = { value: "f", parent: box2, next: g };
    const e = { value: "e", parent: box2, next: f };
    const d = { value: "d", parent: box1, next: e };
    const c = { value: "c", parent: box1, next: d };
    const b = { value: "b", parent: box1, next: c };
    const a = { value: "a", parent: box1, next: b };
    box1.content = [a, b, c, d];
    box2.content = [e, f, g];
    parent.content = [box1, box2];
    spliceBoxContent<SpliceTest, any>(c, 4, (parent) => ({ ...parent }));
    expect(parent.content.length).toBe(2);
    expect(parent.content[0]).toBe(box1);
    expect(parent.content[1]).toBe(box2);
    expect(box1.content).toEqual([
      a,
      b,
      expect.objectContaining({ content: [c, d] }),
    ]);
    expect(box2.content).toEqual([
      expect.objectContaining({ content: [e, f] }),
      g,
    ]);
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
