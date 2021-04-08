import { diff } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/none";
import { optimize } from "../../src/lib/optimize";
import { lang } from "../helpers";
const tokenize = lang(languageDefinition);

describe("Optimizer", () => {
  test("It turns a single addition/deletion into a movement", () => {
    const res = optimize(diff([tokenize(".."), tokenize(". .")]));
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
    const res = optimize(diff([tokenize(".."), tokenize("  .  .")]));
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
    const res = optimize(diff([tokenize(".."), tokenize("  ..  .")]));
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
    const res = optimize(diff([tokenize(".."), tokenize("  .. \n.")]));
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
});
