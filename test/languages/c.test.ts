import { type } from "../helpers";
const c = type("c");

describe("Comments", () => {
  test("Line comments", () => {
    expect(c(`// test\nint i;`)).toEqual([
      "comment",
      "comment",
      "keyword",
      "token",
      "punctuation",
    ]);
  });
  test("Block comments", () => {
    expect(c(`/* Test */ int i;`)).toEqual([
      "comment",
      "comment",
      "comment",
      "keyword",
      "token",
      "punctuation",
    ]);
  });
});
