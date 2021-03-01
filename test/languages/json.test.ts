import * as language from "../../src/languages/json";
import { type } from "../helpers";
const json = type(language);

describe("Basic JSON", () => {
  test("Empty object", () => {
    const tokens = json(`{}`);
    expect(tokens).toEqual([
      {
        x: 0,
        y: 0,
        text: "{",
        type: "token",
        hash: "pz3cxk",
        parent: expect.any(Object),
      },
      {
        x: 1,
        y: 0,
        text: "}",
        type: "token",
        hash: "6xavw7",
        parent: expect.any(Object),
      },
    ]);
  });

  test("Empty array", () => {
    const tokens = json(`[]`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "token"]);
  });

  test("Standalone null", () => {
    const tokens = json(`null`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["keyword-null"]);
  });

  test("Key and string value", () => {
    const tokens = json(`{ "foo": "bar" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "string", "token", "value", "token"]);
  });

  test("Key and integer value", () => {
    const tokens = json(`{ "foo": 42 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "string", "token", "number", "token"]);
  });

  test("Key and float value", () => {
    const tokens = json(`{ "foo": 42.23 }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "string", "token", "number", "token"]);
  });

  test("Key and null value", () => {
    const tokens = json(`{ "foo": null }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token",
      "string",
      "token",
      "keyword-null",
      "token",
    ]);
  });

  test("Key and true value", () => {
    const tokens = json(`{ "foo": true }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token",
      "string",
      "token",
      "keyword-true",
      "token",
    ]);
  });

  test("Key and false value", () => {
    const tokens = json(`{ "foo": false }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token",
      "string",
      "token",
      "keyword-false",
      "token",
    ]);
  });

  test("Key and object value", () => {
    const tokens = json(`{ "foo": { "bar": false } }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token",
      "string",
      "token",
      "token",
      "string",
      "token",
      "keyword-false",
      "token",
      "token",
    ]);
  });
});

describe("Boxes", () => {
  test("Basic box", () => {
    const tokens = json(
      "{",
      {
        meta: {
          tagName: "span",
          attributes: [],
          isHighlight: false,
        },
        hash: "asdf",
        content: ['"x": 42'],
      },
      "}"
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "string", "token", "number", "token"]);
    expect(tokens[0].parent).toBe(tokens[4].parent);
    expect(tokens[1].parent).toBe(tokens[2].parent);
    expect(tokens[2].parent).toBe(tokens[3].parent);
    expect(tokens[0].parent).not.toBe(tokens[1].parent);
  });

  test("Box between theoretically joinable tokens", () => {
    const tokens = json(
      '{"foo',
      {
        meta: {
          tagName: "span",
          attributes: [],
          isHighlight: false,
        },
        hash: "asdf",
        content: ['bar"'],
      },
      ": 42}"
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "token", // {
      "string", // "foo
      "string", // bar" (inside box, must not be joined with rest)
      "token", // :
      "number", // 42
      "token", // }
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
