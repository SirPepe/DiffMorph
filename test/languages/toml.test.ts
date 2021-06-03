import { type } from "../helpers";
const toml = type("toml");

describe("Basic TOML", () => {
  test("key and value", () => {
    const types = toml(`foo = "bar"`);
    expect(types).toEqual(["key", "operator", "value", "value", "value"]);
  });

  test("multi-line string value", () => {
    const types = toml(`foo = """
Hello
"""`);
    expect(types).toEqual([
      "key",
      "operator",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
    ]);
  });

  test("quoted key and value", () => {
    const types = toml(`'foo' = "bar"`);
    expect(types).toEqual([
      "key",
      "key",
      "key",
      "operator",
      "value",
      "value",
      "value",
    ]);
  });

  test("multiple keys and values", () => {
    const types = toml(`'foo' = "bar"
bar = 42`);
    expect(types).toEqual([
      "key",
      "key",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "key",
      "operator",
      "number",
    ]);
  });

  test("multiple keys and values plus header and comment", () => {
    const types = toml(`[something]
'foo.bar.baz' = "bar" # yo
bar.x = +42_23.1337

[[something.'else']]
time = 07:32:00`);
    expect(types).toEqual([
      "header",
      "header",
      "header",
      "key",
      "key",
      "key",
      "key",
      "key",
      "key",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "comment",
      "comment",
      "key",
      "key",
      "key",
      "operator",
      "number",
      "header",
      "header",
      "header",
      "header",
      "header",
      "header",
      "header",
      "key",
      "operator",
      "token-datetime",
      "token-datetime",
      "token-datetime",
      "token-datetime",
      "token-datetime",
    ]);
  });

  test("array", () => {
    const types = toml(`foo = ["bar", 23, .1, inf, -nan, true]`);
    expect(types).toEqual([
      "key",
      "operator",
      "punctuation array-start-0",
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
      "keyword",
      "punctuation array-end-0",
    ]);
  });

  test("inline table", () => {
    const types = toml(`name = { first = "Peter", last = "Kröner" }`);
    expect(types).toEqual([
      "key",
      "operator",
      "punctuation table-start-0",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "punctuation",
      "key",
      "operator",
      "value", // "
      "value", // Kr
      "value", // ö
      "value", // ner
      "value", // "
      "punctuation table-end-0",
    ]);
  });
  test("typical Cargo.toml", () => {
    const types = toml(`[[package]]
name = "hello_world"
version = "0.1.0"
dependencies = [
  "rand 0.1.0 (git+https://github.com/rust-lang-nursery/rand.git#9f35b8e439eeedd60b9414c58f389bdc6a3284f9)",
]

[[package]]
name = "rand"
version = "0.1.0"
source = "git+https://github.com/rust-lang-nursery/rand.git#9f35b8e439eeedd60b9414c58f389bdc6a3284f9"`);
    expect(types).toEqual([
      "header",
      "header",
      "header",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "key",
      "operator",
      "punctuation array-start-0",
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
      "punctuation array-end-0",
      "header",
      "header",
      "header",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "key",
      "operator",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "value",
      "key",
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
