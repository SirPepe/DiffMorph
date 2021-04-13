import { registerLanguage } from "../../src/languages";
import { languageDefinition } from "../../src/languages/css";
import { type } from "../helpers";

registerLanguage({
  name: "inline-css",
  definitionFactory: () =>
    languageDefinition.definitionFactory({ inline: true }),
  postprocessor: languageDefinition.postprocessor,
});
const css = type("css");
const inlineCss = type("inline-css");

describe("Basic CSS", () => {
  test("Simple rule", () => {
    const tokens = css(`div { color: red; font-family: sans-serif; }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "token",
      "punctuation",
      "property",
      "punctuation",
      "token",
      "token",
      "token",
      "punctuation",
      "punctuation-rule-end",
    ]);
  });
  test("Simple rule with non-trivial selector", () => {
    const tokens = css(
      `div + .foo, :host([disabled="true"]) ~ a { color: red; }`
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "string",
      "string",
      "string",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "token",
      "punctuation",
      "punctuation-rule-end",
    ]);
  });
  test("Two simple rules", () => {
    const tokens = css(`div { color: red; } #foo { font-family: sans-serif; }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "token",
      "punctuation",
      "punctuation-rule-end",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "token",
      "token",
      "token",
      "punctuation",
      "punctuation-rule-end",
    ]);
  });
  test("Custom properties", () => {
    const tokens = css(`:root { --foo: red } .foo { color: var(--foo) }`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "token",
      "punctuation-rule-end",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "keyword-function",
      "punctuation",
      "token",
      "token",
      "token",
      "punctuation",
      "punctuation-rule-end",
    ]);
  });
});

describe("At-rules", () => {
  test("Simple media query", () => {
    const tokens = css(`@media print {}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-media",
      "keyword-media-type",
      "punctuation-at-media-start",
      "punctuation-at-media-end",
    ]);
  });

  test("Simple media query with media features", () => {
    const tokens = css(`@media (min-width: 800px) {}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-media",
      "punctuation-at-media-argument",
      "token",
      "token",
      "token",
      "punctuation-at-media",
      "number-at-media",
      "punctuation-at-media-argument",
      "punctuation-at-media-start",
      "punctuation-at-media-end",
    ]);
  });

  test("Simple media query with media type and features", () => {
    const tokens = css(`@media screen and (min-width: 800px) {}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-media",
      "keyword-media-type",
      "operator",
      "punctuation-at-media-argument",
      "token",
      "token",
      "token",
      "punctuation-at-media",
      "number-at-media",
      "punctuation-at-media-argument",
      "punctuation-at-media-start",
      "punctuation-at-media-end",
    ]);
  });

  test("Nested media queries", () => {
    const tokens = css(
      `@media screen and (min-width: 800px) { @media print {} }`
    );
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-media",
      "keyword-media-type",
      "operator",
      "punctuation-at-media-argument",
      "token",
      "token",
      "token",
      "punctuation-at-media",
      "number-at-media",
      "punctuation-at-media-argument",
      "punctuation-at-media-start",
      "keyword-at-media",
      "keyword-media-type",
      "punctuation-at-media-start",
      "punctuation-at-media-end",
      "punctuation-at-media-end",
    ]);
  });

  test("Simple @supports query", () => {
    const tokens = css(`@supports (display: flex) {}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-supports",
      "punctuation-at-supports-argument",
      "token",
      "punctuation-at-supports",
      "token",
      "punctuation-at-supports-argument",
      "punctuation-at-supports-start",
      "punctuation-at-supports-end",
    ]);
  });

  test("@import with bare string", () => {
    const tokens = css(`@import "foo.css"`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-import",
      "string",
      "string",
      "string",
      "string",
      "string",
    ]);
  });

  test("@import with quoted url", () => {
    const tokens = css(`@import url("foo.css")`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-import",
      "keyword-url",
      "punctuation-url",
      "string-url",
      "string-url",
      "string-url",
      "string-url",
      "string-url",
      "punctuation-url",
    ]);
  });

  test("@import with unquoted url", () => {
    const tokens = css(`@import url(foo.css)`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-import",
      "keyword-url",
      "punctuation-url",
      "string-url",
      "string-url",
      "string-url",
      "punctuation-url",
    ]);
  });

  test("@keyframes", () => {
    const tokens = css(`@keyframes foo {
  from { opacity: 0; }
  30% { opacity: 0.5; }
  68%, 72% { opacity: 0.9; }
}`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "keyword-at-keyframes",
      "token",
      "punctuation-at-keyframes-start",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "number",
      "punctuation",
      "punctuation-rule-end",
      "value-selector",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "number",
      "punctuation",
      "punctuation-rule-end",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "value-selector",
      "punctuation-rule-start",
      "property",
      "punctuation",
      "number",
      "punctuation",
      "punctuation-rule-end",
      "punctuation-at-keyframes-end",
    ]);
  });
});

describe("Inline CSS", () => {
  test("Inline CSS", () => {
    const tokens = inlineCss(`color: red; font-family: sans-serif`);
    const types = tokens.map((token) => token.type);
    expect(types).toEqual([
      "property",
      "punctuation",
      "token",
      "punctuation",
      "property",
      "punctuation",
      "token",
      "token",
      "token",
    ]);
  });
});
