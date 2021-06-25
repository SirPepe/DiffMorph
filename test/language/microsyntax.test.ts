import { registerLanguage } from "../../src/languages";
import { cStyleBlockComment } from "../../src/languages/microsyntax/cStyleBlockComment";
import { type } from "../helpers";

// Test language types tokens "a" always as "a" and "b" as "b" ONLY IF it comes
// after an A. Additionally "b" gets typed as "c" when preceded by two "a". This
// can be used to test that embedded languages (or microsyntaxes in this case)
// get proxied when calling the language function.
registerLanguage({
  name: "test",
  theme: {},
  definitionFactory: () => (token) => {
    if (cStyleBlockComment.start(token)) {
      return cStyleBlockComment.process();
    }
    if (token.text === "a") {
      return "a";
    }
    if (
      token.text === "b" &&
      token.prev?.type === "a" &&
      token.prev?.prev?.type === "a"
    ) {
      return "c";
    }
    if (token.text === "b" && token.prev?.type === "a") {
      return "b";
    }
    return "f";
  },
  postprocessor: (): boolean => false,
});

describe("Microsyntax", () => {
  test("Test language definition works as expected without microsyntax", () => {
    const types = type("test")(`a b`);
    expect(types).toEqual(["a", "b"]);
  });

  test("Language definition gets proxied around embedded microsyntax", () => {
    const types = type("test")(`a /**/ b`);
    expect(types).toEqual(["a", "comment", "comment", "b"]);
  });

  test("Language definition gets proxied around embedded microsyntax", () => {
    const types = type("test")(`a /**/ a /**/ b`);
    expect(types).toEqual([
      "a",
      "comment",
      "comment",
      "a",
      "comment",
      "comment",
      "c",
    ]);
  });
});
