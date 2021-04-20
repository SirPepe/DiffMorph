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
bar.x = +42_23.1337

[[something.'else']]
time = 07:32:00`);
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
      "literal-header",
      "literal-header",
      "literal-header",
      "literal-header",
      "literal-header",
      "literal-header",
      "literal-header",
      "string-key",
      "operator",
      "token-datetime",
      "token-datetime",
      "token-datetime",
      "token-datetime",
      "token-datetime"
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

  test("inline table", () => {
    const tokens = toml(`name = { first = "Peter", last = "Kröner" }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "string-key",
      "operator",
      "punctuation-table-start-0",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "punctuation",
      "string-key",
      "operator",
      "value", // "
      "value", // Kr
      "value", // ö
      "value", // ner
      "value", // "
      "punctuation-table-end-0",
    ]);
  });
  test("typical Cargo.toml", () => {
    const tokens = toml(`[[package]]
name = "hello_world"
version = "0.1.0"
dependencies = [
  "rand 0.1.0 (git+https://github.com/rust-lang-nursery/rand.git#9f35b8e439eeedd60b9414c58f389bdc6a3284f9)",
]

[[package]]
name = "rand"
version = "0.1.0"
source = "git+https://github.com/rust-lang-nursery/rand.git#9f35b8e439eeedd60b9414c58f389bdc6a3284f9"`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "literal-header",
      "literal-header",
      "literal-header",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "string-key",
      "operator",
      "punctuation-array-start-0",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "punctuation",
      "punctuation-array-end-0",
      "literal-header",
      "literal-header",
      "literal-header",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "string-key",
      "operator",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
    ]);
  });
});
