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
      "operator",
      "number",
      "punctuation",
      // bar
      "keyword",
      "token",
      "operator",
      "literal",
      "punctuation",
      // baz
      "keyword",
      "token",
      "operator",
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
      "operator",
      "punctuation object-start-0",
      "token",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Variable initialization with interpolated object key", () => {
    const tokens = javascript(`var foo = { [new]: 42 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation object-start-0",
      "punctuation bracket-start-0",
      "token",
      "punctuation bracket-end-0",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Variable initialization with interpolated object index", () => {
    const tokens = javascript(`var foo = { [1]: 42 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation object-start-0",
      "punctuation bracket-start-0",
      "number",
      "punctuation bracket-end-0",
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
      "operator",
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
      "operator",
      "number",
      "punctuation destruct-end-0",
      "operator",
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
      "operator",
      "number",
      "punctuation",
      "token",
      "punctuation",
      "token",
      "punctuation destruct-end-0",
      "operator",
      "token",
      "punctuation",
    ]);
  });

  test("nested object destructuring", () => {
    const tokens = javascript(
      `var { foo: { etc }, bar = 42, baz: asdf } = source;`
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
      "operator",
      "number",
      "punctuation",
      "token",
      "punctuation",
      "token",
      "punctuation destruct-end-0",
      "operator",
      "token",
      "punctuation",
    ]);
  });

  test("nested object destructuring with object initializers", () => {
    const tokens = javascript(
      `var { foo: { etc = { bar: null } } } = source;`
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation destruct-start-0",
      "token",
      "punctuation",
      "punctuation destruct-start-1",
      "token",
      "operator",
      "punctuation object-start-0",
      "token",
      "punctuation",
      "literal",
      "punctuation object-end-0",
      "punctuation destruct-end-1",
      "punctuation destruct-end-0",
      "operator",
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
      "operator",
      "keyword function",
      "punctuation arguments-start-0",
      "punctuation arguments-end-0",
      "punctuation function-start-0",
      "punctuation function-end-0",
    ]);
  });

  test("comma expression with parens", () => {
    expect(
      javascript(`const foo = (a, b);`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation parens-start-0",
      "token",
      "punctuation",
      "token",
      "punctuation parens-end-0",
      "punctuation",
    ]);
  });

  test("arrow function expression", () => {
    expect(
      javascript(`const foo = () => {}`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation arguments-start-0",
      "punctuation arguments-end-0",
      "operator arrow",
      "punctuation function-start-0",
      "punctuation function-end-0",
    ]);
  });

  test("multi-line arrow function expression", () => {
    expect(
      javascript(`const foo = (
) => {}`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation arguments-start-0",
      "punctuation arguments-end-0",
      "operator arrow",
      "punctuation function-start-0",
      "punctuation function-end-0",
    ]);
  });

  test("multi-line arrow function expression with args", () => {
    expect(
      javascript(`const foo = (
  x,
  y = 42
) => {}`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation arguments-start-0",
      "token",
      "punctuation",
      "token",
      "operator",
      "number",
      "punctuation arguments-end-0",
      "operator arrow",
      "punctuation function-start-0",
      "punctuation function-end-0",
    ]);
  });

  test("arrow function in arrow function args", () => {
    expect(
      javascript(`const foo = (f = () => 42) => {}`).map((token) => token.type)
    ).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation arguments-start-0",
      "token",
      "operator",
      "punctuation arguments-start-1",
      "punctuation arguments-end-1",
      "operator arrow",
      "number",
      "punctuation arguments-end-0",
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
  test("reserved words as object members", () => {
    expect(
      javascript(
        "x = { new: 1, true: 2, typeof: 3, NaN: 4 }"
      ).map((token) => token.type)).toEqual([
        "token",
        "operator",
        "punctuation object-start-0",
        "token",
        "punctuation",
        "number",
        "punctuation",
        "token",
        "punctuation",
        "number",
        "punctuation",
        "token",
        "punctuation",
        "number",
        "punctuation",
        "token",
        "punctuation",
        "number",
        "punctuation object-end-0",
      ]);
  });

  test("'new' in an array in an object is in fact a keyword!", () => {
    expect(
      javascript("x = { y: [ new B() ] }").map((token) => token.type)
    ).toEqual([
      "token",
      "operator",
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
      "operator",
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

describe("Strings", () => {
  test("Regular strings", () => {
    expect(javascript(`"Hello"`).map(({type}) => type)).toEqual([
      "string",
      "string",
      "string",
    ]);
    expect(javascript(`'Hello'`).map(({type}) => type)).toEqual([
      "string",
      "string",
      "string",
    ]);
    expect(javascript("`Hello`").map(({type}) => type)).toEqual([
      "string",
      "string",
      "string",
    ]);
  });

  test("Multi-line strings", () => {
    expect(javascript(`"Hello\n\\World"`).map(({type}) => type)).toEqual([
      "string",
      "string",
      "string",
      "string",
      "string",
    ]);
    expect(javascript("`Hello\nWorld`").map(({type}) => type)).toEqual([
      "string",
      "string",
      "string",
      "string",
    ]);
  });

  test("Template strings with interpolation", () => {
    expect(javascript("`Hello${42}`").map(({type}) => type)).toEqual([
      "string",
      "string",
      "operator interpolation",
      "number",
      "operator interpolation",
      "string",
    ]);
  });

  test("Template strings with complex interpolation", () => {
    expect(javascript("`Hello${foo(42)}`").map(({type}) => type)).toEqual([
      "string",
      "string",
      "operator interpolation",
      "call",
      "punctuation call-start-0",
      "number",
      "punctuation call-end-0",
      "operator interpolation",
      "string",
    ]);
  });

  test("Template strings with complex interpolation, nested", () => {
    expect(javascript("`Hello${`${42}`}`").map(({type}) => type)).toEqual([
      "string",
      "string",
      "operator interpolation",
      "string",
      "operator interpolation",
      "number",
      "operator interpolation",
      "string",
      "operator interpolation",
      "string",
    ]);
  });
});

describe("Operators", () => {
  test("Simple ternary", () => {
    expect(javascript(`a ? b : c`).map(({type}) => type))
      .toEqual(["token", "operator", "token", "operator", "token"]);
  });

  test("Ternary involving arrays", () => {
    expect(javascript(`a ? [b] : [c]`).map(({type}) => type))
      .toEqual([
        "token",
        "operator",
        "punctuation array-start-0",
        "token",
        "punctuation array-end-0",
        "operator",
        "punctuation array-start-0",
        "token",
        "punctuation array-end-0",
      ]);
  });

  test("Ternary involving objects", () => {
    expect(javascript(`a ? { b: 1 } : { b: 1 }`).map(({type}) => type))
      .toEqual([
        "token",
        "operator",
        "punctuation object-start-0",
        "token",
        "punctuation",
        "number",
        "punctuation object-end-0",
        "operator",
        "punctuation object-start-0",
        "token",
        "punctuation",
        "number",
        "punctuation object-end-0",
      ]);
  });

  test("Ternary inside an object", () => {
    expect(javascript(`const x = { a: x ? y : z }`).map(({type}) => type))
      .toEqual([
        "keyword",
        "token",
        "operator",
        "punctuation object-start-0",
        "token",
        "punctuation",
        "token",
        "operator",
        "token",
        "operator",
        "token",
        "punctuation object-end-0",
      ]);
  });

  test("Ternary inside a larger object", () => {
    expect(javascript(`const x = { a: 1, b: x ? y : z }`).map(({type}) => type))
      .toEqual([
        "keyword",
        "token",
        "operator",
        "punctuation object-start-0",
        "token",
        "punctuation",
        "number",
        "punctuation",
        "token",
        "punctuation",
        "token",
        "operator",
        "token",
        "operator",
        "token",
        "punctuation object-end-0",
      ]);
  });

  test("Ternary inside a nested object", () => {
    expect(javascript(`const x = { a: { b: x ? y : z } }`).map(({type}) => type))
      .toEqual([
        "keyword",
        "token",
        "operator",
        "punctuation object-start-0",
        "token",
        "punctuation",
        "punctuation object-start-1",
        "token",
        "punctuation",
        "token",
        "operator",
        "token",
        "operator",
        "token",
        "punctuation object-end-1",
        "punctuation object-end-0",
      ]);
  });

  test("Ternary inside an array", () => {
    expect(javascript(`const x = [ x ? y : z ]`).map(({type}) => type))
      .toEqual([
        "keyword",
        "token",
        "operator",
        "punctuation array-start-0",
        "token",
        "operator",
        "token",
        "operator",
        "token",
        "punctuation array-end-0",
      ]);
  });

  test("Other operators", () => {
    expect(javascript(`1++`).map(({type}) => type))
      .toEqual(["number", "operator"]);
    expect(javascript(`1--`).map(({type}) => type))
      .toEqual(["number", "operator"]);
    expect(javascript(`++1`).map(({type}) => type))
      .toEqual(["operator", "number"]);
    expect(javascript(`--1`).map(({type}) => type))
      .toEqual(["operator", "number"]);
    expect(javascript(`a || b`).map(({type}) => type))
      .toEqual(["token", "operator", "token"]);
    expect(javascript(`a ?? b`).map(({type}) => type))
      .toEqual(["token", "operator", "token"]);
    expect(javascript(`a ?= b`).map(({type}) => type))
      .toEqual(["token", "operator", "token"]);
    expect(javascript(`a > b`).map(({type}) => type))
      .toEqual(["token", "operator", "token"]);
    expect(javascript(`a >>>= b`).map(({type}) => type))
    .toEqual(["token", "operator", "token"]);
  });
});

describe("Numbers", () => {
  test("Special values", () => {
    expect(javascript(`NaN`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`Infinity`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`-Infinity`).map(({type}) => type)).toEqual(["number"]);
  });

  test("Normal and octal syntax", () => {
    expect(javascript(`-0`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`42`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`42.0`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`42n`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`4_2`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`4_2n`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`-4_2n`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`0888`).map(({type}) => type)).toEqual(["number"]);
  });

  test("Exponential syntax", () => {
    expect(javascript(`0e-5`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`0e+5`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`5e1`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`175e-2`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`1e3`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`1e-3`).map(({type}) => type)).toEqual(["number"]);
  });

  test("Binary syntax", () => {
    expect(
      javascript(`0b10000000000000000000000000000000`).map(({type}) => type)
    ).toEqual(["number"]);
    expect(
      javascript(`0b01111111100000000000000000000000`).map(({type}) => type)
    ).toEqual(["number"]);
    expect(
      javascript(`0B00000000011111111111111111111111`).map(({type}) => type)
    ).toEqual(["number"]);
  });

  test("Hex syntax", () => {
    expect(javascript(`0xFFF`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`0x123ABC`).map(({type}) => type)).toEqual(["number"]);
    expect(javascript(`0XA`).map(({type}) => type)).toEqual(["number"]);
  });
});

describe("Broken statements", () => {
  test("Incomplete variable declaration", () => {
    const tokens = javascript(`var ... = 42`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "punctuation",
      "operator",
      "number",
    ]);
  });

  test("Two incomplete variable declarations", () => {
    const tokens = javascript("var foo = ...\nvar bar = ...");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator",
      "punctuation",
      "keyword",
      "token",
      "operator",
      "punctuation",
    ]);
  });
});
