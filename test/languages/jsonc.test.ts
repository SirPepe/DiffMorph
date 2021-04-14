import { type } from "../helpers";
const jsonc = type("jsonc");

describe("JSONC", () => {
  test("Key and string value", () => {
    const tokens = jsonc(`{ "foo": "bar" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation-object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation-object-end-0",
    ]);
  });

  test("Line comment", () => {
    const tokens = jsonc("// a\n{}");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "comment-line",
      "comment-line",
      "punctuation-object-start-0",
      "punctuation-object-end-0",
    ]);
  });

  test("Single-line block comment", () => {
    const tokens = jsonc("/* a */\n{}");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "comment-block",
      "comment-block",
      "comment-block",
      "punctuation-object-start-0",
      "punctuation-object-end-0",
    ]);
  });

  test("Multi-line block comment", () => {
    const tokens = jsonc(`/*
  a
*/\n{}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "comment-block",
      "comment-block",
      "comment-block",
      "punctuation-object-start-0",
      "punctuation-object-end-0",
    ]);
  });

  test("Comment tokens in strings", () => {
    const tokens = jsonc(`{ "//foo": "/*bar*/" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "punctuation-object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation-object-end-0",
    ]);
  });
});
