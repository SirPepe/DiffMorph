import { diff, diffBoxes } from "../../src/lib/diff";
import { stubBox } from "../helpers";

describe("diffing lines", () => {
  test("diffing lines (addition at end)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" }, // new line!
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [{ type: "ADD", item: bTokens[3] }],
    });
  });

  test("diffing lines (removal at end)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      // missing c0
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [{ type: "DEL", item: aTokens[3] }],
    });
  });

  test("diffing lines (changed indent)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 4, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" }, // decreased indent
      { x: 2, y: 2, hash: "c0" }, // increased indent
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [
        { type: "MOV", item: bTokens[2], from: aTokens[2] },
        { type: "MOV", item: bTokens[3], from: aTokens[3] },
      ],
    });
  });

  test("diffing lines (swap on y axis)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 4, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 4, y: 2, hash: "b0" }, // was: y1
      { x: 0, y: 1, hash: "c0" }, // was: y2
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [
        { type: "MOV", item: bTokens[2], from: aTokens[2] },
        { type: "MOV", item: bTokens[3], from: aTokens[3] },
      ],
    });
  });
});

describe("diff tokens", () => {
  test("diffing tokens (addition at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [{ type: "ADD", item: bTokens[1] }],
    });
  });

  test("diffing tokens (removal from end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [{ type: "DEL", item: aTokens[1] }],
    });
  });

  test("diffing tokens (replacement at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "aX" }, // was: a1
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [
        { type: "DEL", item: aTokens[1] },
        { type: "ADD", item: bTokens[1] },
      ],
    });
  });

  test("diffing tokens (replacement in middle of line)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "a1" },
      { x: 2, y: 0, hash: "a2" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "aX" }, // was: a1
      { x: 2, y: 0, hash: "a2" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [
        { type: "DEL", item: aTokens[1] },
        { type: "ADD", item: bTokens[1] },
      ],
    });
  });

  test("diffing tokens (movement at end of line)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "a1" },
      { x: 2, y: 0, hash: "a2" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "a1" },
      { x: 4, y: 0, hash: "a2" }, // was: x === 2
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [
        { type: "DEL", item: aTokens[2] },
        { type: "ADD", item: bTokens[2] },
      ],
    });
  });
});

describe("diff with boxes", () => {
  test("diffing empty root boxes that don't change", () => {
    const actual = diffBoxes(stubBox({ x: 0, y: 0 }), stubBox({ x: 0, y: 0 }));
    expect(actual).toEqual({ root: undefined, items: [] });
  });

  test("diffing empty root boxes that change coordinates", () => {
    const a = stubBox<any>({ x: 0, y: 0 });
    const b = stubBox<any>({ x: 5, y: 5 });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: {
        from: a,
        item: b,
        type: "MOV",
      },
      items: [],
    });
  });

  test("diffing empty root boxes that change coordinates and sizes", () => {
    const a = stubBox<any>({ x: 0, y: 0, width: 5, height: 1 });
    const b = stubBox<any>({ x: 5, y: 5, width: 1, height: 1 });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: {
        from: a,
        item: b,
        type: "MOV",
      },
      items: [],
    });
  });

  test("diffing tokens nested in boxes", () => {
    const aNestedTokens = [
      { x: 0, y: 1, hash: "a0" },
      { x: 2, y: 1, hash: "a1" },
    ];
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { tokens: aNestedTokens },
    ];
    const bNestedTokens = [
      { x: 0, y: 1, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 1, hash: "a1" },
      { tokens: bNestedTokens },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const actual = diffBoxes(a, b);
    expect(actual).toEqual({
      root: undefined,
      items: [
        { type: "DEL", item: aTokens[1] },
        { type: "ADD", item: bTokens[1] },
        {
          root: undefined,
          items: [
            { type: "DEL", item: aNestedTokens[1] },
            { type: "ADD", item: bNestedTokens[1] },
          ],
        },
      ],
    });
  });
});

describe("diff across multiple frames", () => {
  test("diffing lines (addition at end)", () => {
    const aTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
    ];
    const bTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" }, // new line!
    ];
    const cTokens = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 2, y: 1, hash: "b1" }, // new item!
      { x: 0, y: 2, hash: "c0" },
    ];
    const dTokens = [
      { x: 6, y: 0, hash: "a0" }, // indent
      { x: 8, y: 0, hash: "a1" }, // indent
      { x: 0, y: 1, hash: "b0" },
      // b1 went away
      { x: 0, y: 2, hash: "c0" },
    ];
    const a = stubBox({ tokens: aTokens });
    const b = stubBox({ tokens: bTokens });
    const c = stubBox({ tokens: cTokens });
    const d = stubBox({ tokens: dTokens });
    const [first, second, third, fourth] = diff([a, b, c, d]);
    expect(first).toEqual({
      root: {
        type: "ADD",
        item: a,
      },
      items: [
        { type: "ADD", item: aTokens[0] },
        { type: "ADD", item: aTokens[1] },
        { type: "ADD", item: aTokens[2] },
      ],
    });
    expect(second).toEqual({
      root: undefined,
      items: [{ type: "ADD", item: bTokens[3] }],
    });
    expect(third).toEqual({
      root: undefined,
      items: [{ type: "ADD", item: cTokens[3] }],
    });
    expect(fourth).toEqual({
      root: undefined,
      items: [
        { type: "MOV", item: dTokens[0], from: cTokens[0] },
        { type: "MOV", item: dTokens[1], from: cTokens[1] },
        { type: "DEL", item: cTokens[3] },
      ],
    });
  });
});
