import { diff } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/none";
import { optimize } from "../../src/lib/optimize";
import { lang } from "../helpers";
const tokenize = lang(languageDefinition);

describe("Optimizer", () => {
  test("It turns a single addition/deletion into a movement", () => {
    const res = optimize(diff([tokenize(".."), tokenize(". .")]));
    expect(res.length).toBe(2);
    expect(res[0].map((op) => op.type)).toEqual(["ADD", "ADD"]);
    expect(res[1].length).toBe(1);
    expect(res[1][0]).toMatchObject({
      item: { x: 2, y: 0 },
      ref: { x: 1, y: 0 },
    });
  });

  test("It turns two additions/deletions into movements", () => {
    const res = optimize(diff([tokenize(".."), tokenize("  .  .")]));
    expect(res.length).toBe(2);
    expect(res[0].map((op) => op.type)).toEqual(["ADD", "ADD"]);
    expect(res[1].map((op) => op.type)).toEqual(["MOV", "MOV"]);
    expect(res[1][0]).toMatchObject({
      item: { x: 2, y: 0 },
      ref: { x: 0, y: 0 },
    });
    expect(res[1][1]).toMatchObject({
      item: { x: 5, y: 0 },
      ref: { x: 1, y: 0 },
    });
  });

  test("Handles extra additions on the same line", () => {
    const res = optimize(diff([tokenize(".."), tokenize("  ..  .")]));
    expect(res.length).toBe(2);
    expect(res[0].map((op) => op.type)).toEqual(["ADD", "ADD"]);
    expect(res[1].map((op) => op.type)).toEqual(["ADD", "MOV", "MOV"]);
    expect(res[1][0]).toMatchObject({ item: { x: 6, y: 0 } });
    expect(res[1][1]).toMatchObject({
      item: { x: 2, y: 0 },
      ref: { x: 0, y: 0 },
    });
    expect(res[1][2]).toMatchObject({
      item: { x: 3, y: 0 },
      ref: { x: 1, y: 0 },
    });
  });

  test("Handles extra additions on a new line", () => {
    const res = optimize(diff([tokenize(".."), tokenize("  .. \n.")]));
    expect(res.length).toBe(2);
    expect(res[0].map((op) => op.type)).toEqual(["ADD", "ADD"]);
    expect(res[1].map((op) => op.type)).toEqual(["MOV", "MOV", "ADD"]);
    expect(res[1][0]).toMatchObject({
      item: { x: 2, y: 0 },
      ref: { x: 0, y: 0 },
    });
    expect(res[1][1]).toMatchObject({
      item: { x: 3, y: 0 },
      ref: { x: 1, y: 0 },
    });
    expect(res[1][2]).toMatchObject({ item: { x: 0, y: 1 } });
  });
});
