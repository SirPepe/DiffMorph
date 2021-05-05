import { diff } from "../../src/lib/diff";
import { optimizeDiffs } from "../../src/lib/optimize";
import { Box, Decoration } from "../../src/types";
import { lang } from "../helpers";
const tokenize = lang("none");
const tokenizeJSON = lang("json");

describe("Optimizer", () => {
  test("It turns a single addition/deletion into a movement", () => {
    const res = optimizeDiffs(diff([tokenize(".."), tokenize(". .")]));
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual(["ADD", "ADD"]);
    expect(res[1].content.length).toBe(1);
    expect(res[1].content[0]).toMatchObject({
      kind: "MOV",
      item: { x: 2, y: 0 },
      from: { x: 1, y: 0 },
    });
  });

  test("It turns two additions/deletions into movements", () => {
    const res = optimizeDiffs(diff([tokenize(".."), tokenize("  .  .")]));
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual(["ADD", "ADD"]);
    expect(res[1].content.map((op) => op.kind)).toEqual(["MOV", "MOV"]);
    expect(res[1].content[0]).toMatchObject({
      kind: "MOV",
      item: { x: 2, y: 0 },
      from: { x: 0, y: 0 },
    });
    expect(res[1].content[1]).toMatchObject({
      kind: "MOV",
      item: { x: 5, y: 0 },
      from: { x: 1, y: 0 },
    });
  });

  test("Handles extra additions on the same line", () => {
    const res = optimizeDiffs(diff([tokenize(".."), tokenize("  ..  .")]));
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual(["ADD", "ADD"]);
    expect(res[1].content[0]).toMatchObject({
      kind: "ADD",
      item: { x: 6, y: 0 },
    });
    expect(res[1].content[1]).toMatchObject({
      kind: "MOV",
      from: { x: 0, y: 0 },
      item: { x: 2, y: 0 },
    });
    expect(res[1].content[2]).toMatchObject({
      kind: "MOV",
      from: { x: 1, y: 0 },
      item: { x: 3, y: 0 },
    });
  });

  test("Handles extra additions on a new line", () => {
    const res = optimizeDiffs(diff([tokenize(".."), tokenize("  .. \n.")]));
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual(["ADD", "ADD"]);
    expect(res[1].content[0]).toMatchObject({
      kind: "MOV",
      item: { x: 2, y: 0 },
      from: { x: 0, y: 0 },
    });
    expect(res[1].content[1]).toMatchObject({
      kind: "MOV",
      item: { x: 3, y: 0 },
      from: { x: 1, y: 0 },
    });
    expect(res[1].content[2]).toMatchObject({
      kind: "ADD",
      item: { x: 0, y: 1 },
    });
  });

  test("Keep JSON commas at their respective curly", () => {
    const res = optimizeDiffs(
      diff([
        tokenizeJSON("{},"),
        tokenizeJSON(`{
  "a": 1,
},`)
      ])
    );
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual(["ADD", "ADD", "ADD"]);
    // Stay with the closing curly brace
    expect(res[1].content[2]).toMatchObject({
      kind: "MOV",
      item: { x: 1, y: 2, text: ","  },
      from: { x: 2, y: 0 },
    });
  });

  test("Keep JSON commas at their respective curly (smaller delta)", () => {
    const res = optimizeDiffs(
      diff([
        tokenizeJSON(`{
  "a": {},

}`),
        tokenizeJSON(`{
  "a": {
    "b": 1,
  },
}`)
      ])
    );
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual([
      "ADD",
      "ADD",
      "ADD",
      "ADD",
      "ADD",
      "ADD",
      "ADD"
    ]);
    // Stay with the closing curly brace
    expect(res[1].content[3]).toMatchObject({
      kind: "MOV",
      item: { x: 3, y: 3, text: ","  },
      from: { x: 9, y: 1 },
    });
  });
});

describe("Optimizer on decorations", () => {
  test("It turns a single addition/deletion into a movement", () => {
    const a: Box<any, Decoration<any>> = {
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
    a.decorations.push({
      kind: "DECO",
      hash: "foo",
      x: 0,
      y: 0,
      width: 10,
      height: 0,
      data: {},
      parent: a,
    });
    const b: Box<any, Decoration<any>> = {
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
      hash: "foo",
      x: 10,
      y: 0,
      width: 10,
      height: 0,
      data: {},
      parent: b,
    });
    const res = optimizeDiffs(diff([a, b]));
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual([]);
    expect(res[1].content.map((op) => op.kind)).toEqual([]);
    expect(res[0].decorations.map((op) => op.kind)).toEqual(["ADD"]);
    expect(res[1].decorations.map((op) => op.kind)).toEqual(["MOV"]);
    expect(res[1].decorations[0]).toMatchObject({
      kind: "MOV",
      item: { x: 10, y: 0 },
      from: { x: 0, y: 0 },
    });
  });
});

describe("Regressions", () => {
  test("do not explode when all non-same-line candidates are used up", () => {
    const res = optimizeDiffs(diff([tokenize("..."), tokenize("\n.")]));
    expect(res.length).toBe(2);
    expect(res[0].content.map((op) => op.kind)).toEqual(["ADD", "ADD", "ADD"]);
    expect(res[1].content.map((op) => op.kind)).toEqual(["DEL", "DEL", "MOV"]);
  });
});
