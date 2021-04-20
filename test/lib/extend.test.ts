import { diff } from "../../src/lib/diff";
import { extendDiffs } from "../../src/lib/extend";
import { optimizeDiffs } from "../../src/lib/optimize";
import { Box } from "../../src/types";
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

  test("replace a DEL with a BDE in two frames", () => {
    const before = optimizeDiffs(diff([tokenize("."), tokenize("")]));
    expect(before.length).toBe(2);
    expect(before[0].content.map((op) => op.kind)).toEqual(["ADD"]);
    expect(before[1].content.map((op) => op.kind)).toEqual(["DEL"]);
    const after = extendDiffs(before);
    expect(after[0].content.map((op) => op.kind)).toEqual(["ADD"]);
    expect(after[1].content.map((op) => op.kind)).toEqual(["BDE"]);
  });

  test("optimizing an ADD/DEL pair in three frames", () => {
    const before = optimizeDiffs(
      diff([tokenize(""), tokenize("."), tokenize("")])
    );
    expect(before.length).toBe(3);
    expect(before[0].content.map((op) => op.kind)).toEqual([]);
    expect(before[1].content.map((op) => op.kind)).toEqual(["ADD"]);
    expect(before[2].content.map((op) => op.kind)).toEqual(["DEL"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(3);
    expect(after[0].content.map((op) => op.kind)).toEqual(["BAD"]); // Move to new position, stay invisible
    expect(after[1].content.map((op) => op.kind)).toEqual(["MOV"]); // become visible
    expect(after[2].content.map((op) => op.kind)).toEqual(["BDE"]); // become invisible
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
    expect(after[2].content.map((o) => o.kind)).toEqual(["BDE", "MOV"]);
  });
});

describe("Extender on decorations", () => {
  test("extending ADD on decorations", () => {
    const a: Box<any, any> = {
      kind: "BOX",
      x: 0,
      y: 0,
      hash: "root",
      width: 0,
      height: 0,
      id: "root0",
      data: {},
      language: "none",
      content: [],
      decorations: [],
      parent: undefined,
    };
    const b: Box<any, any> = {
      kind: "BOX",
      x: 0,
      y: 0,
      hash: "root",
      width: 0,
      height: 0,
      id: "root0",
      data: {},
      language: "none",
      content: [],
      decorations: [],
      parent: undefined,
    };
    b.decorations.push({
      kind: "DECO",
      data: {},
      parent: b,
    });
    const before = optimizeDiffs(diff([a, b]));
    expect(before.length).toBe(2);
    expect(before[0].content).toEqual([]);
    expect(before[1].content).toEqual([]);
    expect(before[0].decorations.map((op) => op.kind)).toEqual([]);
    expect(before[1].decorations.map((op) => op.kind)).toEqual(["ADD"]);
    const after = extendDiffs(before);
    expect(after.length).toBe(2);
    expect(after[0].content).toEqual([]);
    expect(after[1].content).toEqual([]);
    expect(after[0].decorations.map((op) => op.kind)).toEqual(["BAD"]);
    expect(after[1].decorations.map((op) => op.kind)).toEqual(["MOV"]);
  });
});
