import { createIdGenerator, isAdjacent, spliceBoxContent } from "../src/util";
import { Box, Token } from "../src/types";

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

type SpliceTest = Token & {
  parent: Box<SpliceTest, any>;
  next: SpliceTest | undefined;
};

describe("spliceBoxContent", () => {
  test("splice inside of a box at the start", () => {
    const box: Box<SpliceTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "test",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const d = {
      value: "d",
      x: 3,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: undefined,
    };
    const c = {
      value: "c",
      x: 2,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: d,
    };
    const b = {
      value: "b",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: c,
    };
    const a = {
      value: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: b,
    };
    box.content = [a, b, c, d];
    spliceBoxContent<SpliceTest, any>(a, 2, (parent) => ({ ...parent }));
    expect(box.content).toEqual([
      expect.objectContaining({
        x: 0,
        y: 0,
        width: 2,
        height: 1,
        content: [
          { ...a, x: 0, y: 0 },
          { ...b, x: 1, y: 0 },
        ],
      }),
      c,
      d,
    ]);
  });

  test("splice inside of a box somewhere in the middle", () => {
    const box: Box<SpliceTest, any> = {
      x: 0,
      y: 0,
      width: 4,
      height: 1,
      data: {},
      language: "test",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const d = {
      value: "d",
      x: 3,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: undefined,
    };
    const c = {
      value: "c",
      x: 2,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: d,
    };
    const b = {
      value: "b",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: c,
    };
    const a = {
      value: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: b,
    };
    box.content = [a, b, c, d];
    spliceBoxContent<SpliceTest, any>(b, 2, (parent) => ({ ...parent }));
    expect(box.content).toEqual([
      a,
      expect.objectContaining({
        x: 1,
        y: 0,
        width: 2,
        height: 1,
        content: [b, c],
      }),
      d,
    ]);
  });

  test("nothing to splice", () => {
    const box: Box<SpliceTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const d = {
      value: "d",
      x: 3,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: undefined,
    };
    const c = {
      value: "c",
      x: 2,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: d,
    };
    const b = {
      value: "b",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: c,
    };
    const a = {
      value: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      parent: box,
      next: b,
    };
    box.content = [a, b, c, d];
    spliceBoxContent<SpliceTest, any>(undefined as any, 0, (parent) => ({
      ...parent,
    }));
    expect(box.content).toEqual([a, b, c, d]);
  });

  test("splice across boxes", () => {
    const parent: Box<SpliceTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const box1: Box<SpliceTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const box2: Box<SpliceTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "css",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const g = { value: "g", x: 6, y: 0, width: 1, height: 1, parent: box2, next: undefined };
    const f = { value: "f", x: 5, y: 0, width: 1, height: 1, parent: box2, next: g };
    const e = { value: "e", x: 4, y: 0, width: 1, height: 1, parent: box2, next: f };
    const d = { value: "d", x: 3, y: 0, width: 1, height: 1, parent: box1, next: e };
    const c = { value: "c", x: 2, y: 0, width: 1, height: 1, parent: box1, next: d };
    const b = { value: "b", x: 1, y: 0, width: 1, height: 1, parent: box1, next: c };
    const a = { value: "a", x: 0, y: 0, width: 1, height: 1, parent: box1, next: b };
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
      expect.objectContaining({
        x: 2,
        y: 0,
        width: 2,
        height: 1,
        content: [c, d]
      }),
    ]);
    expect(box2.content).toEqual([
      expect.objectContaining({
        x: 4,
        y: 0,
        width: 2,
        height: 1,
        content: [e, f]
      }),
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
