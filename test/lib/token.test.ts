import { isBox, wrapContent } from "../../src/lib/token";
import { Box, Token } from "../../src/types";

type WrapTest = Token & {
  parent: Box<WrapTest, any>;
  next: WrapTest | undefined;
};

describe("wrapContent", () => {
  test("wrap tokens from the start", () => {
    const root: Box<WrapTest, any> = {
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
      parent: root,
      next: undefined,
    };
    const c = {
      value: "c",
      x: 2,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: d,
    };
    const b = {
      value: "b",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: c,
    };
    const a = {
      value: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: b,
    };
    root.content = [a, b, c, d];
    wrapContent<WrapTest, any>(a, 2, (parent) => ({ ...parent }));
    expect(isBox(root.content[0])).toBe(true);
    expect(root.content).toEqual([
      expect.objectContaining({
        x: 0,
        y: 0,
        width: 2,
        height: 1,
        content: [
          { ...a, parent: root.content[0] },
          { ...b, parent: root.content[0] },
        ],
        parent: root,
      }),
      c,
      d,
    ]);
  });

  test("wrap tokens somewhere in the middle", () => {
    const root: Box<WrapTest, any> = {
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
      parent: root,
      next: undefined,
    };
    const c = {
      value: "c",
      x: 2,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: d,
    };
    const b = {
      value: "b",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: c,
    };
    const a = {
      value: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: b,
    };
    root.content = [a, b, c, d];
    wrapContent<WrapTest, any>(b, 2, (parent) => ({ ...parent }));
    expect(isBox(root.content[1])).toBe(true);
    expect(root.content).toEqual([
      a,
      expect.objectContaining({
        x: 1,
        y: 0,
        width: 2,
        height: 1,
        content: [
          { ...b, parent: root.content[1] },
          { ...c, parent: root.content[1] },
        ],
        parent: root,
      }),
      d,
    ]);
  });

  test("wraps an existing box", () => {
    const root: Box<WrapTest, any> = {
      x: 0,
      y: 0,
      width: 6,
      height: 1,
      data: {},
      language: "test",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const f = {
      value: "f",
      x: 5,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: undefined,
    };
    const e = {
      value: "e",
      x: 4,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: undefined,
    };
    const d = {
      value: "d",
      x: 3,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: undefined,
    };
    const c = {
      value: "c",
      x: 2,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: d,
    };
    const b = {
      value: "b",
      x: 1,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: c,
    };
    const a = {
      value: "a",
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      parent: root,
      next: b,
    };
    const nested: Box<WrapTest, any> = {
      x: 2,
      y: 0,
      width: 2,
      height: 1,
      data: {},
      language: "test",
      content: [c, d],
      decorations: [],
      parent: root,
    };
    root.content = [a, b, nested, e, f];
    wrapContent<WrapTest, any>(b, 4, (parent) => ({ ...parent }));
    expect(isBox(root.content[1])).toBe(true);
    expect((root.content[1] as any).content[1]).toBe(nested);
    expect(root.content).toEqual([
      a,
      expect.objectContaining({
        x: 1,
        y: 0,
        width: 4,
        height: 1,
        content: [
          { ...b, parent: root.content[1] },
          nested,
          { ...e, parent: root.content[1] },
        ],
        parent: root,
      }),
      f,
    ]);
    expect(nested.parent).toBe(root.content[1]);
  });

  test("nothing to wrap", () => {
    const box: Box<WrapTest, any> = {
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
    wrapContent<WrapTest, any>(undefined as any, 0, (parent) => ({
      ...parent,
    }));
    expect(box.content).toEqual([a, b, c, d]);
  });

  // It's unclear if this can actually happen in practice and is thus not
  // supported at the moment. wrapContent() throws if the wrap boundary is
  // inside a nested box and that's all that this test verifies right now.
  test("wrap parts of nested boxes", () => {
    const root: Box<WrapTest, any> = {
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
    const nested1: Box<WrapTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "nested1",
      content: [],
      decorations: [],
      parent: root,
    };
    const nested2: Box<WrapTest, any> = {
      x: 0,
      y: 0,
      width: 0,
      height: 1,
      data: {},
      language: "nested2",
      content: [],
      decorations: [],
      parent: root,
    };
    /* eslint-disable */
    const g = { value: "g", x: 6, y: 0, width: 1, height: 1, parent: root, next: undefined };
    const f = { value: "f", x: 5, y: 0, width: 1, height: 1, parent: nested2, next: g };
    const e = { value: "e", x: 4, y: 0, width: 1, height: 1, parent: nested2, next: f };
    const d = { value: "d", x: 3, y: 0, width: 1, height: 1, parent: nested1, next: e };
    const c = { value: "c", x: 2, y: 0, width: 1, height: 1, parent: nested1, next: d };
    const b = { value: "b", x: 1, y: 0, width: 1, height: 1, parent: root, next: c };
    const a = { value: "a", x: 0, y: 0, width: 1, height: 1, parent: root, next: b };
    /* eslint-enable */
    nested1.content = [c, d];
    nested2.content = [e, f];
    root.content = [a, b, nested1, nested2, g];
    // index of b + 4 is smack dab in the middle if nested2
    expect(() => {
      wrapContent<WrapTest, any>(b, 4, (parent) => ({ ...parent }));
    }).toThrow();
  });
});
