import { type } from "../helpers";
const html = type("html");

describe("Basic HTML", () => {
  test("Simple element", () => {
    const tokens = html(`<p></p>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["tag", "tag", "tag"]);
  });

  test("Simple self-closing element", () => {
    const tokens = html(`<br />`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["tag", "tag"]);
  });

  test("Simple self-closing element with attribute", () => {
    const tokens = html(`<img src="foo.png" />`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
    ]);
  });

  test("Simple self-closing with boolean attribute", () => {
    const tokens = html(`<input disabled type="text" />`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
    ]);
  });

  test("Simple self-closing element with attribute name with dashes", () => {
    const tokens = html(`<img data-src="foo.png" />`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
    ]);
  });

  test("Simple self-closing element with unquoted attribute", () => {
    const tokens = html(`<br id=foo />`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["tag", "attribute", "operator", "value", "tag"]);
  });

  test("Simple self-closing element with empty attribute value", () => {
    const tokens = html(`<img src="" />`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "tag",
    ]);
  });

  test("Nested elements", () => {
    const tokens = html(`<p class="foo"><b id=bold>Text</b></p>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
      "tag",
      "attribute",
      "operator",
      "value",
      "tag",
      "token",
      "tag",
      "tag",
    ]);
  });

  test("Custom element", () => {
    const tokens = html(`<hello-world id="foo"></hello-world>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
      "tag",
    ]);
  });

  test("Basic comment", () => {
    const tokens = html(`<!-- Hello World -->`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment", "comment", "comment", "comment"]);
  });

  test("Traps in comments", () => {
    const tokens = html(`<!-- -- -->`); // actually invalid xml
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment", "comment", "comment", "comment"]);
  });

  test("More traps in comments", () => {
    const tokens = html(`<!-- -> -->`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["comment", "comment", "comment", "comment"]);
  });
});

describe("embedded languages", () => {
  test("inline CSS", () => {
    const tokens = html(`<div style="color: red;"></div>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "property",
      "punctuation",
      "token",
      "punctuation",
      "value",
      "tag",
      "tag",
    ]);
  });

  test.skip("embedded CSS", () => {
    const tokens = html(`<style>.foo { color: red }</style>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "tag",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "token",
      "punctuation-rule-end",
      "tag",
    ]);
  });
});

describe("non-support for XML features", () => {
  // Just verify that xml features are not enabled by accident
  const banned = new Set(["comment-cdata", "tag-xml", "operator-namespace"]);
  test("XML declaration", () => {
    const tokens = html(`<?xml version="1.0" ?>`);
    const types = tokens.map((token) => token.type);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
  test("Tag namespace", () => {
    const tokens = html(`<ns:foo>Hello</ns:foo>`);
    const types = tokens.map((token) => token.type);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
  test("Attribute namespace", () => {
    const tokens = html(`<foo ns:attr="foo">Hello</foo>`);
    const types = tokens.map((token) => token.type);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
  test("CDATA sections", () => {
    const tokens = html(`<foo>Hello <![CDATA[ World ]]></foo>`);
    const types = tokens.map((token) => token.type);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
});
