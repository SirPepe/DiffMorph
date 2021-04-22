import { diff } from "../../src/lib/diff";
import { toLifecycle } from "../../src/lib/lifecycle";
import { optimizeDiffs } from "../../src/lib/optimize";
import { lang } from "../helpers";
const tokenize = lang("none");

describe("Lifecycles", () => {
  test("it works", () => {
    const diffs = optimizeDiffs(diff([tokenize(".."), tokenize(". .")]));
    const res = toLifecycle(diffs);
    expect(res).toEqual({
      kind: "BOX",
      base: diffs[0].root.item,
      self: new Map([
        [0, diffs[0].root],
        [1, diffs[1].root],
      ]),
      text: [
        new Map([[0, diffs[0].content[0]]]),
        new Map([[0, diffs[0].content[1]], [1, diffs[1].content[0]]]),
      ],
      decorations: [],
      boxes: []
    });
  });

  test("it works with boxes", () => {
    const diffs = optimizeDiffs(diff([
      tokenize(".."),
      tokenize(".", {
        id: "box",
        hash: "asdf",
        language: undefined,
        data: {},
        isDecoration: false,
        content: ["test"],
      }, "."),
      tokenize(".."),
    ]));
    const res = toLifecycle(diffs);
    expect(res?.self).toEqual(
      new Map([ [0, diffs[0].root], [1, diffs[1].root], [2, diffs[2].root]])
    );
    expect(res?.text).toEqual([
      new Map([[0, diffs[0].content[0]]]),
      new Map([[0, diffs[0].content[1]], [1, diffs[1].content[0]], [2, diffs[2].content[0]]]),
    ]);
    expect(res?.boxes[0]).toEqual({
      kind: "BOX",
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
    const res = toLifecycle(optimizeDiffs(diff([tokenize(".")])));
    expect(res).toEqual({
      kind: "BOX",
      base: expect.any(Object),
      self: new Map([[0, { kind: "ADD", item: res?.base }]]),
      text: [
        new Map([[0, expect.any(Object)]])
      ],
      decorations: [],
      boxes: []
    });
  });

  test("zero frames", () => {
    const res = toLifecycle([]);
    expect(res).toEqual(null);
  });
});
