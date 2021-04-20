import { diff } from "../../src/lib/diff";
import { stubBox } from "../helpers";

describe("diffing lines", () => {
  test("diffing lines (addition at end)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" }, // new line!
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [{ kind: "ADD", item: bTokens[3] }],
      decorations: [],
    });
  });

  test("diffing lines (removal at end)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      // missing c0
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [{ kind: "DEL", item: aTokens[3] }],
      decorations: [],
    });
  });

  test("diffing lines (changed indent)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 4, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" }, // decreased indent
      { x: 2, y: 2, width: 1, height: 1, hash: "c0" }, // increased indent
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [
        { kind: "MOV", item: bTokens[2], from: aTokens[2] },
        { kind: "MOV", item: bTokens[3], from: aTokens[3] },
      ],
      decorations: [],
    });
  });

  test("diffing lines (swap on y axis)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 4, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 4, y: 2, width: 1, height: 1, hash: "b0" }, // was: y1
      { x: 0, y: 1, width: 1, height: 1, hash: "c0" }, // was: y2
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [
        { kind: "MOV", item: bTokens[2], from: aTokens[2] },
        { kind: "MOV", item: bTokens[3], from: aTokens[3] },
      ],
      decorations: [],
    });
  });
});

describe("diff tokens", () => {
  test("diffing tokens (addition at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b2" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b2" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [{ kind: "ADD", item: bTokens[1] }],
      decorations: [],
    });
  });

  test("diffing tokens (removal from end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b2" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      // a1 is missing
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b2" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [{ kind: "DEL", item: aTokens[1] }],
      decorations: [],
    });
  });

  test("diffing tokens (replacement at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b2" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "aX" }, // was: a1
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b2" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [
        { kind: "DEL", item: aTokens[1] },
        { kind: "ADD", item: bTokens[1] },
      ],
      decorations: [],
    });
  });

  test("diffing tokens (replacement in middle of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 1, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a2" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 1, y: 0, width: 1, height: 1, hash: "aX" }, // was: a1
      { x: 2, y: 0, width: 1, height: 1, hash: "a2" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [
        { kind: "DEL", item: aTokens[1] },
        { kind: "ADD", item: bTokens[1] },
      ],
      decorations: [],
    });
  });

  test("diffing tokens (movement at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 1, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a2" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 1, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 4, y: 0, width: 1, height: 1, hash: "a2" }, // was: x === 2
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [
        { kind: "DEL", item: aTokens[2] },
        { kind: "ADD", item: bTokens[2] },
      ],
      decorations: [],
    });
  });
});

describe("diff with decorations", () => {
  test("no changes", () => {
    const [, actual] = diff<any, any>([
      stubBox({
        decorations: [
          {
            x: 0,
            y: 0,
            hash: "foo",
            width: 2,
            height: 2,
          },
        ],
      }),
      stubBox({
        decorations: [
          {
            x: 0,
            y: 0,
            hash: "foo",
            width: 2,
            height: 2,
          },
        ],
      })
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: expect.any(Object) },
      content: [],
      decorations: [],
    });
  });

  test("single addition", () => {
    const added = {
      x: 0,
      y: 0,
      hash: "foo",
      width: 2,
      height: 2,
    };
    const [, actual] = diff<any, any>([
      stubBox({ decorations: [] }),
      stubBox({ decorations: [added] })
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "ADD", item: added }],
    });
  });

  test("single removal", () => {
    const removed = {
      x: 0,
      y: 0,
      hash: "foo",
      width: 2,
      height: 2,
    };
    const [, actual] = diff<any, any>([
      stubBox({ decorations: [removed] }),
      stubBox({ decorations: [] })
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "DEL", item: removed }],
    });
  });

  test("single translation", () => {
    const before = {
      x: 0,
      y: 0,
      hash: "foo",
      width: 2,
      height: 2,
    };
    const after = {
      x: 0,
      y: 1,
      hash: "foo",
      width: 2,
      height: 2,
    };
    const [, actual] = diff<any, any>([
      stubBox({ decorations: [before] }),
      stubBox({ decorations: [after] })
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: expect.any(Object) },
      content: [],
      decorations: [
        { kind: "DEL", item: before },
        { kind: "ADD", item: after },
      ],
    });
  });

  test("single size change", () => {
    const before = {
      x: 0,
      y: 0,
      hash: "foo",
      width: 2,
      height: 2,
    };
    const after = {
      x: 0,
      y: 0,
      hash: "foo",
      width: 1,
      height: 1,
    };
    const [, actual] = diff<any, any>([
      stubBox({ decorations: [before] }),
      stubBox({ decorations: [after] })
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: expect.any(Object) },
      content: [],
      decorations: [
        { kind: "DEL", item: before },
        { kind: "ADD", item: after },
      ],
    });
  });
});

describe("diff with boxes", () => {
  test("diffing empty root boxes that don't change", () => {
    const [, actual] = diff<any, any>([
      stubBox({ x: 0, y: 0 }),
      stubBox({ x: 0, y: 0 })
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: expect.any(Object) },
      content: [],
      decorations: [],
    });
  });

  test("diffing empty root boxes that change coordinates", () => {
    const a = stubBox({ x: 0, y: 0 });
    const b = stubBox({ x: 5, y: 5 });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: {
        from: a,
        item: b,
        kind: "MOV",
      },
      content: [],
      decorations: [],
    });
  });

  test("diffing empty root boxes that change coordinates and sizes", () => {
    const a = stubBox({ x: 0, y: 0, width: 5, height: 1 });
    const b = stubBox({ x: 5, y: 5, width: 1, height: 1 });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: {
        from: a,
        item: b,
        kind: "MOV",
      },
      content: [],
      decorations: [],
    });
  });

  test("diffing tokens nested in boxes", () => {
    const aNestedTokens = [
      { x: 0, y: 1, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 1, width: 1, height: 1, hash: "a1" },
    ];
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { content: aNestedTokens },
    ];
    const bNestedTokens = [
      { x: 0, y: 1, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 1, width: 1, height: 1, hash: "a1" },
      { content: bNestedTokens },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff<any, any>([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [
        { kind: "DEL", item: aTokens[1] },
        { kind: "ADD", item: bTokens[1] },
        {
          kind: "TREE",
          root: {
            kind: "NOP",
            item: expect.objectContaining({ id: "nested-1" }),
          },
          content: [
            { kind: "DEL", item: aNestedTokens[1] },
            { kind: "ADD", item: bNestedTokens[1] },
          ],
          decorations: [],
        },
      ],
      decorations: [],
    });
  });
});

describe("diff across any number of frames", () => {
  test("zero frames", () => {
    const result = diff<any, any>([]);
    expect(result).toEqual([]);
  });

  test("one frame", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
    ];
    const a = stubBox({ content: aTokens });
    const result = diff<any, any>([a]);
    expect(result).toEqual([
      {
        kind: "TREE",
        root: {
          kind: "ADD",
          item: a,
        },
        content: [
          { kind: "ADD", item: aTokens[0] },
          { kind: "ADD", item: aTokens[1] },
          { kind: "ADD", item: aTokens[2] },
        ],
        decorations: [],
      },
    ]);
  });

  test("four frames", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" }, // new line!
    ];
    const cTokens = [
      { x: 0, y: 0, width: 1, height: 1, hash: "a0" },
      { x: 2, y: 0, width: 1, height: 1, hash: "a1" },
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      { x: 2, y: 1, width: 1, height: 1, hash: "b1" }, // new item!
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const dTokens = [
      { x: 6, y: 0, width: 1, height: 1, hash: "a0" }, // indent
      { x: 8, y: 0, width: 1, height: 1, hash: "a1" }, // indent
      { x: 0, y: 1, width: 1, height: 1, hash: "b0" },
      // b1 went away
      { x: 0, y: 2, width: 1, height: 1, hash: "c0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const c = stubBox({ content: cTokens });
    const d = stubBox({ content: dTokens });
    const [first, second, third, fourth] = diff<any, any>([a, b, c, d]);
    expect(first).toEqual({
      kind: "TREE",
      root: {
        kind: "ADD",
        item: a,
      },
      content: [
        { kind: "ADD", item: aTokens[0] },
        { kind: "ADD", item: aTokens[1] },
        { kind: "ADD", item: aTokens[2] },
      ],
      decorations: [],
    });
    expect(second).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: b },
      content: [{ kind: "ADD", item: bTokens[3] }],
      decorations: [],
    });
    expect(third).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: c },
      content: [{ kind: "ADD", item: cTokens[3] }],
      decorations: [],
    });
    expect(fourth).toEqual({
      kind: "TREE",
      root: { kind: "NOP", item: d },
      content: [
        { kind: "MOV", item: dTokens[0], from: cTokens[0] },
        { kind: "MOV", item: dTokens[1], from: cTokens[1] },
        { kind: "DEL", item: cTokens[3] },
      ],
      decorations: [],
    });
  });
});
