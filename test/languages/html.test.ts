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
});
