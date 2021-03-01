import { diffAll } from "../../src/diff";
import * as language from "../../src/languages/json";
import { toKeyframes } from "../../src/render/keyframes";
import { toDom } from "../../src/render/toDom";
import { type } from "../helpers";
const json = type(language);

describe("toDom", () => {
  test("renders to DOM", () => {
    const keyframes = toKeyframes(
      diffAll([json("{}"), json("  {}"), json("    {}")])
    );
    toDom(keyframes);
  });
});
