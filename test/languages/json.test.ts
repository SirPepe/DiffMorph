import { languageDefinition } from "../../src/languages/json";
import { type } from "../helpers";
const json = type(languageDefinition);

describe("Basic JSON", () => {
  test("Empty object", () => {
    const tokens = json(`{}`);
    expect(tokens).toEqual([
      {
        x: 0,
        y: 0,
        text: "{",
        size: 1,
        type: "token-object-start-0",
        hash: "emolrh",
        parent: expect.any(Object),
        next: tokens[1],
        prev: undefined,
      },
      {
        x: 1,
        y: 0,
        text: "}",
        size: 1,
        type: "token-object-end-0",
        hash: "4ie197",
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
        x: 0,
        y: 0,
        text: '"string"',
        size: 8,
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
    expect(types).toEqual(["token-array-start-0", "token-array-end-0"]);
  });

  test("Nested array", () => {
    const tokens = json(`[[]]`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-array-start-0",
      "token-array-start-1",
      "token-array-end-1",
      "token-array-end-0",
    ]);
  });

  test("Standalone null", () => {
    const tokens = json(`null`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword-null"]);
  });

  test("Key and string value", () => {
    const tokens = json(`{ "foo": "bar" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "value",
      "token-object-end-0",
    ]);
  });

  test("Key and integer value", () => {
    const tokens = json(`{ "foo": 42 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "number",
      "token-object-end-0",
    ]);
  });

  test("Key and float value", () => {
    const tokens = json(`{ "foo": 42.23 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "number",
      "token-object-end-0",
    ]);
  });

  test("Key and null value", () => {
    const tokens = json(`{ "foo": null }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "keyword-null",
      "token-object-end-0",
    ]);
  });

  test("Key and true value", () => {
    const tokens = json(`{ "foo": true }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "keyword-true",
      "token-object-end-0",
    ]);
  });

  test("Key and false value", () => {
    const tokens = json(`{ "foo": false }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "keyword-false",
      "token-object-end-0",
    ]);
  });

  test("Key and object value", () => {
    const tokens = json(`{ "foo": { "bar": false } }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "token-object-start-1",
      "string",
      "punctuation",
      "keyword-false",
      "token-object-end-1",
      "token-object-end-0",
    ]);
  });

  test("Multiple keys and values", () => {
    const tokens = json(`{ "foo": false, "bar": 0 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "keyword-false",
      "punctuation",
      "string",
      "punctuation",
      "number",
      "token-object-end-0",
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
        isHighlight: false,
        language: undefined,
      },
      "}"
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0",
      "string",
      "punctuation",
      "number",
      "token-object-end-0",
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
        isHighlight: false,
        language: undefined,
      },
      ": 42}"
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token-object-start-0", // {
      "string", // "foo
      "string", // bar" (inside box, must not be joined with rest)
      "punctuation", // :
      "number", // 42
      "token-object-end-0", // }
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
