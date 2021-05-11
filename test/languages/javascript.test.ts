import { type } from "../helpers";
const javascript = type("javascript");

describe("Basic statements", () => {
  test("Variable declaration", () => {
    expect(javascript(`var foo;`).map((token) => token.type)).toEqual([
      "keyword",
      "token",
      "punctuation",
    ]);
    expect(javascript(`var _;`).map((token) => token.type)).toEqual([
      "keyword",
      "token",
      "punctuation",
    ]);
    expect(javascript(`var $;`).map((token) => token.type)).toEqual([
      "keyword",
      "token",
      "punctuation",
    ]);
    expect(javascript(`var foo_var;`).map((token) => token.type)).toEqual([
      "keyword",
      "token",
      "punctuation",
    ]);
  });

  test("Multi-variable declaration", () => {
    const tokens = javascript(`let foo, bar;`);
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
    const tokens = javascript(`
      var foo = 42n;
      let bar = true;
      let baz = 123_000_000;
    `);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      // foo
      "keyword",
      "token",
      "operator assignment",
      "number",
      "punctuation",
      // bar
      "keyword",
      "token",
      "operator assignment",
      "value",
      "punctuation",
      // baz
      "keyword",
      "token",
      "operator assignment",
      "number",
      "punctuation",
    ]);
  });

  test("Variable initialization with object", () => {
    const tokens = javascript(`var foo = { new: 42 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator assignment",
      "punctuation object-start-0",
      "token",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Variable initialization with regex", () => {
    const tokens = javascript(`var foo = /[a-zA-Z]/;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator assignment",
      "regex",
      "punctuation",
    ]);
  });

  test("Array destructuring", () => {
    const tokens = javascript(`var [foo, bar = 42] = source;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation destruct-start-0",
      "token",
      "punctuation",
      "token",
      "operator assignment",
      "number",
      "punctuation destruct-end-0",
      "operator assignment",
      "token",
      "punctuation",
    ]);
  });

  test("object destructuring", () => {
    const tokens = javascript(`var { foo, bar = 42, baz: asdf } = source;`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation destruct-start-0",
      "token",
      "punctuation",
      "token",
      "operator assignment",
      "number",
      "punctuation",
      "token",
      "punctuation",
      "token",
      "punctuation destruct-end-0",
      "operator assignment",
      "token",
      "punctuation",
    ]);
  });

  test("nested object destructuring", () => {
    const tokens = javascript(
      `var { foo: { etc }, bar = 42, baz: asdf } = source;
    `
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation destruct-start-0",
      "token",
      "punctuation",
      "punctuation destruct-start-1",
      "token",
      "punctuation destruct-end-1",
      "punctuation",
      "token",
      "operator assignment",
      "number",
      "punctuation",
      "token",
      "punctuation",
      "token",
      "punctuation destruct-end-0",
      "operator assignment",
      "token",
      "punctuation",
    ]);
  });

  test("nested object destructuring with object initalizers", () => {
    const tokens = javascript(
      `var { foo: { etc = { bar: null } } } = source;
    `
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation destruct-start-0",
      "token",
      "punctuation",
      "punctuation destruct-start-1",
      "token",
      "operator assignment",
      "punctuation object-start-0",
      "token",
      "punctuation",
      "value",
      "punctuation object-end-0",
      "punctuation destruct-end-1",
      "punctuation destruct-end-0",
      "operator assignment",
      "token",
      "punctuation",
    ]);
  });

  test("function declaration", () => {
    expect(
      javascript(`function foo() { return 42; }`).map((token) => token.type)
    ).toEqual([
      "keyword function",
      "declaration function",
      "punctuation arguments-start-0",
      "punctuation arguments-end-0",
      "punctuation function-start-0",
      "keyword",
      "number",
      "punctuation",
      "punctuation function-end-0",
    ]);
  });

  test("function expression", () => {
    expect(
      javascript(`const foo = function () {}`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator assignment",
      "keyword function",
      "punctuation arguments-start-0",
      "punctuation arguments-end-0",
      "punctuation function-start-0",
      "punctuation function-end-0",
    ]);
  });

  test("arrow function expression", () => {
    expect(
      javascript(`const foo = () => {}`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator assignment",
      "punctuation parens-start-0", // should really be arguments-start-0
      "punctuation parens-end-0", // should really be arguments-end-0
      "operator arrow",
      "punctuation function-start-0",
      "punctuation function-end-0",
    ]);
  });

  test("Use of globals", () => {
    const tokens = javascript(`window.setTimeout();`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "global",
      "punctuation",
      "call",
      "punctuation call-start-0",
      "punctuation call-end-0",
      "punctuation",
    ]);
  });
});

describe("Bonkers syntax", () => {
  test("'new' in an array in an object is in fact a keyword!", () => {
    expect(
      javascript("x = { y: [ new B() ] }").map((token) => token.type)
    ).toEqual([
      "token",
      "operator assignment",
      "punctuation object-start-0",
      "token",
      "punctuation",
      "punctuation array-start-0",
      "keyword",
      "call constructor",
      "punctuation call-start-0",
      "punctuation call-end-0",
      "punctuation array-end-0",
      "punctuation object-end-0",
    ]);
  });

  test("'new' before the three spread dots is indeed a keyword!", () => {
    expect(
      javascript("x = [ ...new Foo() ]").map((token) => token.type)
    ).toEqual([
      "token",
      "operator assignment",
      "punctuation array-start-0",
      "punctuation",
      "keyword",
      "call constructor",
      "punctuation call-start-0",
      "punctuation call-end-0",
      "punctuation array-end-0",
    ]);
  });
});

describe("Broken statements", () => {
  test("Incomplete variable declaration", () => {
    const tokens = javascript(`var ... = 42`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation",
      "operator assignment",
      "number",
    ]);
  });

  test("Two incomplete variable declarations", () => {
    const tokens = javascript("var foo = ...\nvar bar = ...");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator assignment",
      "punctuation",
      "keyword",
      "token",
      "operator assignment",
      "punctuation",
    ]);
  });
});
