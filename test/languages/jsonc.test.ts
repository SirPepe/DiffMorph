import * as language from "../../src/languages/jsonc";
import { type } from "../helpers";
const jsonc = type(language);

describe("JSONC", () => {
  test("Key and string value", () => {
    const tokens = jsonc(`{ "foo": "bar" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "string", "token", "value", "token"]);
  });

  test("Line comment", () => {
    const tokens = jsonc("// a\n{}");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment-line", "token", "token"]);
  });

  test("Single-line block comment", () => {
    const tokens = jsonc("/* a */\n{}");
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment-block", "token", "token"]);
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
      "token",
      "token",
    ]);
  });

  test("Comment tokens in strings", () => {
    const tokens = jsonc(`{ "//foo": "/*bar*/" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["token", "string", "token", "value", "token"]);
  });
});
