import { diffAll } from "../../src/lib/diff";
import { languageDefinition } from "../../src/languages/json";
import { toKeyframes } from "../../src/lib/keyframes";
import { toDom } from "../../src/output/toDom";
import { type } from "../helpers";
const json = type(languageDefinition);

describe("toDom", () => {
  test("renders to DOM", () => {
    const keyframes = toKeyframes(
      diffAll([json("{}"), json("  {}"), json("    {\n}")]),
      []
    );
    const [element, maxWidth, maxHeight] = toDom(keyframes);
    expect(maxWidth).toBe(5);
    expect(maxHeight).toBe(2);
  });
});
