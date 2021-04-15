import { diff } from "../../src/lib/diff";
import { extendDiffs } from "../../src/lib/extend";
import { optimizeDiffs } from "../../src/lib/optimize";
import { lang } from "../helpers";
const tokenize = lang("none");

describe("Extender", () => {
  test("single-frame diff sets don't change", () => {
    const before = optimizeDiffs(diff([tokenize(".")]));
    expect(before.length).toBe(1);
    expect(before[0].content.map((op) => op.kind)).toEqual(["ADD"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(1);
    expect(after[0].content.map((op) => op.kind)).toEqual(["ADD"]);
  });

  test("turning an ADD into a BAD + MOV in two frames", () => {
    const before = optimizeDiffs(diff([tokenize(""), tokenize(".")]));
    expect(before.length).toBe(2);
    expect(before[0].content.map((op) => op.kind)).toEqual([]);
    expect(before[1].content.map((op) => op.kind)).toEqual(["ADD"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(2);
    expect(after[0].content.map((op) => op.kind)).toEqual(["BAD"]);
    expect(after[1].content.map((op) => op.kind)).toEqual(["MOV"]);
  });

  test("turning an ADD into a BAD + MOV in three frames", () => {
    const before = optimizeDiffs(
      diff([tokenize(""), tokenize("."), tokenize("")])
    );
    expect(before.length).toBe(3);
    expect(before[0].content.map((op) => op.kind)).toEqual([]);
    expect(before[1].content.map((op) => op.kind)).toEqual(["ADD"]);
    expect(before[2].content.map((op) => op.kind)).toEqual(["DEL"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(3);
    expect(after[0].content.map((op) => op.kind)).toEqual(["BAD"]);
    expect(after[1].content.map((op) => op.kind)).toEqual(["MOV"]);
    expect(after[2].content.map((op) => op.kind)).toEqual(["DEL"]);
  });

  test("replace a DEL with a BAD", () => {
    const before = optimizeDiffs(
      diff([tokenize("."), tokenize(""), tokenize(".")])
    );
    expect(before.length).toBe(3);
    expect(before[0].content.map((op) => op.kind)).toEqual(["ADD"]);
    expect(before[1].content.map((op) => op.kind)).toEqual(["DEL"]);
    expect(before[2].content.map((op) => op.kind)).toEqual(["ADD"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(3);
    expect(after[0].content.map((op) => op.kind)).toEqual(["ADD"]);
    expect(after[1].content.map((op) => op.kind)).toEqual(["BAD"]);
    expect(after[2].content.map((op) => op.kind)).toEqual(["MOV"]);
  });

  test("leave ADD in first frame unchanged", () => {
    const before = optimizeDiffs(
      diff([tokenize(".."), tokenize(".:."), tokenize("..")])
    );
    expect(before.length).toBe(3);
    expect(before[0].content.map((o) => o.kind)).toEqual(["ADD", "ADD"]);
    expect(before[1].content.map((o) => o.kind)).toEqual(["MOV", "ADD"]);
    expect(before[2].content.map((o) => o.kind)).toEqual(["DEL", "MOV"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(3);
    expect(after[0].content.map((o) => o.kind)).toEqual(["ADD", "ADD", "BAD"]);
    expect(after[1].content.map((o) => o.kind)).toEqual(["MOV", "MOV"]);
    expect(after[2].content.map((o) => o.kind)).toEqual(["DEL", "MOV"]);
  });
});
