import { type } from "../helpers";
const toml = type("toml");

describe("Basic TOML", () => {
  test("key and value", () => {
    const tokens = toml(`foo = "bar"`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["string-key", "operator", "value", "value", "value"]);
  });

  test("quoted key and value", () => {
    const tokens = toml(`'foo' = "bar"`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "string-key",
      "string-key",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
    ]);
  });

  test("multiple keys and values", () => {
    const tokens = toml(`'foo' = "bar"
bar = 42`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "string-key",
      "string-key",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "string-key",
      "operator",
      "number",
    ]);
  });

  test("multiple keys and values plus header and comment", () => {
    const tokens = toml(`[something]
'foo.bar.baz' = "bar" # yo
bar.x = +42_23.1337`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "literal-header",
      "literal-header",
      "literal-header",
      "string-key",
      "string-key",
      "string-key",
      "string-key",
      "string-key",
      "string-key",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "comment",
      "comment",
      "string-key",
      "string-key",
      "string-key",
      "operator",
      "number",
    ]);
  });

  test("array", () => {
    const tokens = toml(`foo = ["bar", 23, .1, inf, -nan, true]`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "string-key",
      "operator",
      "punctuation-array-start-0",
      "value",
      "value",
      "value",
      "punctuation",
      "number",
      "punctuation",
      "number",
      "punctuation",
      "number",
      "punctuation",
      "number",
      "punctuation",
      "keyword-true",
      "punctuation-array-end-0",
    ]);
  });
});
