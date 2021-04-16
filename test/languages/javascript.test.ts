import { type } from "../helpers";
const javascript = type("javascript");

describe("Basic statements", () => {
  test("Variable declaration", () => {
    const tokens = javascript(`var foo_var;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword", "token", "punctuation"]);
  });

  test("Multi-variable declaration", () => {
    const tokens = javascript(`const foo, bar;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
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
      "keyword",
      "token",
      "punctuation",
      "keyword",
      "token",
      "punctuation",
    ]);
  });

  test("Variable initialization", () => {
    const tokens = javascript(`var foo = 42n;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
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
      "keyword",
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
      "keyword",
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

  test("nested object destructuring", () => {
    const tokens = javascript(`var { foo: { etc }, bar = 42, baz: asdf } = source;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation-destruct-start-0",
      "token",
      "punctuation",
      "punctuation-curly-start-0", // should really be destruct-1
      "token",
      "punctuation-curly-end-0", // should really be destruct-1
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

describe("Broken statements", () => {
  test("Incomplete variable declaration", () => {
    const tokens = javascript(`var ... = 42`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword", "punctuation", "punctuation", "punctuation", "operator-assignment", "number"]);
  });
  test("Two incomplete variable declarations", () => {
    const tokens = javascript("var foo = ...\nvar bar = ...");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword", "token", "operator-assignment", "punctuation", "punctuation", "punctuation", "keyword", "token", "operator-assignment", "punctuation", "punctuation", "punctuation"]);
  });
});
