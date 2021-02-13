import language from "../../src/languages/html";
import { type } from "./helpers";
const html = type(language);

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
