import * as language from "../../src/languages/xml";
import { type } from "../helpers";
const xml = type(language);

describe("XML features", () => {
  test("XML declaration", () => {
    const tokens = xml(`<?xml version="1.0" ?>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag-xml",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag-xml",
    ]);
  });

  test("Regular tags", () => {
    const tokens = xml(`<foo>Hello<bar /></foo>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["tag", "tag", "token", "tag", "tag", "tag"]);
  });

  test("Tag namespace", () => {
    const tokens = xml(`<ns:foo>Hello</ns:foo>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "operator-namespace",
      "tag",
      "tag",
      "token",
      "tag",
      "operator-namespace",
      "tag",
    ]);
  });

  test("Attribute namespace", () => {
    const tokens = xml(`<foo ns:attr="foo">Hello</foo>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator-namespace",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
      "token",
      "tag",
    ]);
  });

  test("CDATA sections", () => {
    const tokens = xml(`<foo>Hello <![CDATA[ World ]]></foo>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "tag",
      "token",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "comment-cdata",
      "tag",
    ]);
  });
});
