import language from "../../src/languages/json";
import { type } from "./helpers";
const json = type(language);

describe("Basic JSON", () => {
  test("Empty object", () => {
    const tokens = json(`{}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "token"]);
  });

  test("Empty object", () => {
    const tokens = json(`[]`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "token"]);
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
});

describe("Comments in JSON", () => {
  test("Line comment", () => {
    const tokens = json("// a\n{}");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment-line", "token", "token"]);
  });

  test("Single-line block comment", () => {
    const tokens = json("/* a */\n{}");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment-block", "token", "token"]);
  });

  test("Multi-line block comment", () => {
    const tokens = json(`/*
  a
*/\n{}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "comment-block",
      "comment-block",
      "comment-block",
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
        tagName: "span",
        attributes: [],
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
});
