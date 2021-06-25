import { type } from "../helpers";
const javascript = type("javascript");

describe("Basic statements", () => {
  test("Variable declaration", () => {
    expect(javascript(`var foo;`)).toEqual(["keyword", "token", "punctuation"]);
    expect(javascript(`var of;`)).toEqual(["keyword", "token", "punctuation"]);
    expect(javascript(`var _;`)).toEqual(["keyword", "token", "punctuation"]);
    expect(javascript(`var $;`)).toEqual(["keyword", "token", "punctuation"]);
    expect(javascript(`var foo_var;`)).toEqual([
      "keyword",
      "token",
      "punctuation",
    ]);
  });

  test("Multi-variable declaration", () => {
    const types = javascript(`let foo, bar;`);
    expect(types).toEqual([
      "keyword",
      "token",
      "punctuation",
      "token",
      "punctuation",
    ]);
  });

  test("Multiple variable declaration", () => {
    const types = javascript(`const foo; const bar;`);
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
    const types = javascript(`
      var foo = 42n;
      let bar = true;
      let baz = 123_000_000;
    `);
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
    const types = javascript(`var foo = { new: 42 }`);
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
    const types = javascript(`var foo = { [new]: 42 }`);
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
    const types = javascript(`var foo = { [1]: 42 }`);
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
    const types = javascript(`var foo = /[a-zA-Z]/;`);
    expect(types).toEqual([
      "keyword",
      "token",
      "operator",
      "regex",
      "punctuation",
    ]);
  });

  test("Array destructuring", () => {
    const types = javascript(`var [foo, bar = 42] = source;`);
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
    const types = javascript(`var { foo, bar = 42, baz: asdf } = source;`);
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
    const types = javascript(
      `var { foo: { etc }, bar = 42, baz: asdf } = source;`
    );
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
    const types = javascript(`var { foo: { etc = { bar: null } } } = source;`);
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
    expect(javascript(`function foo() { return 42; }`)).toEqual([
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
    expect(javascript(`const foo = function () {}`)).toEqual([
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
    expect(javascript(`const foo = (a, b);`)).toEqual([
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
    expect(javascript(`const foo = () => {}`)).toEqual([
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
) => {}`)
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
) => {}`)
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
    expect(javascript(`const foo = (f = () => 42) => {}`)).toEqual([
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
    const types = javascript(`window.setTimeout();`);
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
    expect(javascript("x = { new: 1, true: 2, typeof: 3, NaN: 4 }")).toEqual([
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
    expect(javascript("x = { y: [ new B() ] }")).toEqual([
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
    expect(javascript("x = [ ...new Foo() ]")).toEqual([
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
    expect(javascript(`"Hello"`).map((type) => type)).toEqual([
      "string",
      "string",
      "string",
    ]);
    expect(javascript(`'Hello'`).map((type) => type)).toEqual([
      "string",
      "string",
      "string",
    ]);
    expect(javascript("`Hello`").map((type) => type)).toEqual([
      "string",
      "string",
      "string",
    ]);
  });

  test("Multi-line strings", () => {
    expect(javascript(`"Hello\n\\World"`).map((type) => type)).toEqual([
      "string",
      "string",
      "string",
      "string",
      "string",
    ]);
    expect(javascript("`Hello\nWorld`").map((type) => type)).toEqual([
      "string",
      "string",
      "string",
      "string",
    ]);
  });

  test("Template strings with interpolation", () => {
    expect(javascript("`Hello${42}`").map((type) => type)).toEqual([
      "string",
      "string",
      "operator interpolation",
      "number",
      "operator interpolation",
      "string",
    ]);
  });

  test("Template strings with complex interpolation", () => {
    expect(javascript("`Hello${foo(42)}`").map((type) => type)).toEqual([
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
    expect(javascript("`Hello${`${42}`}`").map((type) => type)).toEqual([
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
    expect(javascript(`a ? b : c`).map((type) => type)).toEqual([
      "token",
      "operator",
      "token",
      "operator",
      "token",
    ]);
  });

  test("Ternary involving arrays", () => {
    expect(javascript(`a ? [b] : [c]`).map((type) => type)).toEqual([
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
    expect(javascript(`a ? { b: 1 } : { b: 1 }`).map((type) => type)).toEqual([
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
    expect(
      javascript(`const x = { a: x ? y : z }`).map((type) => type)
    ).toEqual([
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
    expect(
      javascript(`const x = { a: 1, b: x ? y : z }`).map((type) => type)
    ).toEqual([
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
    expect(
      javascript(`const x = { a: { b: x ? y : z } }`).map((type) => type)
    ).toEqual([
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
    expect(javascript(`const x = [ x ? y : z ]`).map((type) => type)).toEqual([
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
    expect(javascript(`1++`).map((type) => type)).toEqual([
      "number",
      "operator",
    ]);
    expect(javascript(`1--`).map((type) => type)).toEqual([
      "number",
      "operator",
    ]);
    expect(javascript(`++1`).map((type) => type)).toEqual([
      "operator",
      "number",
    ]);
    expect(javascript(`--1`).map((type) => type)).toEqual([
      "operator",
      "number",
    ]);
    expect(javascript(`a || b`).map((type) => type)).toEqual([
      "token",
      "operator",
      "token",
    ]);
    expect(javascript(`a ?? b`).map((type) => type)).toEqual([
      "token",
      "operator",
      "token",
    ]);
    expect(javascript(`a ?= b`).map((type) => type)).toEqual([
      "token",
      "operator",
      "token",
    ]);
    expect(javascript(`a > b`).map((type) => type)).toEqual([
      "token",
      "operator",
      "token",
    ]);
    expect(javascript(`a >>>= b`).map((type) => type)).toEqual([
      "token",
      "operator",
      "token",
    ]);
  });
});

describe("Numbers", () => {
  test("Special values", () => {
    expect(javascript(`NaN`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`Infinity`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`-Infinity`).map((type) => type)).toEqual(["number"]);
  });

  test("Normal and octal syntax", () => {
    expect(javascript(`-0`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`42`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`42.0`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`42n`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`4_2`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`4_2n`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`-4_2n`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`0888`).map((type) => type)).toEqual(["number"]);
  });

  test("Exponential syntax", () => {
    expect(javascript(`0e-5`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`0e+5`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`5e1`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`175e-2`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`1e3`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`1e-3`).map((type) => type)).toEqual(["number"]);
  });

  test("Binary syntax", () => {
    expect(
      javascript(`0b10000000000000000000000000000000`).map((type) => type)
    ).toEqual(["number"]);
    expect(
      javascript(`0b01111111100000000000000000000000`).map((type) => type)
    ).toEqual(["number"]);
    expect(
      javascript(`0B00000000011111111111111111111111`).map((type) => type)
    ).toEqual(["number"]);
  });

  test("Hex syntax", () => {
    expect(javascript(`0xFFF`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`0x123ABC`).map((type) => type)).toEqual(["number"]);
    expect(javascript(`0XA`).map((type) => type)).toEqual(["number"]);
  });
});

describe("Comments", () => {
  test("Line comment", () => {
    const types = javascript(`// foo foo`);
    expect(types).toEqual(["comment", "comment", "comment"]);
  });
  test("Block comment", () => {
    const types = javascript(`/* foo foo */`);
    expect(types).toEqual(["comment", "comment", "comment", "comment"]);
  });
});

describe("If/else", () => {
  test("if", () => {
    const types = javascript(`if(true){}`);
    expect(types).toEqual([
      "keyword",
      "punctuation condition-start-0",
      "literal",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
    ]);
  });

  test("if-else", () => {
    const types = javascript(`if(true){}else{}`);
    expect(types).toEqual([
      "keyword",
      "punctuation condition-start-0",
      "literal",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
      "keyword",
      "punctuation block-start-0",
      "punctuation block-end-0",
    ]);
  });

  test("if-else-if", () => {
    const types = javascript(`if(true){}else if(false){}`);
    expect(types).toEqual([
      "keyword",
      "punctuation condition-start-0",
      "literal",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
      "keyword",
      "keyword",
      "punctuation condition-start-0",
      "literal",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
    ]);
  });
});

describe("Loops", () => {
  test("do-while", () => {
    const types = javascript(`do {} while(true);`);
    expect(types).toEqual([
      "keyword",
      "punctuation block-start-0",
      "punctuation block-end-0",
      "keyword",
      "punctuation condition-start-0",
      "literal",
      "punctuation condition-end-0",
      "punctuation",
    ]);
  });

  test("while", () => {
    const types = javascript(`while(true){}`);
    expect(types).toEqual([
      "keyword",
      "punctuation condition-start-0",
      "literal",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
    ]);
  });

  test("for-of", () => {
    const types = javascript(`for(let item of collection){}`);
    expect(types).toEqual([
      "keyword",
      "punctuation condition-start-0",
      "keyword",
      "token",
      "keyword",
      "token",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
    ]);
  });

  test("trollish for-of", () => {
    const types = javascript(`for(of of of){}`);
    expect(types).toEqual([
      "keyword",
      "punctuation condition-start-0",
      "token",
      "keyword",
      "token",
      "punctuation condition-end-0",
      "punctuation block-start-0",
      "punctuation block-end-0",
    ]);
  });
});

describe("Broken statements", () => {
  test("Incomplete variable declaration", () => {
    const types = javascript(`var ... = 42`);
    expect(types).toEqual(["keyword", "punctuation", "operator", "number"]);
  });

  test("Two incomplete variable declarations", () => {
    const types = javascript("var foo = ...\nvar bar = ...");
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
