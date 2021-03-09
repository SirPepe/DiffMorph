import { diffAll } from "../src/diff";
import * as language from "../src/languages/json";
import { optimize } from "../src/optimize";
import { type } from "./helpers";
const json = type(language);

describe("Optimizer", () => {
  test("It turns a single addition/deletion into a movement", () => {
    const res = optimize(diffAll([json("{}"), json("{ }")]));
    expect(res.length).toBe(2);
    expect(res[0].map((op) => op.type)).toEqual(["ADD", "ADD"]);
    expect(res[1].length).toBe(1);
    expect(res[1][0].item).toMatchObject({ x: 2, y: 0 });
    expect((res[1][0] as any).ref).toMatchObject({ x: 1, y: 0 });
  });

  test.skip("It keeps the last token on the end of the line", () => {
    const res = optimize(diffAll([json("[]"), json("[[]]")]));
    expect(res.length).toBe(2);
    expect(res[0].map((op) => op.type)).toEqual(["ADD", "ADD"]);
    console.log(res[1]);
  });
});
