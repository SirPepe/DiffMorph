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
