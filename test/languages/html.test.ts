import { type } from "../helpers";
const html = type("html");

describe("Basic HTML", () => {
  test("Simple element", () => {
    const types = html(`<p></p>`);
    expect(types).toEqual(["tag", "tag", "tag"]);
  });

  test("Simple self-closing element", () => {
    const types = html(`<br />`);
    expect(types).toEqual(["tag", "tag"]);
  });

  test("Simple self-closing element with attribute", () => {
    const types = html(`<img src="foo.png" />`);
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
    const types = html(`<input disabled type="text" />`);
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
    const types = html(`<img data-src="foo.png" />`);
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
    const types = html(`<br id=foo />`);
    expect(types).toEqual(["tag", "attribute", "operator", "value", "tag"]);
  });

  test("Simple self-closing element with empty attribute value", () => {
    const types = html(`<img src="" />`);
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
    const types = html(`<p class="foo"><b id=bold>Text</b></p>`);
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
    const types = html(`<hello-world id="foo"></hello-world>`);
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
    const types = html(`<!-- Hello World -->`);
    expect(types).toEqual(["comment", "comment", "comment", "comment"]);
  });

  test("Traps in comments", () => {
    const types = html(`<!-- -- -->`); // actually invalid xml
    expect(types).toEqual(["comment", "comment", "comment"]);
  });

  test("More traps in comments", () => {
    const types = html(`<!-- -> -->`);
    expect(types).toEqual(["comment", "comment", "comment"]);
  });
});

describe("inline CSS", () => {
  test("inline CSS", () => {
    const types = html(`<div style="color: red;"></div>`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "property",
      "punctuation",
      "value color",
      "punctuation",
      "value",
      "tag",
      "tag",
    ]);
  });

  test("inline CSS with escaped quotes inside a string", () => {
    const types = html(`<div style="background:url('\\"')"></div>`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "property",
      "punctuation",
      "keyword",
      "punctuation url",
      "string url",
      "string url",
      "string url",
      "string url",
      "punctuation url",
      "value",
      "tag",
      "tag",
    ]);
  });

  test("empty inline CSS", () => {
    const types = html(`<div style=""></div>`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "tag",
      "tag",
    ]);
  });

  test("style attribute without value", () => {
    const types = html(`<div style></div>`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "tag",
      "tag",
    ]);
  });

  test("non-terminated inline CSS", () => {
    const types = html(`<div style="color: red`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "property",
      "punctuation",
      "value color",
    ]);
  });
});

describe("embedded CSS", () => {
  test("embedded CSS", () => {
    const types = html(`<style>.foo { color: red }</style>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "selector",
      "punctuation rule-start",
      "property",
      "punctuation",
      "value color",
      "punctuation rule-end",
      "tag",
    ]);
  });

  test("empty embedded CSS", () => {
    const types = html(`<style></style>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "tag",
    ]);
  });

  test("non-terminated embedded CSS", () => {
    const types = html(`<style>.foo { color: red }`);
    expect(types).toEqual([
      "tag",
      "tag",
      "selector",
      "punctuation rule-start",
      "property",
      "punctuation",
      "value color",
      "punctuation rule-end",
    ]);
  });

  test("embedded CSS embedding a url string '</style>'", () => {
    const types = html(`<style>.foo { background: url("</style>") }</style>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "selector",
      "punctuation rule-start",
      "property",
      "punctuation",
      "keyword",
      "punctuation url",
      "string url",
      "string url",
      "string url",
      "string url",
      "string url",
      "string url",
      "punctuation url",
      "punctuation rule-end",
      "tag",
    ]);
  });

  test("embedded CSS embedding an attribute string '</style>'", () => {
    const types = html(`<style>.foo[bar="</style>"] {}</style>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "selector",
      "punctuation-selector",
      "selector",
      "selector",
      "string",
      "string",
      "string",
      "string",
      "string",
      "string",
      "punctuation-selector",
      "punctuation rule-start",
      "punctuation rule-end",
      "tag",
    ]);
  });

  test("embedded CSS with attributes on the style tag", () => {
    const types = html(`<style class="a" disabled>.foo { color: red }</style>`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "attribute",
      "tag",
      "selector",
      "punctuation rule-start",
      "property",
      "punctuation",
      "value color",
      "punctuation rule-end",
      "tag",
    ]);
  });
});

describe("embedded JavaScript", () => {
  test("embedded JS", () => {
    const types = html(`<script>let x = 42;</script>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "keyword",
      "token",
      "operator",
      "number",
      "punctuation",
      "tag",
    ]);
  });

  test("embedded JS calling a function (regression)", () => {
    const types = html(`<script>foo();</script>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "call",
      "punctuation call-start-0",
      "punctuation call-end-0",
      "punctuation",
      "tag",
    ]);
  });

  test("empty embedded JS", () => {
    const types = html(`<script></script>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "tag",
    ]);
  });

  test("non-terminated embedded JS", () => {
    const types = html(`<script>let x = 42;`);
    expect(types).toEqual([
      "tag",
      "tag",
      "keyword",
      "token",
      "operator",
      "number",
      "punctuation",
    ]);
  });

  test("embedded JS module (attributes)", () => {
    const types = html(`<script type="module">let x = 42;</script>`);
    expect(types).toEqual([
      "tag",
      "attribute",
      "operator",
      "value",
      "value",
      "value",
      "tag",
      "keyword",
      "token",
      "operator",
      "number",
      "punctuation",
      "tag",
    ]);
  });

  test("embedded JS with </script> in a string", () => {
    const types = html(`<script>let x = "</script>";</script>`);
    expect(types).toEqual([
      "tag",
      "tag",
      "keyword",
      "token",
      "operator",
      "string",
      "string",
      "string",
      "string",
      "string",
      "string",
      "punctuation",
      "tag",
    ]);
  });
});

describe("non-support for XML features", () => {
  // Just verify that xml features are not enabled by accident
  const banned = new Set(["comment-cdata", "tag-xml", "operator-namespace"]);
  test("XML declaration", () => {
    const types = html(`<?xml version="1.0" ?>`);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
  test("Tag namespace", () => {
    const types = html(`<ns:foo>Hello</ns:foo>`);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
  test("Attribute namespace", () => {
    const types = html(`<foo ns:attr="foo">Hello</foo>`);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
  test("CDATA sections", () => {
    const types = html(`<foo>Hello <![CDATA[ World ]]></foo>`);
    expect(types.some((type) => banned.has(type))).toBe(false);
  });
});
