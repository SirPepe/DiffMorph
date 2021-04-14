import { type } from "../helpers";
const javascript = type("javascript");

describe("Basic statements", () => {
  test("Variable declaration", () => {
    const tokens = javascript(`var foo;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword-var", "token", "punctuation"]);
  });

  test("Multi-variable declaration", () => {
    const tokens = javascript(`const foo, bar;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-const",
      "token",
      "punctuation",
      "token",
      "punctuation",
    ]);
  });

  test("Multiple variable declaration", () => {
    const tokens = javascript(`const foo; const bar;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-const",
      "token",
      "punctuation",
      "keyword-const",
      "token",
      "punctuation",
    ]);
  });

  test("Variable initialization", () => {
    const tokens = javascript(`var foo = 42n;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-var",
      "token",
      "operator-assignment",
      "number",
      "punctuation",
    ]);
  });

  test("Array destructuring", () => {
    const tokens = javascript(`var [foo, bar = 42] = source;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-var",
      "punctuation-destruct-start-0",
      "token",
      "punctuation",
      "token",
      "operator-assignment",
      "number",
      "punctuation-destruct-end-0",
      "operator-assignment",
      "token",
      "punctuation",
    ]);
  });

  test("object destructuring", () => {
    const tokens = javascript(`var { foo, bar = 42, baz: asdf } = source;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-var",
      "punctuation-destruct-start-0",
      "token",
      "punctuation",
      "token",
      "operator-assignment",
      "number",
      "punctuation",
      "token",
      "punctuation",
      "token",
      "punctuation-destruct-end-0",
      "operator-assignment",
      "token",
      "punctuation",
    ]);
  });
});
