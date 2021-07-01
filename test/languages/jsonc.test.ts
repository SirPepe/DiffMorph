import { type } from "../helpers";
const jsonc = type("jsonc");

describe("JSONC", () => {
  test("Key and string value", () => {
    const types = jsonc(`{ "foo": "bar" }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });

  test("Line comment", () => {
    const types = jsonc("// a\n{}");
    expect(types).toEqual([
      "comment",
      "comment",
      "punctuation object-start-0",
      "punctuation object-end-0",
    ]);
  });

  test("Single-line block comment", () => {
    const types = jsonc("/* a */\n{}");
    expect(types).toEqual([
      "comment",
      "comment",
      "comment",
      "punctuation object-start-0",
      "punctuation object-end-0",
    ]);
  });

  test("Multi-line block comment", () => {
    const types = jsonc(`/*
  a
*/\n{}`);
    expect(types).toEqual([
      "comment",
      "comment",
      "comment",
      "punctuation object-start-0",
      "punctuation object-end-0",
    ]);
  });

  test("Comment tokens in strings", () => {
    const types = jsonc(`{ "//foo": "/*bar*/" }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });

  test("Line comment directly after something else", () => {
    const types = jsonc("{}// a");
    expect(types).toEqual([
      "punctuation object-start-0",
      "punctuation object-end-0",
      "comment",
      "comment",
    ]);
  });
});
