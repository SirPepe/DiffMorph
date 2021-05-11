import { type } from "../helpers";
const xml = type("xml");

describe("XML features", () => {
  test("XML declaration", () => {
    const tokens = xml(`<?xml version="1.0" ?>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag-xml",
      "attribute-xml",
      "operator-xml",
      "value-xml",
      "value-xml",
      "value-xml",
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
      "operator namespace-tag",
      "tag",
      "tag",
      "token",
      "tag",
      "operator namespace-tag",
      "tag",
    ]);
  });

  test("Attribute namespace", () => {
    const tokens = xml(`<foo ns:attr="foo">Hello</foo>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator namespace-attribute",
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
      "comment cdata",
      "comment cdata",
      "comment cdata",
      "comment cdata",
      "comment cdata",
      "comment cdata",
      "comment cdata",
      "comment cdata",
      "tag",
    ]);
  });

  test("Style attributes are normal attributes", () => {
    const tokens = xml(`<foo style="test"></foo>`);
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

  test("Style tags are normal tags", () => {
    const tokens = xml(`<style>Hello</style>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["tag", "tag", "token", "tag"]);
  });

  test("Script tags are normal tags", () => {
    const tokens = xml(`<script>let x</script>`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual(["tag", "tag", "token", "token", "tag"]);
  });
});
