import { diff, findPatterns } from "../../src/lib/diff";
import { Box } from "../../src/types";
import { link, stubBox } from "../helpers";

describe("finding patterns", () => {
  const rootBox: Box<any, any> = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    data: {},
    language: "none",
    content: [],
    decorations: [],
    parent: undefined,
  };

  test("directly adjacent tokens separated by : or -", () => {
    const input = link([
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "a", type: "" },
      { x: 3, y: 0, width: 1, height: 1, hash: 2, text: "-", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 3, text: "b", type: "" },
    ]);
    const actual = findPatterns(input, rootBox);
    expect(actual).toEqual([
      {
        x: 2,
        y: 0,
        width: 0,
        height: 0,
        hash: expect.any(Number),
        items: [input[1], input[2], input[3]],
        parent: rootBox,
      },
    ]);
  });

  test("string sequence", () => {
    const input = link([
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: ":", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "'", type: "" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: "h", type: "" },
      { x: 6, y: 0, width: 1, height: 1, hash: 4, text: "i", type: "" },
      { x: 7, y: 0, width: 1, height: 1, hash: 5, text: "'", type: "" },
    ]);
    const actual = findPatterns(input, rootBox);
    expect(actual).toEqual([
      {
        x: 4,
        y: 0,
        width: 0,
        height: 0,
        hash: expect.any(Number),
        items: [input[2], input[3], input[4], input[5]],
        parent: rootBox,
      },
    ]);
  });

  test("identifier/assignment pair", () => {
    const input = link([
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "42", type: "" },
    ]);
    const actual = findPatterns(input, rootBox);
    expect(actual).toEqual([
      {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        hash: expect.any(Number),
        items: [input[0], input[1]],
        parent: rootBox,
      },
    ]);
  });

  test("string sequence and identifier/operator pair", () => {
    const input = link([
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "=", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 2, text: "'", type: "" },
      { x: 5, y: 0, width: 1, height: 1, hash: 3, text: "h", type: "" },
      { x: 6, y: 0, width: 1, height: 1, hash: 4, text: "i", type: "" },
      { x: 7, y: 0, width: 1, height: 1, hash: 5, text: "'", type: "" },
    ]);
    const actual = findPatterns(input, rootBox);
    expect(actual).toEqual([
      {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        hash: expect.any(Number),
        items: [input[0], input[1]],
        parent: rootBox,
      },
      {
        x: 4,
        y: 0,
        width: 0,
        height: 0,
        hash: expect.any(Number),
        items: [input[2], input[3], input[4], input[5]],
        parent: rootBox,
      },
    ]);
  });

  test("no patterns", () => {
    const input = link([
      { x: 0, y: 0, width: 1, height: 1, hash: 0, text: "x", type: "" },
      { x: 2, y: 0, width: 1, height: 1, hash: 1, text: "a", type: "" },
      { x: 3, y: 0, width: 1, height: 1, hash: 2, text: "g", type: "" },
      { x: 4, y: 0, width: 1, height: 1, hash: 3, text: "b", type: "" },
    ]);
    const actual = findPatterns(input, rootBox);
    expect(actual).toEqual([]);
  });
});

describe("diffing lines", () => {
  test("diffing lines (addition at end)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" }, // new line!
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [{ kind: "ADD", item: bTokens[3] }],
      decorations: [],
    });
  });

  test("diffing lines (removal at end)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      // missing c0
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [{ kind: "DEL", item: aTokens[3] }],
      decorations: [],
    });
  });

  test("diffing lines (changed indent)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 4, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" }, // decreased indent
      { x: 2, y: 2, width: 1, height: 1, text: "c0", type: "" }, // increased indent
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "MOV", item: bTokens[2], from: aTokens[2] },
        { kind: "MOV", item: bTokens[3], from: aTokens[3] },
      ],
      decorations: [],
    });
  });

  test("diffing lines (swap on y axis)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 4, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 4, y: 2, width: 1, height: 1, text: "b0", type: "" }, // was: y1
      { x: 0, y: 1, width: 1, height: 1, text: "c0", type: "" }, // was: y2
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "MOV", item: bTokens[2], from: aTokens[2] },
        { kind: "MOV", item: bTokens[3], from: aTokens[3] },
      ],
      decorations: [],
    });
  });

  test("diffing longer lines (swap on y axis)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "a" },
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "b" },
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" },
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "c" },
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "d" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "c" }, // was: y = 2
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "d" }, // was: y = 2
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" }, // unchanged
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "a" }, // was: y = 0
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "b" }, // was: y = 0
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "MOV", item: bTokens[0], from: aTokens[3] },
        { kind: "MOV", item: bTokens[1], from: aTokens[4] },
        { kind: "MOV", item: bTokens[3], from: aTokens[0] },
        { kind: "MOV", item: bTokens[4], from: aTokens[1] },
      ],
      decorations: [],
    });
  });

  test("diffing longer lines (swap on y axis with alternatives)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "a" },
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "b" },
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" },
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "c" },
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "d" },
      { x: 0, y: 3, width: 1, height: 1, text: "", type: "c" },
      { x: 1, y: 3, width: 1, height: 1, text: "", type: "d" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "c" }, // was: y = 2
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "d" }, // was: y = 2
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" }, // unchanged
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "a" }, // was: y = 0
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "b" }, // was: y = 0
      { x: 0, y: 3, width: 1, height: 1, text: "", type: "c" }, // unchanged
      { x: 1, y: 3, width: 1, height: 1, text: "", type: "d" }, // unchanged
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "MOV", item: bTokens[0], from: aTokens[3] },
        { kind: "MOV", item: bTokens[1], from: aTokens[4] },
        { kind: "MOV", item: bTokens[3], from: aTokens[0] },
        { kind: "MOV", item: bTokens[4], from: aTokens[1] },
      ],
      decorations: [],
    });
  });

  test("diffing longer lines (swap on y axis) and modify a line", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "a" },
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "b" },
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" },
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "c" },
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "d" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "c" }, // was: y = 2
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "d" }, // was: y = 2
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" }, // unchanged
      { x: 2, y: 1, width: 1, height: 1, text: "", type: "y" }, // new
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "a" }, // was: y = 0
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "b" }, // was: y = 0
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "MOV", item: bTokens[0], from: aTokens[3] },
        { kind: "MOV", item: bTokens[1], from: aTokens[4] },
        { kind: "MOV", item: bTokens[4], from: aTokens[0] },
        { kind: "MOV", item: bTokens[5], from: aTokens[1] },
        { kind: "ADD", item: bTokens[3] },
      ],
      decorations: [],
    });
  });

  test("chaotic line movements", () => {
    const aTokens = [
      { x: 2, y: 0, width: 1, height: 1, text: "", type: "a" },
      { x: 3, y: 0, width: 1, height: 1, text: "", type: "b" },
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" },
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "c" },
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "d" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "", type: "c" }, // was x 0, y 2
      { x: 1, y: 0, width: 1, height: 1, text: "", type: "d" }, // was x 1, y 2
      { x: 0, y: 1, width: 1, height: 1, text: "", type: "x" }, // unchanged
      { x: 0, y: 2, width: 1, height: 1, text: "", type: "a" }, // was: x 2 y 0
      { x: 1, y: 2, width: 1, height: 1, text: "", type: "b" }, // was: x 3 y 0
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "MOV", item: bTokens[0], from: aTokens[3] },
        { kind: "MOV", item: bTokens[1], from: aTokens[4] },
        { kind: "MOV", item: bTokens[3], from: aTokens[0] },
        { kind: "MOV", item: bTokens[4], from: aTokens[1] },
      ],
      decorations: [],
    });
  });
});

describe("diff structures", () => {
  test("switch lines", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "x", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "=", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "[", type: "foo foo-start-0" },
      { x: 3, y: 0, width: 1, height: 1, text: "1", type: "" },
      { x: 4, y: 0, width: 1, height: 1, text: "]", type: "foo foo-end-0" },
      { x: 0, y: 0, width: 1, height: 1, text: "y", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "=", type: "" },
      { x: 2, y: 1, width: 1, height: 1, text: "[", type: "foo foo-start-0" },
      { x: 3, y: 1, width: 1, height: 1, text: "2", type: "" },
      { x: 4, y: 1, width: 1, height: 1, text: "]", type: "foo foo-end-0" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "x", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "=", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "[", type: "foo foo-start-0" },
      { x: 3, y: 0, width: 1, height: 1, text: "2", type: "" },
      { x: 4, y: 0, width: 1, height: 1, text: "]", type: "foo foo-end-0" },
      { x: 0, y: 0, width: 1, height: 1, text: "y", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "=", type: "" },
      { x: 2, y: 1, width: 1, height: 1, text: "[", type: "foo foo-start-0" },
      { x: 3, y: 1, width: 1, height: 1, text: "1", type: "" },
      { x: 4, y: 1, width: 1, height: 1, text: "]", type: "foo foo-end-0" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    // 6x MOV for language constructs [1] and [2]
    expect(actual.content.map(({ kind }) => kind)).toEqual([
      "MOV",
      "MOV",
      "MOV",
      "MOV",
      "MOV",
      "MOV",
    ]);
  });
});

describe("diff tokens", () => {
  test("diffing tokens (addition at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b2", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b2", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [{ kind: "ADD", item: bTokens[1] }],
      decorations: [],
    });
  });

  test("diffing tokens (removal from end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b2", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      // a1 is missing
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b2", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [{ kind: "DEL", item: aTokens[1] }],
      decorations: [],
    });
  });

  test("diffing tokens (replacement at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b2", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "aX", type: "" }, // was: a1
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b2", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "DEL", item: aTokens[1] },
        { kind: "ADD", item: bTokens[1] },
      ],
      decorations: [],
    });
  });

  test("diffing tokens (replacement in middle of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a2", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "aX", type: "" }, // was: a1
      { x: 2, y: 0, width: 1, height: 1, text: "a2", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "DEL", item: aTokens[1] },
        { kind: "ADD", item: bTokens[1] },
      ],
      decorations: [],
    });
  });

  test("diffing tokens (movement at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a2", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 1, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 4, y: 0, width: 1, height: 1, text: "a2", type: "" }, // was: x === 2
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
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
    const [, actual] = diff([
      stubBox({
        decorations: [
          {
            x: 0,
            y: 0,
            width: 2,
            height: 2,
            data: {},
          },
        ],
      }),
      stubBox({
        decorations: [
          {
            x: 0,
            y: 0,
            width: 2,
            height: 2,
            data: {},
          },
        ],
      }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [],
    });
  });

  test("single addition", () => {
    const added = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [] }),
      stubBox({ decorations: [added] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "ADD", item: added }],
    });
  });

  test("single removal", () => {
    const removed = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [removed] }),
      stubBox({ decorations: [] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [{ kind: "DEL", item: removed }],
    });
  });

  test("single translation", () => {
    const before = {
      x: 0,
      y: 0,
      width: 2,
      height: 2,
      data: {},
    };
    const after = {
      x: 0,
      y: 1,
      width: 2,
      height: 2,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [before] }),
      stubBox({ decorations: [after] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
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
      width: 2,
      height: 2,
      data: {},
    };
    const after = {
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      data: {},
    };
    const [, actual] = diff([
      stubBox({ decorations: [before] }),
      stubBox({ decorations: [after] }),
    ]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
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
    const a = stubBox<any, any>({ x: 0, y: 0 });
    const b = stubBox<any, any>({ x: 0, y: 0 });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: expect.any(Object) },
      content: [],
      decorations: [],
    });
  });

  test("diffing empty root boxes that change coordinates", () => {
    const a = stubBox<any, any>({ x: 0, y: 0 });
    const b = stubBox<any, any>({ x: 5, y: 5 });
    const [, actual] = diff([a, b]);
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
    const a = stubBox<any, any>({ x: 0, y: 0, width: 5, height: 1 });
    const b = stubBox<any, any>({ x: 5, y: 5, width: 1, height: 1 });
    const [, actual] = diff([a, b]);
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
      { x: 0, y: 1, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 1, width: 1, height: 1, text: "a1", type: "" },
    ];
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { content: aNestedTokens },
    ];
    const bNestedTokens = [
      { x: 0, y: 1, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 1, width: 1, height: 1, text: "a1", type: "" },
      { content: bNestedTokens },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const [, actual] = diff([a, b]);
    expect(actual).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: b },
      content: [
        { kind: "DEL", item: aTokens[1] },
        { kind: "ADD", item: bTokens[1] },
        {
          kind: "TREE",
          root: {
            kind: "BOX",
            item: b.content[2],
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
    const result = diff([]);
    expect(result).toEqual([]);
  });

  test("one frame", () => {
    const aTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const result = diff([a]);
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
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
    ];
    const bTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" }, // new line!
    ];
    const cTokens = [
      { x: 0, y: 0, width: 1, height: 1, text: "a0", type: "" },
      { x: 2, y: 0, width: 1, height: 1, text: "a1", type: "" },
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      { x: 2, y: 1, width: 1, height: 1, text: "b1", type: "" }, // new item!
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const dTokens = [
      { x: 6, y: 0, width: 1, height: 1, text: "a0", type: "" }, // indent
      { x: 8, y: 0, width: 1, height: 1, text: "a1", type: "" }, // indent
      { x: 0, y: 1, width: 1, height: 1, text: "b0", type: "" },
      // b1 went away
      { x: 0, y: 2, width: 1, height: 1, text: "c0", type: "" },
    ];
    const a = stubBox({ content: aTokens });
    const b = stubBox({ content: bTokens });
    const c = stubBox({ content: cTokens });
    const d = stubBox({ content: dTokens });
    const [first, second, third, fourth] = diff([a, b, c, d]);
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
      root: { kind: "BOX", item: b },
      content: [{ kind: "ADD", item: bTokens[3] }],
      decorations: [],
    });
    expect(third).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: c },
      content: [{ kind: "ADD", item: cTokens[3] }],
      decorations: [],
    });
    expect(fourth).toEqual({
      kind: "TREE",
      root: { kind: "BOX", item: d },
      content: [
        { kind: "MOV", item: dTokens[0], from: cTokens[0] },
        { kind: "MOV", item: dTokens[1], from: cTokens[1] },
        { kind: "DEL", item: cTokens[3] },
      ],
      decorations: [],
    });
  });
});
