import { diff } from "../../src/diff/diff";
import { toLifecycle } from "../../src/render/lifecycle";
import { optimizeDiffs } from "../../src/diff/optimize";
import { lang } from "../helpers";
const tokenize = lang("none");

describe("Lifecycles", () => {
  test("it works", () => {
    const diffs = optimizeDiffs(diff([tokenize(".."), tokenize(". .")]));
    const res = toLifecycle(diffs, false);
    expect(res).toEqual({
      base: diffs[0].root.item,
      self: new Map([
        [0, diffs[0].root],
        [1, diffs[1].root],
      ]),
      text: [
        new Map([[0, diffs[0].content[0]]]),
        new Map([
          [0, diffs[0].content[1]],
          [1, diffs[1].content[0]],
        ]),
      ],
      decorations: [],
      boxes: [],
    });
  });

  test("it works with boxes", () => {
    const diffs = optimizeDiffs(
      diff([
        tokenize(".."),
        tokenize(
          ".",
          {
            language: undefined,
            data: {},
            isDecoration: false,
            content: ["test"],
          },
          "."
        ),
        tokenize(".."),
      ])
    );
    const res = toLifecycle(diffs, false);
    expect(res?.self).toEqual(
      new Map([
        [0, diffs[0].root],
        [1, diffs[1].root],
        [2, diffs[2].root],
      ])
    );
    expect(res?.text).toEqual([
      new Map([[0, diffs[0].content[0]]]),
      new Map([
        [0, diffs[0].content[1]],
        [1, diffs[1].content[0]],
        [2, diffs[2].content[0]],
      ]),
    ]);
    expect(res?.boxes[0]).toEqual({
      base: (diffs[1].content[1] as any).root.item,
      self: new Map([
        [1, (diffs[1].content[1] as any).root],
        [2, (diffs[2].content[1] as any).root],
      ]),
      text: [
        new Map([
          [1, (diffs[1].content[1] as any).content[0]],
          [2, (diffs[2].content[1] as any).content[0]],
        ]),
      ],
      decorations: [],
      boxes: [],
    });
    expect(res?.decorations).toEqual([]);
  });

  test("single frame", () => {
    const res = toLifecycle(optimizeDiffs(diff([tokenize(".")])), false);
    expect(res).toEqual({
      base: expect.any(Object),
      self: new Map([[0, { kind: "ADD", item: res?.base }]]),
      text: [new Map([[0, expect.any(Object)]])],
      decorations: [],
      boxes: [],
    });
  });

  test("zero frames", () => {
    const res = toLifecycle([], false);
    expect(res).toEqual(null);
  });
});

describe("Expanded lifecycles", () => {
  test("add BAD for text tokens on the last frame", () => {
    const diffs = optimizeDiffs(diff([tokenize(""), tokenize(".")]));
    // without extension: nil, ADD
    // with extension: BAD, ADD
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(res.text[0]).toEqual(
      new Map<any, any>([
        [0, { kind: "BAD", item: (diffs[1].content[0] as any).item }], // BAD
        [1, diffs[1].content[0]], // ADD
      ])
    );
  });

  test("add BDE for text tokens in the last frame that don't appear in the first", () => {
    const diffs = optimizeDiffs(
      diff([tokenize(""), tokenize(""), tokenize(".")])
    );
    // without extension: nil, nil, ADD
    // with extension: BDE, BAD, ADD
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(res.text[0]).toEqual(
      new Map<any, any>([
        [
          0,
          {
            kind: "BDE",
            from: (diffs[2].content[0] as any).item,
            item: (diffs[2].content[0] as any).item,
          },
        ],
        [1, { kind: "BAD", item: (diffs[2].content[0] as any).item }],
        [2, diffs[2].content[0]], // ADD
      ])
    );
  });

  test("add BDE and DEL for text tokens in the last frame that don't appear in the first", () => {
    const diffs = optimizeDiffs(
      diff([tokenize(""), tokenize(""), tokenize(""), tokenize(".")])
    );
    // without extension: nil, nil, nil, ADD
    // with extension: BDE, DEL, BAD, ADD
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(res.text[0]).toEqual(
      new Map<any, any>([
        [
          0,
          {
            kind: "BDE",
            from: (diffs[3].content[0] as any).item,
            item: (diffs[3].content[0] as any).item,
          },
        ],
        [1, { kind: "DEL", item: (diffs[3].content[0] as any).item }],
        [2, { kind: "BAD", item: (diffs[3].content[0] as any).item }],
        [3, diffs[3].content[0]], // ADD
      ])
    );
  });

  test("add BDE and DEL for text tokens visible in the last frame", () => {
    const diffs = optimizeDiffs(
      diff([
        tokenize(""),
        tokenize(""),
        tokenize(""),
        tokenize("."),
        tokenize("."),
      ])
    );
    // without extension: nil, nil, nil, ADD, nil
    // with extension: BDE, DEL, BAD, ADD, nil
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(res.text[0]).toEqual(
      new Map<any, any>([
        [
          0,
          {
            kind: "BDE",
            from: (diffs[3].content[0] as any).item,
            item: (diffs[3].content[0] as any).item,
          },
        ],
        [1, { kind: "DEL", item: (diffs[3].content[0] as any).item }],
        [2, { kind: "BAD", item: (diffs[3].content[0] as any).item }],
        [3, diffs[3].content[0]], // ADD
      ])
    );
  });

  test("replaces DEL with BDE on boxes", () => {
    const diffs = optimizeDiffs(
      diff([
        tokenize({
          language: undefined,
          data: {},
          isDecoration: false,
          content: ["test"],
        }),
        tokenize(""),
      ])
    );
    // without extension: ADD, DEL
    // with extension: ADD, BDE
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(Array.from(res.self.values(), ({ kind }) => kind)).toEqual([
      "ADD",
      "MOV",
    ]);
    expect(res.boxes[0].self).toEqual(
      new Map([
        [0, (diffs[0].content[0] as any).root], // ADD
        [
          1,
          {
            kind: "BDE",
            from: (diffs[1].content[0] as any).root.item,
            item: (diffs[0].content[0] as any).root.item,
          },
        ],
      ])
    );
  });

  test("adds a BDE/BAD when a free frame at the end is available", () => {
    const diffs = optimizeDiffs(
      diff([
        tokenize({
          language: undefined,
          data: {},
          isDecoration: false,
          content: ["test"],
        }),
        tokenize(""),
        tokenize(""),
      ])
    );
    // without extension: ADD, DEL, nil
    // with extension: ADD, BDE, BAD
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(Array.from(res.self.values(), ({ kind }) => kind)).toEqual([
      "ADD",
      "MOV",
      "NOP",
    ]);
    expect(res.boxes[0].self).toEqual(
      new Map([
        [0, (diffs[0].content[0] as any).root], // ADD
        [
          1,
          {
            kind: "BDE",
            from: (diffs[1].content[0] as any).root.item,
            item: (diffs[1].content[0] as any).root.item,
          },
        ],
        [2, { kind: "BAD", item: (diffs[0].content[0] as any).root.item }],
      ])
    );
  });

  test("it adds BAD and BDE to boxes with enough space", () => {
    const diffs = optimizeDiffs(
      diff([
        tokenize(""),
        tokenize(""),
        tokenize({
          language: undefined,
          data: {},
          isDecoration: false,
          content: ["test"],
        }),
        tokenize(""),
        tokenize(""),
      ])
    );
    // without extension: nil, nil, ADD, DEL, nil
    // with extension: nil, BAD, ADD, BDE, DEL,
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(Array.from(res.self.values(), ({ kind }) => kind)).toEqual([
      "ADD",
      "NOP",
      "MOV",
      "MOV",
      "NOP",
    ]);
    expect(res.boxes[0].self).toEqual(
      new Map([
        [1, { kind: "BAD", item: (diffs[2].content[0] as any).root.item }],
        [2, (diffs[2].content[0] as any).root], // ADD
        [
          3,
          {
            kind: "BDE",
            item: (diffs[3].content[0] as any).root.item,
            from: (diffs[2].content[0] as any).root.item,
          },
        ],
        [4, (diffs[3].content[0] as any).root], // DEL
      ])
    );
  });

  test("it adds BAD and BDE to boxes with more than enough space", () => {
    const diffs = optimizeDiffs(
      diff([
        tokenize(""),
        tokenize(""),
        tokenize(""),
        tokenize({
          language: undefined,
          data: {},
          isDecoration: false,
          content: ["test"],
        }),
        tokenize(""),
        tokenize(""),
        tokenize(""),
      ])
    );
    // without extension: nil, nil, nil, ADD, DEL, nil, nil
    // with extension: nil, nil, BAD, ADD, DEL, BDE, nil
    const res = toLifecycle(diffs, true);
    if (!res) {
      throw new Error("result is null");
    }
    expect(Array.from(res.self.values(), ({ kind }) => kind)).toEqual([
      "ADD",
      "NOP",
      "NOP",
      "MOV",
      "MOV",
      "NOP",
      "NOP",
    ]);
    expect(res.boxes[0].self).toEqual(
      new Map([
        [3, (diffs[3].content[0] as any).root], // ADD
        [
          4,
          {
            kind: "BDE",
            item: (diffs[4].content[0] as any).root.item,
            from: (diffs[3].content[0] as any).root.item,
          },
        ],
        [2, { kind: "BAD", item: (diffs[3].content[0] as any).root.item }],
        [5, (diffs[4].content[0] as any).root], // DEL
      ])
    );
  });
});
