import { type } from "../helpers";
const json = type("json");

describe("Basic JSON", () => {
  test("Empty object", () => {
    const types = json(`{}`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "punctuation object-end-0",
    ]);
  });

  test("Empty array", () => {
    const types = json(`[]`);
    expect(types).toEqual([
      "punctuation array-start-0",
      "punctuation array-end-0",
    ]);
  });

  test("Nested array", () => {
    const types = json(`[[]]`);
    expect(types).toEqual([
      "punctuation array-start-0",
      "punctuation array-start-1",
      "punctuation array-end-1",
      "punctuation array-end-0",
    ]);
  });

  test("Standalone null", () => {
    const types = json(`null`);
    expect(types).toEqual(["keyword"]);
  });

  test("Key and string value", () => {
    const types = json(`{ "foo": "bar" }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });

  test("Key and multiline string", () => {
    const types = json(`{ "foo": "bar\\nbaz" }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "value",
      "punctuation object-end-0",
    ]);
  });

  test("Key and integer value", () => {
    const types = json(`{ "foo": 42 }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Key and float value", () => {
    const types = json(`{ "foo": 42.23 }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "number",
      "punctuation object-end-0",
    ]);
  });

  test("Key and null value", () => {
    const types = json(`{ "foo": null }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-0",
    ]);
  });

  test("Key and true value", () => {
    const types = json(`{ "foo": true }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-0",
    ]);
  });

  test("Key and false value", () => {
    const types = json(`{ "foo": false }`);
    expect(types).toEqual([
      "punctuation object-start-0",
      "string",
      "punctuation",
      "keyword",
      "punctuation object-end-0",
    ]);
  });

  test("Key and object value", () => {
    const types = json(`{ "foo": { "bar": false } }`);
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
    const types = json(`{ "foo": false, "bar": 0 }`);
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

describe("broken JSON", () => {
  test("continues on new line after unterminated string", () => {
    const types = json(`{
  "a": "b,
  "c": "d"
}`);
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
    const types = json(`// Hello`);
    expect(types).toEqual(["token", "token", "token"]);
  });

  test("does not support block comments", () => {
    const types = json(`/* Hello */`);
    expect(types).toEqual(["token", "token", "token", "token", "token"]);
  });
});
