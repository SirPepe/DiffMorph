import { diff, diffBoxes } from "../../src/lib/diff";
import { stubBox } from "../helpers";

describe("diffing boxes", () => {
  test("diffing empty boxes that don't change", () => {
    const actual = diffBoxes(stubBox({ x: 0, y: 0 }), stubBox({ x: 0, y: 0 }));
    expect(actual).toEqual({ root: undefined, items: [] });
  });
});

/*describe("diffing lines", () => {
  test("diffing lines (addition at end)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" }, // new line!
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([{ type: "ADD", item: b[3] }]);
  });

  test("diffing lines (removal at end)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      // missing c0
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([{ type: "DEL", item: a[3] }]);
  });

  test("diffing lines (changed indent)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 4, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" }, // decreased indent
      { x: 2, y: 2, hash: "c0" }, // increased indent
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([
      { type: "MOV", item: b[2], ref: a[2] },
      { type: "MOV", item: b[3], ref: a[3] },
    ]);
  });

  test("diffing lines (swap on y axis)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 4, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 4, y: 2, hash: "b0" }, // was: y1
      { x: 0, y: 1, hash: "c0" }, // was: y2
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([
      { type: "MOV", item: b[2], ref: a[2] },
      { type: "MOV", item: b[3], ref: a[3] },
    ]);
  });
});

describe("diff tokens", () => {
  test("diffing tokens (addition at end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([{ type: "ADD", item: b[1] }]);
  });

  test("diffing tokens (removal from end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([{ type: "DEL", item: a[1] }]);
  });

  test("diffing tokens (replacement at end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "aX" }, // was: a1
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 1, hash: "b1" },
      { x: 0, y: 1, hash: "b2" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([
      { type: "DEL", item: a[1] },
      { type: "ADD", item: b[1] },
    ]);
  });

  test("diffing tokens (replacement in middle of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "a1" },
      { x: 2, y: 0, hash: "a2" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "aX" }, // was: a1
      { x: 2, y: 0, hash: "a2" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([
      { type: "DEL", item: a[1] },
      { type: "ADD", item: b[1] },
    ]);
  });

  test("diffing tokens (movement at end of line)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "a1" },
      { x: 2, y: 0, hash: "a2" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 1, y: 0, hash: "a1" },
      { x: 4, y: 0, hash: "a2" }, // was: x === 2
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" },
    ];
    const actual = diffBoxes(stubBox({ tokens: a }), stubBox({ tokens: b}));
    expect(actual.tokens).toEqual([
      { type: "DEL", item: a[2] },
      { type: "ADD", item: b[2] },
    ]);
  });
});

describe("diff with boxes", () => {
  test("diffing tokens nested in boxes", () => {
    const aNested = [
      { x: 0, y: 1, hash: "a0" },
      { x: 2, y: 1, hash: "a1" },
    ]
    const aParent = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { tokens: aNested },
    ];
    const bNested = [
      { x: 0, y: 1, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
    ]
    const bParent = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 1, hash: "a1" },
      { tokens: bNested },
    ];
    const actual = diffBoxes(
      stubBox({ tokens: aParent }), stubBox({ tokens: bParent })
    );
    expect(actual.tokens).toEqual([
      { type: "DEL", item: aParent[1] },
      { type: "ADD", item: bParent[1] },
      expect.objectContaining({
        tokens: [
          { type: "DEL", item: aNested[1] },
          { type: "ADD", item: bNested[1] },
        ]
      }),
    ]);
  });
});

describe("diff across multiple frames", () => {
  test("diffing lines (addition at end)", () => {
    const a = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
    ];
    const b = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 0, y: 2, hash: "c0" }, // new line!
    ];
    const c = [
      { x: 0, y: 0, hash: "a0" },
      { x: 2, y: 0, hash: "a1" },
      { x: 0, y: 1, hash: "b0" },
      { x: 2, y: 1, hash: "b1" }, // new item!
      { x: 0, y: 2, hash: "c0" },
    ];
    const d = [
      { x: 6, y: 0, hash: "a0" }, // indent
      { x: 8, y: 0, hash: "a1" }, // indent
      { x: 0, y: 1, hash: "b0" },
      // b1 went away
      { x: 0, y: 2, hash: "c0" },
    ];
    const [first, second, third, fourth] = diff([
      stubBox({ tokens: a}),
      stubBox({ tokens: b}),
      stubBox({ tokens: c}),
      stubBox({ tokens: d}),
    ]);
    expect(first.tokens).toEqual([
      { type: "ADD", item: a[0] },
      { type: "ADD", item: a[1] },
      { type: "ADD", item: a[2] },
    ]);
    expect(second.tokens).toEqual([{ type: "ADD", item: b[3] }]);
    expect(third.tokens).toEqual([{ type: "ADD", item: c[3] }]);
    expect(fourth.tokens).toEqual([
      { type: "MOV", item: d[0], ref: c[0] },
      { type: "MOV", item: d[1], ref: c[1] },
      { type: "DEL", item: c[3] },
    ]);
  });
});*/
