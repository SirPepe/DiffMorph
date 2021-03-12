import { diffAll } from "../../src/diff";
import * as language from "../../src/languages/json";
import { toKeyframes } from "../../src/render/keyframes";
import { toDom } from "../../src/render/toDom";
import { type } from "../helpers";
const json = type(language);

describe("toDom", () => {
  test("renders to DOM", () => {
    const keyframes = toKeyframes(
      diffAll([json("{}"), json("  {}"), json("    {\n}")])
    );
    const [element, maxWidth, maxHeight] = toDom(keyframes);
    expect(maxWidth).toBe(5);
    expect(maxHeight).toBe(2);
  });
});
