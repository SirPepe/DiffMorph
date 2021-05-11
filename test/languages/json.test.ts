import { type } from "../helpers";
const json = type("json");

describe("Basic JSON", () => {
  test("Empty object", () => {
    const tokens = json(`{}`);
    expect(tokens).toEqual([
      {
        kind: "TEXT",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        text: "{",
        type: "punctuation object-start-0",
        hash: "q6cs7w",
        parent: expect.any(Object),
        next: tokens[1],
        prev: undefined,
      },
      {
        kind: "TEXT",
        x: 1,
        y: 0,
        width: 1,
        height: 1,
        text: "}",
        type: "punctuation object-end-0",
        hash: "ij1r2g",
        parent: expect.any(Object),
        next: undefined,
        prev: tokens[0],
      },
    ]);
  });

  test("Content processed by the glue function", () => {
    const tokens = json(`"string"`);
    expect(tokens).toEqual([
      {
        kind: "TEXT",
        x: 0,
        y: 0,
        width: 8,
        height: 1,
        text: '"string"',
        type: "string",
        hash: "wbp31a",
        parent: expect.any(Object),
        next: undefined,
        prev: undefined,
      },
    ]);
  });

  test("Empty array", () => {
    const tokens = json(`[]`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation array-start-0",
      "punctuation array-end-0",
    ]);
  });

  test("Nested array", () => {
    const tokens = json(`[[]]`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation array-start-0",
      "punctuation array-start-1",
      "punctuation array-end-1",
      "punctuation array-end-0",
    ]);
  });

  test("Standalone null", () => {
    const tokens = json(`null`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword"]);
  });

  test("Key and string value", () => {
    const tokens = json(`{ "foo": "bar" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });

  test("Key and multiline string", () => {
    const tokens = json(`{ "foo": "bar\\nbaz" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });

  test("Key and integer value", () => {
    const tokens = json(`{ "foo": 42 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Key and float value", () => {
    const tokens = json(`{ "foo": 42.23 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Key and null value", () => {
    const tokens = json(`{ "foo": null }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-0",
    ]);
  });

  test("Key and true value", () => {
    const tokens = json(`{ "foo": true }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-0",
    ]);
  });

  test("Key and false value", () => {
    const tokens = json(`{ "foo": false }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-0",
    ]);
  });

  test("Key and object value", () => {
    const tokens = json(`{ "foo": { "bar": false } }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "punctuation object-start-1",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-1",
      "punctuation object-end-0",
    ]);
  });

  test("Multiple keys and values", () => {
    const tokens = json(`{ "foo": false, "bar": 0 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation",
      "string",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });
});

describe("Boxes", () => {
  test("Basic box", () => {
    const tokens = json(
      "{",
      {
        data: {
          tagName: "span",
          attributes: [],
        },
        id: "asdf",
        hash: "asdf",
        content: ['"x": 42'],
        isDecoration: false,
        language: undefined,
      },
      "}"
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
    expect(tokens[0].parent).toBe(tokens[4].parent);
    expect(tokens[1].parent).toBe(tokens[2].parent);
    expect(tokens[2].parent).toBe(tokens[3].parent);
    expect(tokens[0].parent).not.toBe(tokens[1].parent);
  });

  test("Box between theoretically joinable tokens", () => {
    const tokens = json(
      '{"foo',
      {
        data: {
          tagName: "span",
          attributes: [],
        },
        id: "asdf",
        hash: "asdf",
        content: ['bar"'],
        isDecoration: false,
        language: undefined,
      },
      ": 42}"
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0", // {
      "string", // "foo
      "string", // bar" (inside box, must not be joined with rest)
      "punctuation", // :
      "number", // 42
      "punctuation object-end-0", // }
    ]);
  });
});

describe("broken JSON", () => {
  test("continues on new line after unterminated string", () => {
    const tokens = json(`{
  "a": "b,
  "c": "d"
}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });
});

describe("comments in regular JSON", () => {
  test("does not support line comments", () => {
    const tokens = json(`// Hello`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "token", "token"]);
  });

  test("does not support block comments", () => {
    const tokens = json(`/* Hello */`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "token", "token", "token", "token"]);
  });
});
