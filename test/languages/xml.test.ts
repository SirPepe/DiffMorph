import { type } from "../helpers";
const xml = type("xml");

describe("XML features", () => {
  test("XML declaration", () => {
    const types = xml(`<?xml version="1.0" ?>`);
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
    const types = xml(`<foo>Hello<bar /></foo>`);
    expect(types).toEqual(["tag", "tag", "token", "tag", "tag", "tag"]);
  });

  test("Tag namespace", () => {
    const types = xml(`<ns:foo>Hello</ns:foo>`);
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
    const types = xml(`<foo ns:attr="foo">Hello</foo>`);
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
    const types = xml(`<foo>Hello <![CDATA[ World ]]></foo>`);
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
      "comment cdata",
      "tag",
    ]);
  });

  test("Style attributes are normal attributes", () => {
    const types = xml(`<foo style="test"></foo>`);
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
    const types = xml(`<style>Hello</style>`);
    expect(types).toEqual(["tag", "tag", "token", "tag"]);
  });

  test("Script tags are normal tags", () => {
    const types = xml(`<script>let x</script>`);
    expect(types).toEqual(["tag", "tag", "token", "token", "tag"]);
  });
});
